import { clamp01, lerp, smooth, span, T } from "./time";
import { quadToMatrix3d } from "./quad";
import { SCREEN } from "./screen/layout";
import { svcPush } from "./devicesUpdate";
import { TOUCH } from "./TouchImg";

export interface Manifest {
  width: number;
  height: number;
  fps: number;
  frames: number;
  src: string;
  clips: { name: string; start: number; count: number; duration: number }[];
  /** Display corners per frame (TL TR BR BL, normalised to the frame), or null when not visible. */
  quads: ([number, number][] | null)[];
  /** Motion energy of each frame against the previous one. */
  motion?: number[];
  /**
   * Stretches of a clip replaced by a cross-zoom between their first and last frame (a generation
   * artefact hidden by a push-in): frames a and b of the clip, the subject's scale ratio k from a to
   * b and its centre in each frame (normalised).
   */
  bridges?: Bridge[];
}

interface Bridge {
  clip: number;
  a: number;
  b: number;
  k: number;
  pa: [number, number];
  pb: [number, number];
}

type Pt = [number, number];


/**
 * Touch devices (phones, tablets) hold only this many frames decoded at once. Decoded, a frame is
 * ~5.8 MB, and every frame drawn into the canvas is also kept by Safari's GPU process: all 292 at
 * once is well over a gigabyte, and iOS Safari kills the page ("A problem repeatedly occurred").
 */
const LITE_CAP = 12;
/** Frames decoded ahead of (and behind) the one on screen, so scrubbing finds them ready. */
const LITE_AHEAD = 4;

/** The office's darkest warm charcoal, behind everything. */
const BG = "#15110e";
/** The camera walks back to this point of the approach after the lid closes. */
const RETREAT = 0.5;
/** Where the desk is in that frame (normalised), and how far the camera pushes toward it between the footage and the devices. */
const DESK: Pt = [0.49, 0.72];
const PUSH = 1.55;
/**
 * The first frames of clip 2 settle the closed laptop into the place it opens in. They play at
 * the end of the approach (and backwards as the camera steps away), so the laptop never moves
 * while the steps are told.
 */
const SETTLE = 20;
/** Phones: the band of footage stops here (0 … 1 of the frame) and the desk carries on below it. */
const CUT = 0.9;
/** The open laptop in the frame (normalised): base sides, lid top, base front, screen bottom. */
export const LAPTOP = { left: 0.289, right: 0.711, top: 0.204, bottom: 0.722, screenTop: 0.223, screenBottom: 0.54 };
/** The far edge of the desk in the locked shot (normalised): where the words of 01 – 04 stand. */
export const DESK_LINE = 0.477;

/** The camera's framing: frame scale and offset in viewport px, fixed for the whole film. */
export interface Fit {
  s: number;
  ox: number;
  oy: number;
}

/** What the layout needs: where the laptop is on screen. */
export interface LaptopBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  screenTop: number;
  screenBottom: number;
  /** the desk's far edge */
  desk: number;
}

/**
 * Plays the pre-rendered film as an image sequence on a canvas, at whatever frame the scroll
 * position asks for, and places the live DOM display on the screen of the laptop in that frame.
 */
export class FramePlayer {
  private ctx: CanvasRenderingContext2D;
  private images: (HTMLImageElement | null)[] = [];
  /** loaded: decoded (larger screens), or fetched and waiting compressed (touch devices) */
  private ready: Uint8Array = new Uint8Array(0);
  /**
   * Touch devices: the frames are kept compressed (the whole film is ~14 MB) and only a window of
   * them around the one on screen is decoded, so memory stays flat however far the film is played.
   */
  private lite = typeof window !== "undefined" && window.matchMedia(TOUCH).matches;
  private blobs: (Blob | null)[] = [];
  private decoded = new Map<number, HTMLImageElement>();
  private decoding = new Set<number>();
  private wanted: number[] = [];
  /** the frame on screen: eviction keeps the frames nearest to it */
  private cur = 0;
  m: Manifest | null = null;
  onFrameLoaded: (() => void) | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  /** Per clip: cumulative motion, normalised 0 … 1, so scroll moves the camera at an even pace. */
  private cum: Float32Array[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
  }

  async load(url: string) {
    const m = (await (await fetch(url)).json()) as Manifest;
    this.m = m;
    this.cum = m.clips.map((c) => {
      const mo = m.motion?.slice(c.start, c.start + c.count) ?? new Array(c.count).fill(1);
      const mean = mo.reduce((a, b) => a + b, 0) / Math.max(1, mo.length) || 1;
      const eps = 0.12 * mean;
      const out = new Float32Array(c.count);
      for (let i = 1; i < c.count; i++) out[i] = out[i - 1] + mo[i] + eps;
      const total = out[c.count - 1] || 1;
      for (let i = 0; i < c.count; i++) out[i] /= total;
      return out;
    });
    this.images = new Array(m.frames).fill(null);
    this.blobs = new Array(m.frames).fill(null);
    this.ready = new Uint8Array(m.frames);
    this.preload();
  }

  /** Coarse to fine: every 16th frame first, then 8th, 4th, 2nd, all. */
  private preload() {
    const m = this.m!;
    const order: number[] = [];
    const seen = new Uint8Array(m.frames);
    // Frames hidden by a bridge are never shown: don't fetch them.
    for (const br of m.bridges ?? []) {
      const c = m.clips[br.clip];
      for (let i = c.start + br.a + 1; i < c.start + br.b; i++) seen[i] = 1;
    }
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < m.frames; i += step) {
        if (!seen[i]) {
          seen[i] = 1;
          order.push(i);
        }
      }
    }
    if (!seen[m.frames - 1]) order.push(m.frames - 1);
    let next = 0;
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      if (this.lite) {
        fetch(m.src.replace("{i}", String(i)))
          .then((r) => (r.ok ? r.blob() : null))
          .then((b) => {
            if (b) {
              this.blobs[i] = b;
              this.ready[i] = 1;
              this.onFrameLoaded?.();
            }
          })
          .catch(() => {})
          .finally(pump);
        return;
      }
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        img.decode?.().catch(() => {}).finally(() => {
          this.images[i] = img;
          this.ready[i] = 1;
          this.onFrameLoaded?.();
          pump();
        });
      };
      img.onerror = () => pump();
      img.src = m.src.replace("{i}", String(i));
    };
    for (let k = 0; k < 6; k++) pump();
  }

  /** Frame i, if it can be drawn now. */
  private frame(i: number): HTMLImageElement | null {
    return this.lite ? (this.decoded.get(i) ?? null) : this.ready[i] ? this.images[i] : null;
  }

  /** Touch devices: decode these frames next (most wanted first), dropping the farthest when full. */
  private want(list: number[]) {
    if (!this.lite) return;
    this.wanted = list;
    this.decodeNext();
  }

  private decodeNext() {
    while (this.decoding.size < 2) {
      const i = this.wanted.find((k) => this.blobs[k] && !this.decoded.has(k) && !this.decoding.has(k));
      if (i === undefined) return;
      this.decoding.add(i);
      this.decodeBlob(this.blobs[i]!)
        .then((f) => {
          this.decoded.set(i, f);
          this.evict();
          this.onFrameLoaded?.();
        })
        .catch(() => (this.blobs[i] = null))
        .finally(() => {
          this.decoding.delete(i);
          this.decodeNext();
        });
    }
  }

  /**
   * An image of the blob, decoded off the main thread; its URL lives as long as the image is kept.
   * (Not createImageBitmap: Safari keeps those in its GPU process well after close().)
   */
  private decodeBlob(b: Blob): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(b);
    const img = new Image();
    img.src = url;
    return img.decode().then(
      () => img,
      (e) => {
        URL.revokeObjectURL(url);
        throw e;
      },
    );
  }

  private evict() {
    if (this.decoded.size <= LITE_CAP) return;
    const keep = new Set(this.wanted.slice(0, LITE_CAP));
    const far = [...this.decoded.keys()].filter((k) => !keep.has(k)).sort((a, b) => Math.abs(b - this.cur) - Math.abs(a - this.cur));
    for (const k of far) {
      if (this.decoded.size <= LITE_CAP) break;
      const f = this.decoded.get(k)!;
      this.decoded.delete(k);
      // free the pixels now (in the page and in Safari's GPU process), not at the next GC
      URL.revokeObjectURL(f.src);
      f.src = "";
    }
  }

  get loadedFraction() {
    if (!this.m) return 0;
    let n = 0;
    for (let i = 0; i < this.ready.length; i++) n += this.ready[i];
    return n / Math.max(1, this.ready.length - this.hidden);
  }

  /** Number of frames inside bridges (never loaded). */
  private get hidden() {
    const m = this.m;
    if (!m) return 0;
    return (m.bridges ?? []).reduce((n, br) => n + Math.max(0, br.b - br.a - 1), 0);
  }

  /** The bridge whose stretch contains fractional frame fi, if any. */
  private bridgeAt(fi: number) {
    const m = this.m!;
    for (const br of m.bridges ?? []) {
      const c = m.clips[br.clip];
      if (fi > c.start + br.a && fi < c.start + br.b) return { br, A: c.start + br.a, B: c.start + br.b };
    }
    return null;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    // The footage is 1600 px wide: more canvas pixels than that only cost time (phones above all).
    this.dpr = Math.min(w / h < 1 ? 1.25 : 1.5, dpr);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  /** Clip progress 0 … 1 → fractional frame inside the clip, at an even pace of camera motion. */
  private even(clip: number, u: number) {
    const c = this.cum[clip];
    const n = c.length;
    if (u <= 0) return 0;
    if (u >= 1) return n - 1;
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (c[mid] <= u) lo = mid;
      else hi = mid;
    }
    const d = c[hi] - c[lo];
    const evenF = lo + (d > 0 ? (u - c[lo]) / d : 0);
    // Keep a little of the footage's own easing so arrivals still settle.
    return lerp(evenF, u * (n - 1), 0.28);
  }

  /** Like even(), over local frames f0 … f1 of a clip only. */
  private evenRange(clip: number, f0: number, f1: number, u: number) {
    const c = this.cum[clip];
    if (u <= 0) return f0;
    if (u >= 1) return f1;
    const target = c[f0] + u * (c[f1] - c[f0]);
    let lo = f0;
    let hi = f1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (c[mid] <= target) lo = mid;
      else hi = mid;
    }
    const d = c[hi] - c[lo];
    const evenF = lo + (d > 0 ? (target - c[lo]) / d : 0);
    return lerp(evenF, f0 + u * (f1 - f0), 0.28);
  }

  /** Film time → fractional frame index. Clip 1 is the approach, clip 2 the lid (played backwards to close it). */
  frameAt(t: number) {
    const m = this.m;
    if (!m) return 0;
    const [c1, c2] = m.clips;
    const last = c2.count - 1;
    const settled = c2.start + SETTLE;
    const open = c2.start + last;
    const lid = (u: number) => c2.start + this.evenRange(1, SETTLE, last, u);
    // The approach, then the laptop settles into place before the first step is told.
    const settleAt = T.clip1[1] - 0.22;
    if (t < settleAt) return c1.start + this.even(0, span(t, T.clip1[0], settleAt));
    if (t < T.clip1[1]) return c2.start + span(t, settleAt, T.clip1[1]) * SETTLE;
    // 01 → 04: the camera is locked; only the lid moves.
    if (t < T.clip2[0]) return settled;
    if (t < T.clip2[1]) return lid(span(t, T.clip2[0], T.clip2[1]));
    if (t < T.close[0]) return open;
    if (t < T.close[1]) return lid(1 - span(t, T.close[0], T.close[1]));
    // The camera steps back into the studio: the settle and the approach, backwards.
    const unsettle = T.retreat[0] + 0.22;
    if (t < T.retreat[0]) return settled;
    if (t < unsettle) return c2.start + (1 - span(t, T.retreat[0], unsettle)) * SETTLE;
    return c1.start + this.even(0, lerp(1, RETREAT, smooth(span(t, unsettle, T.retreat[1]))));
  }

  /**
   * Toward the desk between the footage and the devices; back out into the room when website care
   * is over; toward the desk again on the way to the computer.
   */
  push(t: number) {
    // toward the desk at the pace of the devices' camera, so the dissolve is one move
    if (t < T.careExit[0]) return svcPush(t, this.w / this.h < 1);
    if (t < T.toDesk[0]) return lerp(PUSH, 1, smooth(span(t, T.roomBack[0], T.roomBack[1])));
    return lerp(1, PUSH, smooth(span(t, T.toDesk[0], T.toDesk[1])));
  }

  /**
   * The framing: the opening (and the wide moments after it) are the studio full-screen and
   * centred; while the camera travels to the desk it eases into the locked framing chosen by
   * layout(), which then holds — nothing moves from 01 to 04.
   */
  private view(t: number) {
    const portrait = this.w / this.h < 1;
    const k = this.lockAt(t);
    const h = this.hero;
    const f = this.fit;
    const s = k >= 1 ? f.s : h.s + (f.s - h.s) * k;
    const ox = k >= 1 ? f.ox : h.ox + (f.ox - h.ox) * k;
    const oy = k >= 1 ? f.oy : h.oy + (f.oy - h.oy) * k;
    return { s, ox, oy, z0: 1, cx: this.w / 2, cy: this.h / 2, portrait };
  }

  /** 0 = the opening framing, 1 = locked on the laptop. */
  private lockAt(t: number) {
    const ease = (u: number) => smooth(Math.pow(u, 1.35));
    if (t < T.clip1[1] - 0.22) return ease(span(t, T.clip1[0], T.clip1[1] - 0.22));
    if (t < T.retreat[0] + 0.22) return 1;
    return 1 - smooth(span(t, T.retreat[0] + 0.22, T.retreat[1]));
  }

  fit: Fit = { s: 1, ox: 0, oy: 0 };
  /** The studio full-screen (cover), centred: the opening on every screen. */
  hero: Fit = { s: 1, ox: 0, oy: 0 };

  /**
   * Frames the film so the open laptop and the words both have their place. Desktop: the laptop a
   * little right of centre with the words to its left. Phones: the words above, the laptop below,
   * never touching. Called on resize; the result never changes while scrolling.
   */
  layout(o: { vw: number; vh: number; textBottom?: number; navH?: number }): LaptopBox {
    const m = this.m;
    const fw = m?.width ?? 1600;
    const fh = m?.height ?? 907;
    const { vw, vh } = o;
    const nav = o.navH ?? 76;
    const L = LAPTOP;
    const cover = Math.max(vw / fw, vh / fh);
    this.hero = { s: cover, ox: (vw - fw * cover) / 2, oy: (vh - fh * cover) / 2 };
    if (vw / vh < 1) {
      // Phones: the laptop fills most of the width, below the words with room to breathe.
      const textBottom = o.textBottom ?? vh * 0.36;
      const gap = Math.min(56, Math.max(24, vh * 0.045));
      const pad = Math.max(24, vh * 0.04);
      let s = (vw * 0.92) / ((L.right - L.left) * fw);
      const hLap = (L.bottom - L.top) * fh;
      const room = vh - textBottom - gap - pad;
      if (hLap * s > room) s = Math.max(0.2, room / hLap);
      const extra = Math.max(0, room - hLap * s);
      const lidTop = textBottom + gap + extra * 0.35;
      this.fit = { s, ox: (vw - fw * s) / 2, oy: lidTop - L.top * fh * s };
    } else {
      // Desktop: cover the screen; move the laptop right (into the cropped margin, or by framing
      // a touch closer) until the words fit on its left.
      const margin = Math.min(84, Math.max(24, vw * 0.052));
      const textW = Math.min(330, Math.max(240, vw * 0.22));
      const gap = Math.min(72, Math.max(40, vw * 0.045));
      const need = margin + textW + gap;
      let s = Math.max(vw / fw, vh / fh);
      let ox = (vw - fw * s) / 2;
      if (ox + L.left * fw * s < need) ox = Math.min(0, ox + (need - (ox + L.left * fw * s)));
      if (ox + L.left * fw * s < need) {
        const sTop = (vh / 2 - nav - 12) / ((0.5 - L.top) * fh);
        const sRight = (vw - margin) / (L.right * fw);
        s = Math.max(s, Math.min(need / (L.left * fw), sTop, sRight));
        ox = 0;
      }
      this.fit = { s, ox, oy: (vh - fh * s) / 2 };
    }
    const { s, ox, oy } = this.fit;
    return {
      left: ox + L.left * fw * s,
      right: ox + L.right * fw * s,
      top: oy + L.top * fh * s,
      bottom: oy + L.bottom * fh * s,
      screenTop: oy + L.screenTop * fh * s,
      screenBottom: oy + L.screenBottom * fh * s,
      desk: oy + DESK_LINE * fh * s,
    };
  }

  /**
   * Draws the frame for film time t, `soft` (0 … 1) of the way out of focus — a tiny copy of the
   * frame laid over it, far cheaper than a filter. Returns the display quad in viewport px (or null).
   */
  draw(t: number, soft = 0): Pt[] | null {
    const m = this.m;
    if (!m || !this.w) return null;
    const fi = this.frameAt(t);
    let i0 = Math.floor(fi);
    let a = fi - i0;
    // Blend neighbouring frames only where the picture moves slowly; fast moves show whole frames
    // (no double images), exactly like scrubbing a video.
    const mo = m.motion?.[Math.min(m.frames - 1, i0 + 1)] ?? 0;
    if (mo > 2.2) {
      if (a >= 0.5) i0 += 1;
      a = 0;
    }
    const bridge = this.bridgeAt(fi);
    if (this.lite) {
      // decode the frames on screen first, then those around them (ahead first)
      const at = Math.min(m.frames - 1, i0);
      const list = bridge ? [bridge.A, bridge.B] : [at, at + 1];
      for (let d = 1; d <= LITE_AHEAD; d++) list.push(at + 1 + d, at - d);
      this.cur = at;
      this.want(list.filter((k) => k >= 0 && k < m.frames));
    }
    const A = this.nearest(Math.min(m.frames - 1, i0));
    if (A < 0) return null;
    const B = a > 0.02 && i0 + 1 < m.frames && this.frame(i0 + 1) ? i0 + 1 : -1;
    const { s, ox, oy, z0, cx, cy, portrait } = this.view(t);
    const breath = (x: number, y: number): Pt => [cx + (x - cx) * z0, cy + (y - cy) * z0];

    // Display corners in this frame (blended like the image), after the digital camera.
    const qa = m.quads[A];
    const qb = B >= 0 ? m.quads[B] : null;
    let quad: Pt[] | null = null;
    if (qa) {
      quad = qa.map(([x, y], k) => {
        const nx = qb ? lerp(x, qb[k][0], a) : x;
        const ny = qb ? lerp(y, qb[k][1], a) : y;
        return breath(ox + nx * m.width * s, oy + ny * m.height * s);
      });
    }

    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, this.w, this.h);
    // The push toward the desk (between the footage and the devices).
    const zp = this.push(t);
    const px = ox + DESK[0] * m.width * s;
    const py = oy + DESK[1] * m.height * s;
    if (zp !== 1) {
      ctx.translate(px, py);
      ctx.scale(zp, zp);
      ctx.translate(-px, -py);
    }
    ctx.translate(cx, cy);
    ctx.scale(z0, z0);
    ctx.translate(-cx, -cy);
    // Phones: the frame is a band across the screen; above and below it the studio carries on —
    // its own edges, mirrored and out of focus — so the whole screen is always the room.
    if (portrait) this.soft(A, this.frame(A)!, ox, oy, m.width * s, m.height * s * CUT);
    if (bridge && this.frame(bridge.A) && this.frame(bridge.B)) {
      // A push-in across the hidden frames: both ends scaled about the subject and dissolved, the
      // nearer one inside a soft oval that opens out to the whole frame, so no edge ever shows.
      const { br } = bridge;
      const v = (fi - bridge.A) / (bridge.B - bridge.A);
      const fw = m.width * s;
      const fh = m.height * s;
      const px = ox + lerp(br.pa[0], br.pb[0], v) * fw;
      const py = oy + lerp(br.pa[1], br.pb[1], v) * fh;
      const sa = Math.pow(br.k, v);
      const sb = Math.pow(br.k, v - 1);
      ctx.drawImage(this.frame(bridge.A)!, px - br.pa[0] * fw * sa, py - br.pa[1] * fh * sa, fw * sa, fh * sa);
      const alpha = smooth(span(v, 0.15, 0.85));
      if (alpha > 0) {
        const off = this.offscreen();
        const o = off.getContext("2d")!;
        o.setTransform(1, 0, 0, 1, 0, 0);
        o.clearRect(0, 0, off.width, off.height);
        o.setTransform(ctx.getTransform());
        o.imageSmoothingQuality = "high";
        const bx = px - br.pb[0] * fw * sb;
        const by = py - br.pb[1] * fh * sb;
        o.drawImage(this.frame(bridge.B)!, bx, by, fw * sb, fh * sb);
        const open = lerp(0.62, 1.9, smooth(v));
        const cxB = bx + (fw * sb) / 2;
        const cyB = by + (fh * sb) / 2;
        const rx = (fw * sb * open) / 2;
        const ry = (fh * sb * open) / 2;
        o.globalCompositeOperation = "destination-in";
        o.save();
        o.translate(cxB, cyB);
        o.scale(1, ry / rx);
        const g = o.createRadialGradient(0, 0, rx * 0.55, 0, 0, rx);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        o.fillStyle = g;
        o.fillRect(-rx * 3, -rx * 3, rx * 6, rx * 6);
        o.restore();
        o.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = alpha;
        ctx.drawImage(off, 0, 0);
        ctx.restore();
      }
    } else if (portrait) {
      // Narrow screens: the frame is a band across the middle; its top and bottom melt into the
      // soft continuation drawn by soft(), so there is never a line.
      const off = this.offscreen();
      const o = off.getContext("2d")!;
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, off.width, off.height);
      o.setTransform(ctx.getTransform());
      o.imageSmoothingQuality = "high";
      const imgA = this.frame(A)!;
      const nh = imgA.naturalHeight;
      o.drawImage(imgA, 0, 0, imgA.naturalWidth, nh * CUT, ox, oy, m.width * s, m.height * s * CUT);
      if (B >= 0) {
        const imgB = this.frame(B)!;
        o.globalAlpha = a;
        o.drawImage(imgB, 0, 0, imgB.naturalWidth, imgB.naturalHeight * CUT, ox, oy, m.width * s, m.height * s * CUT);
        o.globalAlpha = 1;
      }
      const top = oy;
      const bot = oy + m.height * s * CUT;
      const f = Math.min(130, (bot - top) * 0.24) / (bot - top);
      const fb = Math.min(44, (bot - top) * 0.08) / (bot - top);
      const g = o.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(f, "rgba(0,0,0,1)");
      g.addColorStop(1 - fb, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      o.globalCompositeOperation = "destination-in";
      o.fillStyle = g;
      o.fillRect(-this.w, top - 1, this.w * 3, bot - top + 2);
      o.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // out of focus: the sharp band gives way to the soft one already drawn under it (no edges)
      ctx.globalAlpha = 1 - Math.min(1, soft);
      ctx.drawImage(off, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(this.frame(A)!, ox, oy, m.width * s, m.height * s);
      if (B >= 0) {
        ctx.globalAlpha = a;
        ctx.drawImage(this.frame(B)!, ox, oy, m.width * s, m.height * s);
        ctx.globalAlpha = 1;
      }
    }
    if (soft > 0.004 && !portrait) {
      const c = this.blurCopy(A, this.frame(A)!);
      ctx.globalAlpha = Math.min(1, soft);
      ctx.drawImage(c, ox, oy, m.width * s, m.height * s);
      ctx.globalAlpha = 1;
    }
    if (!quad) return null;
    if (zp === 1) return quad;
    return quad.map(([x, y]) => [px + (x - px) * zp, py + (y - py) * zp] as Pt);
  }

  private blurred = new Map<number, HTMLCanvasElement>();
  /** A small copy of frame i: drawn full size, the frame out of focus. Made once per frame. */
  private blurCopy(i: number, img: HTMLImageElement) {
    const had = this.blurred.get(i);
    if (had) return had;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const mid = document.createElement("canvas");
    mid.width = 320;
    mid.height = Math.max(4, Math.round((320 * nh) / nw));
    const g = mid.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, nw, nh, 0, 0, mid.width, mid.height);
    const c = document.createElement("canvas");
    c.width = 80;
    c.height = Math.max(4, Math.round(mid.height / 4));
    const h = c.getContext("2d")!;
    h.imageSmoothingQuality = "high";
    h.drawImage(mid, 0, 0, c.width, c.height);
    mid.width = mid.height = 0;
    if (this.blurred.size > 8) this.blurred.clear();
    this.blurred.set(i, c);
    return c;
  }

  private tiny = new Map<number, HTMLCanvasElement>();
  /** A tiny (so, drawn large, out-of-focus) copy of frame i, rows 0 … CUT. Made once per frame. */
  private softCopy(i: number, img: HTMLImageElement) {
    const had = this.tiny.get(i);
    if (had) return had;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight * CUT;
    const mid = document.createElement("canvas");
    mid.width = 200;
    mid.height = Math.max(4, Math.round((200 * nh) / nw));
    const g = mid.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, nw, nh, 0, 0, mid.width, mid.height);
    const c = document.createElement("canvas");
    c.width = 50;
    c.height = Math.max(4, Math.round(mid.height / 4));
    const h = c.getContext("2d")!;
    h.imageSmoothingQuality = "high";
    h.drawImage(mid, 0, 0, c.width, c.height);
    // release the scratch canvas now: iOS Safari caps the total memory of all canvases
    mid.width = mid.height = 0;
    if (this.tiny.size > 48) this.tiny.clear();
    this.tiny.set(i, c);
    return c;
  }

  /**
   * Phones: the room beyond the top and bottom of the band. Near the band, its own edge mirrored;
   * further out, its outermost rows carried on — all out of focus, so no line and no block shows.
   */
  private soft(i: number, img: HTMLImageElement, ox: number, oy: number, fw: number, bandH: number) {
    const ctx = this.ctx;
    const c = this.softCopy(i, img);
    const tw = c.width;
    const th = c.height;
    const ext = this.h * 1.6;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(c, 0, 0, tw, 1, ox, oy - ext, fw, ext + 1);
    ctx.drawImage(c, 0, th - 1, tw, 1, ox, oy + bandH - 1, fw, ext + 1);
    // the band itself, out of focus, under the sharp band: its feathered edges melt into this
    ctx.drawImage(c, 0, 0, tw, th, ox, oy, fw, bandH);
    // only the outermost rows are mirrored (the wall above, the desk's edge below), never the laptop
    const kt = 0.13;
    const kb = 0.1;
    const dt = bandH * kt;
    const db = bandH * kb;
    const off = this.offscreen();
    const o = off.getContext("2d")!;
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, off.width, off.height);
    o.setTransform(ctx.getTransform());
    o.imageSmoothingQuality = "high";
    o.save();
    o.translate(0, oy);
    o.scale(1, -1);
    o.drawImage(c, 0, 0, tw, Math.max(1, th * kt), ox, 0, fw, dt);
    o.restore();
    o.save();
    o.translate(0, oy + bandH);
    o.scale(1, -1);
    o.drawImage(c, 0, th * (1 - kb), tw, Math.max(1, th * kb), ox, -db, fw, db);
    o.restore();
    o.globalCompositeOperation = "destination-in";
    const tot = bandH + dt + db;
    const g = o.createLinearGradient(0, oy - dt, 0, oy + bandH + db);
    for (let j = 0; j <= 6; j++) {
      const u = j / 6;
      const a = (u * u * (3 - 2 * u)).toFixed(3);
      g.addColorStop((u * dt) / tot, `rgba(0,0,0,${a})`);
      g.addColorStop(1 - (u * db) / tot, `rgba(0,0,0,${a})`);
    }
    o.fillStyle = g;
    o.fillRect(ox - this.w, oy - dt - 2, fw + 2 * this.w, tot + 4);
    o.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }

  private off: HTMLCanvasElement | null = null;
  /** A scratch canvas the size of the stage (for soft masks). */
  private offscreen() {
    if (!this.off) this.off = document.createElement("canvas");
    if (this.off.width !== this.canvas.width || this.off.height !== this.canvas.height) {
      this.off.width = this.canvas.width;
      this.off.height = this.canvas.height;
    }
    return this.off;
  }

  /** The drawable frame nearest to i (on touch devices, while i itself is still decoding). */
  private nearest(i: number) {
    if (this.frame(i)) return i;
    for (let d = 1; d < this.ready.length; d++) {
      if (i - d >= 0 && this.frame(i - d)) return i - d;
      if (i + d < this.ready.length && this.frame(i + d)) return i + d;
    }
    return -1;
  }
}

let lastTf = "";
let lastOp = -1;
/** Maps the DOM display onto the laptop's screen in the current frame. */
export function placeScreen(el: HTMLElement | null, quad: Pt[] | null, opacity: number) {
  if (!el) return;
  if (!quad || opacity < 0.003) {
    if (lastOp !== 0) {
      el.style.visibility = "hidden";
      el.style.opacity = "0";
      lastOp = 0;
    }
    return;
  }
  // Grow the quad a hair so no dark glass shows at the edges.
  const mx = (quad[0][0] + quad[1][0] + quad[2][0] + quad[3][0]) / 4;
  const my = (quad[0][1] + quad[1][1] + quad[2][1] + quad[3][1]) / 4;
  const k = 1.004;
  const q = quad.map(([x, y]) => [mx + (x - mx) * k, my + (y - my) * k] as Pt);
  const tf = quadToMatrix3d(SCREEN.w, SCREEN.h, q);
  if (tf !== lastTf) {
    el.style.transform = tf;
    lastTf = tf;
  }
  const o = clamp01(opacity);
  if (Math.abs(o - lastOp) > 0.002) {
    el.style.opacity = o.toFixed(3);
    el.style.visibility = "visible";
    lastOp = o;
  }
}
