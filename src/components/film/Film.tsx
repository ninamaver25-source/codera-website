"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { Overlay } from "./Overlay";
import { Screen } from "./screen/Screen";
import { Devices } from "./Devices";
import { WorkScenes } from "./Work";
import { bindOverlay, updateOverlay } from "./overlayUpdate";
import { bindScreen, updateScreen } from "./screen/screenUpdate";
import { bindDevices, updateDevices } from "./devicesUpdate";
import { bindWork, updateWork } from "./workUpdate";
import { EMAIL, INSTAGRAM } from "./contact";
import { FramePlayer, placeScreen } from "./player";
import { film, JUMP, smooth, span, T, TOTAL } from "./time";
import { DICT, useLang } from "./i18n";
import { LangSwitch } from "./LangSwitch";
import "../home/sites/sites.css";
import "./film.css";
import "./screen/screen.css";
import "./chapters.css";
import "./price.css";

/**
 * The film: one pinned stage, scrubbed by scroll like a video. Lenis smooths the wheel; every
 * frame the smoothed scroll position becomes the film time, and the footage, the live displays
 * and the typography are all drawn from that single number, in the same frame. The film ends on
 * the computer with the AI price generator: the camera stops there and the page ends.
 */
export function Film() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const lang = useLang();
  const t = DICT[lang];
  /** after the words change (another language): collect them again and measure the layout again */
  const relayout = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const tr = track.current;
    const cv = canvas.current;
    if (!el || !tr || !cv) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const player = new FramePlayer(cv);
    let dirty = true;
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    let narrow = vw / vh < 1;
    let navH = 76;
    const procSteps = Array.from(el.querySelectorAll<HTMLElement>(".step-proc"));
    const navEl = el.querySelector<HTMLElement>(".fnav");
    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      narrow = vw / vh < 1;
      navH = navEl?.offsetHeight ?? 76;
      el.toggleAttribute("data-portrait", narrow);
      html.style.setProperty("--vh", `${vh}px`);
      player.resize(vw, vh, window.devicePixelRatio || 1);
      // One locked camera for the whole film, framed around the words of 01 – 04. Larger screens:
      // beside the laptop, the title standing on the far edge of the desk, the line under it on the
      // desk. Phones: above the laptop, all four ending on the same line (measured).
      const textBottom = narrow ? navH + vh * 0.02 + Math.max(0, ...procSteps.map((p) => p.offsetHeight)) : undefined;
      const box = player.layout({ vw, vh, textBottom, navH });
      if (narrow) el.style.setProperty("--proc-bottom", `${(vh - (textBottom ?? 0)).toFixed(0)}px`);
      else {
        const margin = Math.min(84, Math.max(24, vw * 0.052));
        const gap = Math.min(72, Math.max(40, vw * 0.045));
        el.style.setProperty("--proc-left", `${margin.toFixed(0)}px`);
        el.style.setProperty("--proc-w", `${Math.min(330, box.left - gap - margin).toFixed(0)}px`);
        el.style.setProperty("--proc-desk", `${box.desk.toFixed(0)}px`);
      }
      dirty = true;
    };
    bindOverlay(el);
    relayout.current = () => {
      bindOverlay(el);
      measure();
    };
    document.fonts?.ready.then(() => measure());
    if (screen.current) bindScreen(screen.current);
    bindDevices(el).then(() => (dirty = true));
    bindWork(el).then(() => (dirty = true));
    measure();

    let shown = false;
    player.onFrameLoaded = () => {
      dirty = true;
      if (!shown && player.loadedFraction > 0.06) {
        shown = true;
        setReady(true);
      }
    };
    player.load("/film/manifest.json").catch(() => setReady(true));
    const fallback = window.setTimeout(() => setReady(true), 3500);

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const lenis = reduced ? null : new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, touchMultiplier: 1.2, smoothWheel: true });
    const scrollY = () => (lenis ? lenis.animatedScroll : window.scrollY);

    let lastY = -1;
    let raf = 0;
    let lastCanvasOp = -1;
    const loop = (now: number) => {
      lenis?.raf(now);
      const y = scrollY();
      if (y !== lastY || dirty) {
        lastY = y;
        dirty = false;
        const len = tr.offsetHeight - vh;
        film.set(len > 0 ? (y - tr.offsetTop) / len : 0);
        const t = film.t;
        updateOverlay(t);
        updateScreen(t);
        updateDevices(t, vw, vh);
        updateWork(t, vw, vh, narrow, navH);

        // The footage is the studio: the opening, the laptop, the wide moments — and the room again
        // after website care. While the devices or the computer fill the frame it rests.
        const op = t < T.svcIn[1] + 0.02 || (t > T.careExit[0] && t < T.toDesk[1] + 0.05) ? 1 : 0;
        if (canvasBox.current && op !== lastCanvasOp) {
          canvasBox.current.style.visibility = op ? "visible" : "hidden";
          lastCanvasOp = op;
        }
        // Where the room gives way to a desk (or comes back from one) it is out of focus, so the two
        // never show as a double image.
        const soft = !op
          ? 0
          : t < T.careExit[0]
            ? smooth(span(t, T.svcIn[0], T.svcIn[0] + 0.45))
            : t < T.toDesk[0]
              ? 1 - smooth(span(t, T.roomBack[0] + 0.2, T.roomBack[1]))
              : smooth(span(t, T.toDesk[0], T.toDesk[0] + 0.45));
        const quad = op ? player.draw(t, soft) : null;
        const screenOp = smooth(span(t, T.screenOn[0], T.screenOn[1])) * (1 - smooth(span(t, T.screenOff[0], T.screenOff[1])));
        placeScreen(screen.current?.firstElementChild as HTMLElement | null, quad, screenOp);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* In-page jumps: the film plays to the place, it never cuts. */
    const targetOf = (to: string) => {
      const len = tr.offsetHeight - vh;
      if (JUMP[to] !== undefined) {
        const at = Math.min(TOTAL, JUMP[to]);
        return { y: tr.offsetTop + (at / TOTAL) * len, at };
      }
      const node = document.getElementById(to);
      if (!node) return null;
      const y = node.getBoundingClientRect().top + window.scrollY;
      return { y, at: TOTAL + (y - tr.offsetTop - len) / vh };
    };
    const jump = (to: string) => {
      lenis?.resize(); // the page may have just grown (the price generator's request form)
      const target = targetOf(to);
      if (!target) return;
      const dist = Math.abs(target.at - film.t);
      if (lenis) lenis.scrollTo(target.y, { duration: Math.min(4.8, 1.2 + dist * 0.12), easing: (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2) });
      else window.scrollTo(0, target.y);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>("[data-to]");
      if (!a) return;
      e.preventDefault();
      jump(a.dataset.to ?? "top");
    };
    el.addEventListener("click", onClick);

    /* Deep links: ?p=0.42 opens 42 % into the film (stills, reviews); #work, #project … open a scene. */
    const q = new URLSearchParams(window.location.search).get("p");
    const hash = window.location.hash.slice(1);
    const goTo = () => {
      let y = 0;
      if (q !== null) y = tr.offsetTop + Math.min(1, Math.max(0, parseFloat(q) || 0)) * (tr.offsetHeight - vh);
      else if (hash) y = targetOf(hash)?.y ?? 0;
      y = Math.round(y);
      window.scrollTo(0, y);
      lenis?.scrollTo(y, { immediate: true, force: true });
    };
    goTo();
    requestAnimationFrame(goTo);

    let width = vw;
    const onResize = () => {
      if (Math.abs(window.innerWidth - width) > 1 || Math.abs(window.innerHeight - vh) > 120) {
        width = window.innerWidth;
        measure();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("click", onClick);
      player.onFrameLoaded = null;
      lenis?.destroy();
      relayout.current = null;
    };
  }, []);

  useEffect(() => {
    relayout.current?.();
    document.documentElement.lang = lang;
    // the page's own title is applied once more after hydration: set ours after it
    const title = DICT[lang].meta.title;
    document.title = title;
    const id = window.setTimeout(() => (document.title = title), 60);
    return () => window.clearTimeout(id);
  }, [lang]);

  return (
    <div ref={root} className="film" data-ready={ready ? "" : undefined}>
      <header className="fnav">
        <a className="fnav-brand" href="#top" data-to="top" aria-label={t.nav.home}>
          cod<b>ERA</b>
        </a>
        <nav className="fnav-links" aria-label="Primary">
          <a href="#process" data-to="process" className="fnav-wide">
            {t.nav.process}
          </a>
          <a href="#services" data-to="services" className="fnav-wide">
            {t.nav.services}
          </a>
          <a href="#work" data-to="work" className="fnav-wide">
            {t.nav.price}
          </a>
          <a href="#project" data-to="project" className="fnav-cta">
            {t.nav.cta}
          </a>
          <LangSwitch />
        </nav>
      </header>
      <div ref={track} className="film-track" style={{ "--total": TOTAL } as React.CSSProperties}>
        <div className="film-stage">
          <div ref={canvasBox} className="film-canvas">
            <canvas ref={canvas} />
          </div>
          <div ref={screen} className="film-screen">
            <Screen />
          </div>
          <Devices />
          <WorkScenes />
          <Overlay />
          {/* the end: under the computer, quietly */}
          <footer className="film-foot" data-film-foot>
            <span className="film-foot-brand">
              cod<b>ERA</b> © 2026
            </span>
            <nav aria-label={t.foot.contact}>
              {INSTAGRAM ? (
                <a href={INSTAGRAM} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              ) : (
                <span>Instagram</span>
              )}
              <a href={`mailto:${EMAIL}`}>{t.foot.email}</a>
            </nav>
          </footer>
          <div className="film-veil" aria-hidden />
        </div>
      </div>
      <noscript>
        <p className="film-noscript">
          codERA — websites, visual production and website care. <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </p>
      </noscript>
    </div>
  );
}
