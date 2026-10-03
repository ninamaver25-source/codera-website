"use client";

import { useLayoutEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Nav } from "./Nav";
import { HeroCopy, HeroCue } from "./Hero";
import { OfficeScene, Steps } from "./Process";
import { Services } from "./Services";
import { Estimator } from "./Estimator";
import { Contact } from "./Contact";
import "./home.css";
import "./sites/sites.css";

gsap.registerPlugin(ScrollTrigger);

/** The pinned stage scrolls for this many viewport heights: hero, the walk in, four steps, the lid closing, a hold. */
const UNITS = 8;
/** Where the process begins and ends, as fractions of the stage. */
const PROCESS_AT = 0.42;
const PROCESS_END = 0.8;

export function Home() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const track = el.querySelector<HTMLElement>("[data-track]");
    const launch = el.querySelector<HTMLElement>("[data-launch]");
    const lid = el.querySelector<HTMLElement>("[data-lid]");
    if (!track) return;

    let width = window.innerWidth;
    const setVh = () => html.style.setProperty("--vh", `${window.innerHeight}px`);
    setVh();

    /* Smooth scrolling (not under prefers-reduced-motion) */
    const lenis = reduced ? null : new Lenis({ lerp: 0.09, smoothWheel: true });
    const tick = (t: number) => lenis?.raf(t * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    /* One timeline for the whole stage, scrubbed by the scroll position. */
    const mm = gsap.matchMedia();
    const build = () => {
      mm.add({ desktop: "(min-width: 761px)", mobile: "(max-width: 760px)" }, (ctx) => {
        const mobile = !!ctx.conditions?.mobile;
        const vw = window.innerWidth;
        const laptopW = mobile ? vw * 0.94 : Math.min(vw * 0.54, 860);
        el.style.setProperty("--lk", (laptopW / 1600).toFixed(4));

        const tl = gsap.timeline({ defaults: { ease: "none" } });
        // The hero empties and the camera moves into the office.
        tl.to("[data-hero-cue]", { autoAlpha: 0, duration: 0.06 }, 0.06);
        tl.to("[data-hero-copy]", { autoAlpha: 0, y: -36, duration: 0.12 }, 0.1);
        tl.fromTo("[data-office]", { scale: 1 }, { scale: 1.1, duration: 0.3 }, 0.1);
        tl.to("[data-hero-dim]", { opacity: 0.2, duration: 0.26 }, 0.12);
        // The desk appears, then the laptop on it.
        tl.fromTo("[data-near]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.2);
        tl.fromTo("[data-laptop]", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.29);

        // Four steps on the same laptop; one title at a time, the previous gone before the next.
        const L = (PROCESS_END - PROCESS_AT) / 4;
        for (let i = 0; i < 4; i++) {
          const s0 = PROCESS_AT + i * L;
          const s1 = s0 + L;
          tl.fromTo(`[data-step="${i}"]`, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.04 }, s0 + 0.008);
          tl.to(`[data-step="${i}"]`, { autoAlpha: 0, y: -16, duration: 0.032 }, s1 - 0.036);
          if (i > 0) tl.fromTo(`[data-scr="${i}"]`, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.035 }, s0 - 0.008);
          if (i < 3) tl.to(`[data-scr="${i}"]`, { autoAlpha: 0, duration: 0.03 }, s1 - 0.038);
        }
        // The finished website scrolls gently on the laptop during Launch.
        const prog = { v: 0 };
        tl.to(prog, { v: 1, duration: L, onUpdate: () => launch?.style.setProperty("--scroll", reduced ? "0" : prog.v.toFixed(4)) }, PROCESS_AT + 3 * L);
        // Then the lid closes on the desk, and the shot holds.
        const hinge = { a: 0 };
        tl.to(hinge, { a: -90, duration: 0.13, ease: "power1.inOut", onUpdate: () => lid?.style.setProperty("--lid", `${hinge.a.toFixed(2)}deg`) }, PROCESS_END + 0.02);
        tl.to("[data-laptop-glow]", { autoAlpha: 0, duration: 0.08 }, PROCESS_END + 0.06);
        tl.fromTo("[data-closed]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.04, stagger: 0.005 }, 0.94);
        tl.to({}, { duration: 0.02 }, 0.98);

        ScrollTrigger.create({ trigger: track, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6, animation: tl });
      });
    };
    build();

    /* In-page navigation */
    const scrollToY = (y: number) => {
      if (lenis) lenis.scrollTo(y, { duration: 1.8, easing: (u: number) => 1 - Math.pow(1 - u, 3) });
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    };
    const targetFor = (name: string) => {
      if (name === "top") return 0;
      if (name === "process") {
        const r = track.getBoundingClientRect();
        return r.top + window.scrollY + (r.height - window.innerHeight) * (PROCESS_AT + 0.05);
      }
      const sec = document.getElementById(name);
      return sec ? sec.getBoundingClientRect().top + window.scrollY : 0;
    };
    const onClick = (e: Event) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>("[data-to]");
      if (!a) return;
      e.preventDefault();
      scrollToY(targetFor(a.dataset.to ?? "top"));
    };
    el.addEventListener("click", onClick);

    /* Deep link for stills: ?p=0.42 jumps to 42 % of the page. */
    const p = new URLSearchParams(window.location.search).get("p");
    if (p !== null) {
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const max = html.scrollHeight - window.innerHeight;
        const y = Math.min(1, Math.max(0, parseFloat(p))) * max;
        lenis?.scrollTo(y, { immediate: true, force: true });
        window.scrollTo(0, y);
        ScrollTrigger.update();
      });
    }

    /* Rebuild on real width changes only (phone address bars change the height all the time). */
    let timer = 0;
    const onResize = () => {
      if (Math.abs(window.innerWidth - width) < 2) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        width = window.innerWidth;
        setVh();
        mm.revert();
        build();
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    /* Ready flag for the stills pipeline: fonts and the laptop are in. */
    const img = el.querySelector<HTMLImageElement>(".lap-base");
    const imgDone = img && !img.complete ? new Promise<void>((r) => { img.addEventListener("load", () => r(), { once: true }); img.addEventListener("error", () => r(), { once: true }); }) : Promise.resolve();
    Promise.race([Promise.all([document.fonts.ready, imgDone]), new Promise((r) => setTimeout(r, 4000))]).then(() => el.setAttribute("data-ready", ""));

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("click", onClick);
      mm.revert();
      if (lenis) {
        gsap.ticker.remove(tick);
        lenis.destroy();
      }
    };
  }, []);

  return (
    <div ref={root} className="home" id="top">
      <Nav />
      <div className="track" data-track style={{ "--units": UNITS } as React.CSSProperties}>
        <div className="stage">
          <OfficeScene />
          <HeroCopy />
          <HeroCue />
          <Steps />
        </div>
      </div>
      <Services />
      <Estimator />
      <Contact />
    </div>
  );
}
