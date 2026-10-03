import { quadToMatrix3d } from "./quad";
import { DEVICE_SCREENS } from "./Devices";
import { lerp, smooth, span, T } from "./time";

/** The devices still, in its own pixels, and its displays (normalised TL TR BR BL). */
const SW = 3840;
const SH = 1648;
/** How much wider the first shot is, matching the footage's push toward the desk. */
const PUSH = 1.55;
let quads: [number, number][][] = [];

interface Shot {
  cx: number;
  cy: number;
  /** share of the still's width across the viewport */
  w: number;
  /** rack focus: centre and radii (share of the still), r = 0 for everything sharp */
  fx: number;
  fy: number;
  rx: number;
  ry: number;
}

function shots(portrait: boolean) {
  // Phones keep the still tall enough to fill the screen: the wide shot is the laptop with its
  // neighbours.
  // (targets follow the devices in the office still: each shot frames its device as before)
  const all: Shot = portrait ? { cx: 0.476, cy: 0.515, w: 0.3, fx: 0.5, fy: 0.5, rx: 0, ry: 0 } : { cx: 0.486, cy: 0.44, w: 0.95, fx: 0.5, fy: 0.5, rx: 0, ry: 0 };
  return {
    // never wider than the still itself, so it always covers the screen from side to side
    entry: { ...all, w: Math.min(1, all.w * PUSH) },
    all,
    web: portrait ? { cx: 0.476, cy: 0.4355, w: 0.21, fx: 0.476, fy: 0.5155, rx: 0.15, ry: 0.32 } : { cx: 0.426, cy: 0.5355, w: 0.42, fx: 0.476, fy: 0.5055, rx: 0.16, ry: 0.32 },
    phone: portrait ? { cx: 0.8825, cy: 0.5135, w: 0.16, fx: 0.8825, fy: 0.5935, rx: 0.06, ry: 0.22 } : { cx: 0.8205, cy: 0.5885, w: 0.32, fx: 0.8825, fy: 0.5935, rx: 0.065, ry: 0.22 },
    // website care: the tablet, near enough to read its dashboard (the caption underneath on larger screens)
    care: portrait ? { cx: 0.7142, cy: 0.5349, w: 0.1716, fx: 0.7142, fy: 0.5573, rx: 0.1, ry: 0.25 } : { cx: 0.7142, cy: 0.5723, w: 0.255, fx: 0.7142, fy: 0.5573, rx: 0.11, ry: 0.3 },
  };
}

const mix = (a: Shot, b: Shot, u: number): Shot => {
  // An unfocused shot (r = 0) blends as a very wide focus, so the blur opens up smoothly.
  const ra = a.rx || 1.4;
  const rb = b.rx || 1.4;
  const ya = a.ry || 1.4;
  const yb = b.ry || 1.4;
  return {
    cx: lerp(a.cx, b.cx, u),
    cy: lerp(a.cy, b.cy, u),
    w: a.w * Math.pow(b.w / a.w, u),
    fx: lerp(a.fx, b.fx, u),
    fy: lerp(a.fy, b.fy, u),
    rx: lerp(ra, rb, u),
    ry: lerp(ya, yb, u),
  };
};
const drift = (s: Shot, k: number): Shot => ({ ...s, w: s.w * (1 - k) });

let root: HTMLElement | null = null;
let world: HTMLElement | null = null;
let sharps: HTMLElement[] = [];
const lastMask = ["", ""];
const lastSharpOp = [-1, -1];
let lastScreen: string[] = [];
let sitePage: HTMLElement | null = null;
let scrollMax = -1000;
let lastScroll = "";
let sharpWrap: HTMLElement | null = null;
let care: HTMLElement | null = null;
let screens: HTMLElement[] = [];
let site: HTMLElement | null = null;
let reelItems: HTMLElement[] = [];
let reelBars: HTMLElement[] = [];
let cards: HTMLElement[] = [];
let ticks: HTMLElement[] = [];
let blocked: HTMLElement | null = null;
let bkDots: HTMLElement[] = [];
let scoreRing: SVGCircleElement | null = null;
let scoreNum: HTMLElement | null = null;
let tasks: HTMLElement[] = [];
let taskBars: HTMLElement[] = [];
let solved: HTMLElement | null = null;
let lastScore = -1;
let lastBlocked = -1;
let visible = false;
let lastKey = "";
let lastOp = -1;

export async function bindDevices(el: HTMLElement) {
  root = el.querySelector("[data-dv]");
  world = el.querySelector("[data-dv-world]");
  sharps = Array.from(el.querySelectorAll<HTMLElement>("[data-dv-sharp]"));
  lastMask[0] = lastMask[1] = "";
  lastSharpOp[0] = lastSharpOp[1] = -1;
  sharpWrap = el.querySelector("[data-dv-sharp-wrap]");
  care = el.querySelector("[data-dv-care]");
  screens = Array.from(el.querySelectorAll<HTMLElement>("[data-dvs]"));
  lastScreen = screens.map(() => "");
  site = el.querySelector("[data-dv-site] .site");
  // the website on the laptop scrolls by a transform on its page (not a variable on the whole site)
  sitePage = site?.querySelector<HTMLElement>(".site-page") ?? null;
  scrollMax = site ? parseFloat(getComputedStyle(site).getPropertyValue("--scroll-max")) || -1000 : -1000;
  lastScroll = "";
  reelItems = Array.from(el.querySelectorAll<HTMLElement>("[data-reel-item]"));
  reelBars = Array.from(el.querySelectorAll<HTMLElement>("[data-reel-bar]"));
  cards = Array.from(el.querySelectorAll<HTMLElement>("[data-cm]"));
  ticks = Array.from(el.querySelectorAll<HTMLElement>("[data-tick]"));
  blocked = el.querySelector("[data-blocked]");
  bkDots = Array.from(el.querySelectorAll<HTMLElement>("[data-bk]"));
  scoreRing = el.querySelector("[data-score-ring]");
  scoreNum = el.querySelector("[data-score-num]");
  tasks = Array.from(el.querySelectorAll<HTMLElement>("[data-cc]"));
  taskBars = Array.from(el.querySelectorAll<HTMLElement>("[data-ccbar]"));
  solved = el.querySelector("[data-solved]");
  lastScore = -1;
  lastBlocked = -1;
  visible = false;
  lastKey = "";
  lastOp = -1;
  // Decode the still and the displays' pictures ahead of time, so the desk arrives without a hitch.
  warm(root);
  try {
    const j = await (await fetch("/film/devices.json")).json();
    quads = j.screens;
  } catch {
    quads = [];
  }
}

/** Loads and decodes every picture in a layer while the film is elsewhere. */
export function warm(layer: HTMLElement | null) {
  if (!layer || typeof window === "undefined") return;
  const go = () =>
    layer.querySelectorAll("img").forEach((img) => {
      img.loading = "eager";
      img.decode?.().catch(() => {});
    });
  if ("requestIdleCallback" in window) window.requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 2500);
}

function setOp(el: HTMLElement | null, v: number) {
  if (!el) return;
  const s = v.toFixed(3);
  if (el.style.opacity !== s) el.style.opacity = s;
  const vis = v > 0.002 ? "visible" : "hidden";
  if (el.style.visibility !== vis) el.style.visibility = vis;
}

/** The one move from the room into the laptop: 0 → 1 from the arrival of the devices to the laptop shot. */
const svcMove = (t: number) => smooth(span(t, T.svcIn[0], T.toWeb[1]));

/**
 * How far the footage behind pushes in while the devices arrive over it: exactly the zoom the
 * devices' camera makes in the same moment, so the dissolve reads as one camera move.
 */
export function svcPush(t: number, portrait: boolean) {
  const S = shots(portrait);
  return Math.pow(S.entry.w / S.web.w, svcMove(t));
}

/** Where the desk line (the laptop's base) sits in the still, and on the screen in the footage the devices take over from. */
const DESK_STILL = 0.62;
const DESK_FOOTAGE = 0.73;

/** The camera on the devices for film time t. */
function shotAt(t: number, portrait: boolean, vw: number, vh: number): Shot {
  const S = shots(portrait);
  // The devices arrive where the desk is in the footage behind them (no jump in the dissolve), and
  // settle into the wide shot as they come into focus.
  const z0 = vw / (S.entry.w * SW);
  const entry = { ...S.entry, cy: DESK_STILL - ((DESK_FOOTAGE - 0.5) * vh) / (SH * z0) };
  // From the room straight into the laptop: one unbroken move, no stop on the way (the footage
  // behind pushes in at the same pace while the two dissolve — see svcPush).
  if (t < T.toPhone[0]) return drift(mix(entry, S.web, svcMove(t)), 0.03 * span(t, T.toWeb[1], T.toPhone[0]));
  if (t < T.toCare[0]) {
    const s = mix(drift(S.web, 0.03), S.phone, smooth(span(t, T.toPhone[0], T.toPhone[1])));
    return drift(s, 0.025 * span(t, T.toPhone[1], T.toCare[0]));
  }
  // From the phone straight over to the tablet beside it — one unbroken move, easing back a touch
  // on the way so both are in the frame for a moment: website care.
  if (t < T.toCare[1]) {
    const u = smooth(span(t, T.toCare[0], T.toCare[1]));
    const s = mix(drift(S.phone, 0.025), S.care, u);
    return { ...s, w: s.w * (1 + 0.12 * Math.sin(Math.PI * u)) };
  }
  // While the dashboard comes alive the camera barely moves; when website care is over it eases
  // back a little as the display goes out of focus, and the scene ends.
  const held = drift(S.care, 0.02 * span(t, T.toCare[1], T.careExit[0]));
  return mix(held, { ...held, w: held.w * 1.1 }, smooth(span(t, T.careExit[0], T.careExit[1])));
}

export function updateDevices(t: number, vw: number, vh: number) {
  if (!root || !world) return;
  // Shortly before the devices arrive the layer is already drawn, all but invisible, so the browser
  // has the desk and the laptop's website ready when they fade in (no hitch at the first frame).
  const warm = t > T.svcIn[0] - 0.6 && t <= T.svcIn[0] + 0.15;
  const on = (t > T.svcIn[0] && t < T.careExit[1] + 0.02) || warm;
  if (on !== visible) {
    root.style.visibility = on ? "visible" : "hidden";
    // children set visible would show through a hidden parent: put them all out too
    if (!on) [...screens, ...reelItems, sharpWrap, care].forEach((el) => setOp(el, 0));
    visible = on;
  }
  if (!on) return;

  // The devices arrive out of focus over the footage as the camera pushes toward the desk, then
  // come into focus; after website care they go out of focus again and give way to the work.
  const op = Math.max(warm ? 0.002 : 0, smooth(span(t, T.svcIn[0] + 0.1, T.svcIn[0] + 0.4)) * (1 - smooth(span(t, T.careExit[0] + 0.3, T.careExit[1]))));
  if (Math.abs(op - lastOp) > 0.002) {
    root.style.opacity = op.toFixed(3);
    lastOp = op;
  }
  const focus = smooth(span(t, T.svcIn[0] + 0.3, T.svcIn[0] + 0.65)) * (1 - smooth(span(t, T.careExit[0], T.careExit[0] + 0.4)));
  setOp(sharpWrap, Math.max(warm ? 0.01 : 0, focus));

  const portrait = vw / vh < 1;
  const s = shotAt(t, portrait, vw, vh);
  const z = vw / (s.w * SW);
  const tx = vw / 2 - s.cx * SW * z;
  const ty = vh / 2 - s.cy * SH * z;
  const key = `${tx.toFixed(2)},${ty.toFixed(2)},${z.toFixed(5)}`;
  if (key !== lastKey) {
    world.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${z.toFixed(5)})`;
    lastKey = key;
  }
  // Rack focus without redrawing a mask every frame: two copies of the still, each with a fixed
  // focus, crossfaded as the camera moves from one device to the next (each copy changes its focus
  // only while it is out of sight). Phones: no focus masks at all.
  if (sharps.length === 2) {
    const S = shots(false);
    const cross = (u: number) => [1 - smooth(span(u, 0.35, 1)), smooth(span(u, 0, 0.65))];
    let masks: (Shot | null)[];
    let w: number[];
    if (portrait) {
      masks = [null, null];
      w = [1, 0];
    } else if (t < T.toPhone[0]) {
      masks = [null, S.web];
      // the focus settles on the laptop as the camera arrives at it
      w = cross(smooth(span(t, T.svcIn[1] - 0.2, T.toWeb[1] - 0.15)));
    } else if (t < T.toCare[0]) {
      masks = [S.phone, S.web];
      const [out, inn] = cross(smooth(span(t, T.toPhone[0], T.toPhone[1])));
      w = [inn, out];
    } else {
      masks = [S.phone, S.care];
      w = cross(smooth(span(t, T.toCare[0], T.toCare[1])));
    }
    sharps.forEach((el, i) => {
      const m = masks[i];
      const key = m ? `${(m.fx * SW).toFixed(0)}|${(m.fy * SH).toFixed(0)}|${(m.rx * SW).toFixed(0)}|${(m.ry * SH).toFixed(0)}` : "none";
      if (key !== lastMask[i]) {
        el.style.setProperty("--fx", m ? `${(m.fx * SW).toFixed(0)}px` : "1920px");
        el.style.setProperty("--fy", m ? `${(m.fy * SH).toFixed(0)}px` : "824px");
        el.style.setProperty("--rx", m ? `${(m.rx * SW).toFixed(0)}px` : "6000px");
        el.style.setProperty("--ry", m ? `${(m.ry * SH).toFixed(0)}px` : "6000px");
        lastMask[i] = key;
      }
      const o = w[i];
      if (Math.abs(o - lastSharpOp[i]) > 0.003) {
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o > 0.003 ? "visible" : "hidden";
        lastSharpOp[i] = o;
      }
    });
  }

  // Displays: the laptop wakes first; the camera leaves it for the phone; as the camera comes over
  // to the tablet its dashboard comes up: website care. The big display stays off.
  const laptop = smooth(span(t, T.svcIn[0] + 0.3, T.toWeb[0] + 0.2)) * (1 - smooth(span(t, T.toPhone[0], T.toPhone[0] + 0.5)));
  const phone = smooth(span(t, T.toPhone[1] - 0.6, T.toPhone[1] - 0.1));
  const tablet = smooth(span(t, T.toCare[0] + 0.25, T.toCare[1] - 0.15));
  const monitor = 0;

  const ops = [monitor, laptop, tablet, phone];
  // the displays still to come are drawn ahead too, all but invisible (no hitch when they light up)
  const early = [0, warm ? 0.01 : 0, t > T.toWeb[1] && t < T.toCare[0] ? 0.004 : 0, t > T.toWeb[1] && t < T.toPhone[0] ? 0.004 : 0];
  screens.forEach((el, i) => {
    const q = quads[i];
    const o = Math.max(early[i], ops[i] * focus);
    setOp(el, o);
    if (!q || o <= 0.002) return;
    const px = q.map(([x, y]) => [tx + x * SW * z, ty + y * SH * z] as [number, number]);
    // grow a hair so no glass shows at the edges
    const mx = (px[0][0] + px[1][0] + px[2][0] + px[3][0]) / 4;
    const my = (px[0][1] + px[1][1] + px[2][1] + px[3][1]) / 4;
    const g = px.map(([x, y]) => [mx + (x - mx) * 1.004, my + (y - my) * 1.004] as [number, number]);
    const tf = quadToMatrix3d(DEVICE_SCREENS[i].w, DEVICE_SCREENS[i].h, g);
    if (tf !== lastScreen[i]) {
      el.style.transform = tf;
      lastScreen[i] = tf;
    }
  });
  setOp(care, tablet);

  // The website on the laptop scrolls by itself.
  if (sitePage) {
    const y = `translate3d(0, ${(0.82 * smooth(span(t, T.webScroll[0], T.webScroll[1])) * scrollMax).toFixed(1)}px, 0)`;
    if (y !== lastScroll) {
      sitePage.style.transform = y;
      lastScroll = y;
    }
  }

  // Visual production: a reel of the studio's work, one frame after another.
  const [a, b] = T.visPlay;
  const n = reelItems.length;
  const d = (b - a) / n;
  reelItems.forEach((el, i) => {
    const s0 = a + i * d;
    const inn = i === 0 ? 1 : smooth(span(t, s0 - 0.08, s0 + 0.08));
    const out = i === n - 1 ? 0 : smooth(span(t, s0 + d - 0.08, s0 + d + 0.08));
    const v = inn * (1 - out);
    setOp(el, v);
    if (v > 0) {
      const k = span(t, s0 - 0.1, s0 + d + 0.1);
      (el.firstElementChild as HTMLElement).style.transform = `scale(${(1.08 - 0.08 * k).toFixed(4)})`;
    }
  });
  reelBars.forEach((el, i) => {
    const s0 = a + i * d;
    const v = `scaleX(${span(t, s0, s0 + d).toFixed(3)})`;
    if (el.style.transform !== v) el.style.transform = v;
  });

  // Website care: the dashboard comes alive — every module checks in, the numbers settle.
  const [c0, c1] = T.carePlay;
  const d0 = c1 - c0;
  cards.forEach((el, i) => {
    const v = smooth(span(t, c0 + i * 0.06 * d0, c0 + (0.14 + i * 0.06) * d0));
    const o = v.toFixed(3);
    if (el.style.opacity !== o) {
      el.style.opacity = o;
      el.style.transform = `translateY(${((1 - v) * 14).toFixed(1)}px)`;
    }
  });
  ticks.forEach((el, i) => el.classList.toggle("on", t > c0 + (0.2 + i * 0.05) * d0));
  const nb = Math.round(1284 * smooth(span(t, c0 + 0.25 * d0, c0 + 0.7 * d0)));
  if (blocked && nb !== lastBlocked) {
    blocked.textContent = nb.toLocaleString("en-US");
    lastBlocked = nb;
  }
  bkDots.forEach((el, i) => el.classList.toggle("on", t > c0 + (0.3 + i * 0.025) * d0));
  const sc = smooth(span(t, c0 + 0.35 * d0, c0 + 0.75 * d0));
  const sv = Math.round(98 * sc);
  if (scoreNum && sv !== lastScore) {
    scoreNum.textContent = String(sv);
    if (scoreRing) scoreRing.style.strokeDashoffset = (100 - 98 * sc).toFixed(1);
    lastScore = sv;
  }
  tasks.forEach((el, i) => {
    const a0 = c0 + (0.4 + i * 0.12) * d0;
    const u = span(t, a0, a0 + 0.2 * d0);
    const bar = taskBars[i];
    if (bar) bar.style.transform = `scaleX(${(i === 2 ? 0.62 * u : u).toFixed(3)})`;
    el.classList.toggle("ok", i < 2 && u >= 1);
  });
  if (solved) solved.style.opacity = smooth(span(t, c0 + 0.8 * d0, c0 + 0.9 * d0)).toFixed(3);
}
