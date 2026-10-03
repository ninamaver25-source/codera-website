import { quadToMatrix3d } from "./quad";
import { DESK, GEN_COL } from "./Work";
import { lerp, smooth, span, T } from "./time";
import { warm } from "./devicesUpdate";

type Pt = [number, number];
interface Cam {
  z: number;
  tx: number;
  ty: number;
}

const SW = DESK.w;
const SH = DESK.h;
let layer: HTMLElement | null = null;
let scene: HTMLElement | null = null;
let world: HTMLElement | null = null;
let still: HTMLElement | null = null;
let screen: HTMLElement | null = null;
let foot: HTMLElement | null = null;
/** the display in the still (TL TR BR BL, normalised) */
let quad: Pt[] | null = null;
let visible = false;
let lastKey = "";
let lastOp = -1;
let lastFocus = -1;
let lastFoot = -1;
/** the generator takes clicks once the computer is in focus */
let interactive = false;

export function bindWork(el: HTMLElement) {
  layer = el.querySelector("[data-ws]");
  scene = el.querySelector("[data-ws-scene]");
  world = el.querySelector("[data-ws-world]");
  still = el.querySelector("[data-ws-still]");
  screen = el.querySelector("[data-ws-screen]");
  foot = el.querySelector("[data-film-foot]");
  visible = false;
  lastKey = "";
  lastOp = -1;
  lastFocus = -1;
  lastFoot = -1;
  interactive = false;
  if (screen) screen.style.pointerEvents = "none";
  if (layer) layer.style.visibility = "hidden";
  warm(layer);
  return fetch(`/film/${DESK.still}.json`)
    .then((r) => r.json())
    .then((j) => {
      quad = j.screens[0];
    })
    .catch(() => {});
}

const center = (q: Pt[]): Pt => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];

/** Larger screens: the still always covers the viewport. */
function cover(c: Cam, vw: number, vh: number): Cam {
  const z = Math.max(c.z, vw / SW, vh / SH);
  const k = z / c.z;
  const tx = vw / 2 - (vw / 2 - c.tx) * k;
  const ty = vh / 2 - (vh / 2 - c.ty) * k;
  return { z, tx: Math.min(0, Math.max(vw - SW * z, tx)), ty: Math.min(0, Math.max(vh - SH * z, ty)) };
}

/** The computer as it appears: the whole device, large, clear of the menu. */
function framing(vw: number, vh: number, portrait: boolean, navH: number): Cam {
  const [x0, y0, x1, y1] = DESK.subject;
  if (portrait) {
    let w = x1 - x0;
    let cx = (x0 + x1) / 2;
    if (quad) {
      w = (Math.hypot(quad[1][0] - quad[0][0], ((quad[1][1] - quad[0][1]) * SH) / SW) + Math.hypot(quad[2][0] - quad[3][0], ((quad[2][1] - quad[3][1]) * SH) / SW)) / 2;
      cx = center(quad)[0];
    }
    const z = (DESK.phone * vw) / (w * SW);
    return { z, tx: vw / 2 - cx * SW * z, ty: vh * 0.47 - ((y0 + y1) / 2) * SH * z };
  }
  const top = navH + vh * 0.04;
  const bottom = vh * 0.95;
  const z = Math.min((vw * DESK.fit) / ((x1 - x0) * SW), (bottom - top) / ((y1 - y0) * SH));
  const tx = vw * (0.5 + DESK.dx) - ((x0 + x1) / 2) * SW * z;
  const ty = (top + bottom) / 2 - ((y0 + y1) / 2) * SH * z;
  return cover({ z, tx, ty }, vw, vh);
}

/**
 * Close to the screen, where the camera stops: on larger screens the display nearly fills the
 * frame; on phones the generator's column fills the width.
 */
function closeUp(vw: number, vh: number, portrait: boolean, navH: number): Cam | null {
  if (!quad) return null;
  const xs = quad.map((p) => p[0] * SW);
  const ys = quad.map((p) => p[1] * SH);
  const qx0 = Math.min(...xs);
  const qy0 = Math.min(...ys);
  const qw = Math.max(...xs) - qx0;
  const qh = Math.max(...ys) - qy0;
  let rw = qw;
  let rh = qh;
  if (portrait) {
    const k = qw / DESK.screen.w;
    rw = GEN_COL.w * k;
    rh = GEN_COL.h * k;
  }
  const top = navH + (portrait ? 8 : vh * 0.03);
  const bottom = vh - (portrait ? 30 : vh * 0.065);
  const side = portrait ? 10 : vw * 0.07;
  const z = Math.min((vw - 2 * side) / rw, (bottom - top) / rh);
  const cx = qx0 + qw / 2;
  const cy = qy0 + qh / 2;
  return { z, tx: vw / 2 - cx * z, ty: (top + bottom) / 2 - cy * z };
}

const zoomAbout = (c: Cam, f: number, px: number, py: number): Cam => ({ z: c.z * f, tx: px - (px - c.tx) * f, ty: py - (py - c.ty) * f });

function camAt(t: number, vw: number, vh: number, portrait: boolean, navH: number): Cam {
  const base = framing(vw, vh, portrait, navH);
  // arriving a touch farther away, settling as it comes into focus
  const f = 0.975 + 0.025 * smooth(span(t, T.toDesk[0] + 0.2, T.toDesk[1]));
  const c = quad ? center(quad) : ([0.5, 0.39] as Pt);
  const sx = c[0] * SW;
  const sy = c[1] * SH;
  let cam = zoomAbout(base, f, base.tx + sx * base.z, base.ty + sy * base.z);
  if (!portrait) cam = cover(cam, vw, vh);
  // then slowly up to the screen, and no further
  const u = smooth(span(t, T.approach[0], T.approach[1]));
  const end = u > 0 ? closeUp(vw, vh, portrait, navH) : null;
  if (end) {
    const z = cam.z * Math.pow(end.z / cam.z, u);
    const x = lerp(cam.tx + sx * cam.z, end.tx + sx * end.z, u);
    const y = lerp(cam.ty + sy * cam.z, end.ty + sy * end.z, u);
    cam = { z, tx: x - sx * z, ty: y - sy * z };
  }
  return cam;
}

function setVis(el: HTMLElement, v: boolean) {
  const s = v ? "visible" : "hidden";
  if (el.style.visibility !== s) el.style.visibility = s;
}

export function updateWork(t: number, vw: number, vh: number, portrait: boolean, navH: number) {
  if (!layer || !scene || !world || !screen) return;
  const a0 = T.toDesk[0];
  const on = t > a0;
  if (on !== visible) {
    setVis(layer, on);
    if (!on) {
      screen.style.pointerEvents = "none";
      interactive = false;
    }
    visible = on;
  }
  if (foot) {
    const fo = on ? smooth(span(t, T.approach[1] - 0.3, T.approach[1])) : 0;
    if (Math.abs(fo - lastFoot) > 0.004) {
      foot.style.opacity = fo.toFixed(3);
      foot.style.visibility = fo > 0.01 ? "visible" : "hidden";
      lastFoot = fo;
    }
  }
  if (!on) return;

  // The computer arrives out of focus over the soft room, then comes into focus.
  const op = smooth(span(t, a0 + 0.2, a0 + 0.5));
  if (Math.abs(op - lastOp) > 0.002) {
    scene.style.opacity = op.toFixed(3);
    setVis(scene, op > 0.002);
    lastOp = op;
  }
  const focus = smooth(span(t, a0 + 0.45, T.toDesk[1] + 0.1));
  if (Math.abs(focus - lastFocus) > 0.002) {
    const f = focus.toFixed(3);
    if (still) still.style.opacity = f;
    screen.style.opacity = f;
    lastFocus = focus;
  }

  const cam = camAt(t, vw, vh, portrait, navH);
  const key = `${cam.tx.toFixed(2)},${cam.ty.toFixed(2)},${cam.z.toFixed(5)}`;
  if (key !== lastKey) {
    world.style.transform = `translate3d(${cam.tx.toFixed(2)}px, ${cam.ty.toFixed(2)}px, 0) scale(${cam.z.toFixed(5)})`;
    lastKey = key;
    if (quad) {
      const px = quad.map(([x, y]) => [cam.tx + x * SW * cam.z, cam.ty + y * SH * cam.z] as Pt);
      const [mx, my] = center(px);
      const g = px.map(([x, y]) => [mx + (x - mx) * 1.004, my + (y - my) * 1.004] as Pt);
      screen.style.transform = quadToMatrix3d(DESK.screen.w, DESK.screen.h, g);
    }
  }

  // The generator takes clicks once the computer is in focus; typing or clicking never moves the camera.
  const live = focus > 0.95;
  if (live !== interactive) {
    screen.style.pointerEvents = live ? "auto" : "none";
    // leaving the computer: typing must not go on into a field no one can see
    if (!live && document.activeElement instanceof HTMLElement && screen.contains(document.activeElement)) document.activeElement.blur();
    interactive = live;
  }
}
