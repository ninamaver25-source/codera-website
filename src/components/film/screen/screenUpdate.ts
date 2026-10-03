import { ARTBOARD } from "./layout";
import { smooth, span, T } from "../time";

interface Typed {
  el: HTMLElement;
  text: string;
  n: number;
}

let idea: HTMLElement | null = null;
let design: HTMLElement | null = null;
let typed: Typed[] = [];
let carets: HTMLElement[] = [];
let draws: { el: SVGGeometryElement; len: number; last: number }[] = [];
let nodes: SVGGElement[] = [];
let pops: HTMLElement[] = [];
let ab: HTMLElement | null = null;
let sel: HTMLElement | null = null;
let cursor: HTMLElement | null = null;
let layers: Record<string, HTMLElement> = {};
let props: Record<string, HTMLElement> = {};
const vars: Record<string, number> = {};
let lastStage = -2;
const apps: Record<string, HTMLElement> = {};
const appOp: Record<string, number> = {};

/* 03 development */
let codeLines: { el: HTMLElement; cx: HTMLElement; len: number; start: number; n: number }[] = [];
let codeTotal = 1;
let dcarets: HTMLElement[] = [];
let termLines: HTMLElement[] = [];
let preview: HTMLElement | null = null;
let scores: { ring: SVGCircleElement; num: HTMLElement; last: number }[] = [];

/* 04 launch */
let deploy: HTMLElement | null = null;
let browser: HTMLElement | null = null;
let dstate: HTMLElement[] = [];
let dbar: HTMLElement | null = null;
let dsteps: HTMLElement[] = [];
let url: { el: HTMLElement; text: string; n: number } | null = null;
let ucaret: HTMLElement | null = null;
let bload: HTMLElement | null = null;
let bpage: HTMLElement | null = null;
let live: HTMLElement | null = null;
let toasts: HTMLElement[] = [];
let visitors: HTMLElement | null = null;
let vcount: HTMLElement | null = null;
let lastV = -1;

export function bindScreen(root: HTMLElement) {
  idea = root.querySelector('[data-app="idea"]');
  design = root.querySelector('[data-app="design"]');
  typed = Array.from(root.querySelectorAll<HTMLElement>("[data-type]")).map((el) => ({ el, text: el.dataset.type ?? "", n: -1 }));
  carets = Array.from(root.querySelectorAll<HTMLElement>("[data-caret]"));
  draws = Array.from(root.querySelectorAll<SVGGeometryElement>("[data-draw]"))
    .sort((a, b) => Number(a.dataset.draw) - Number(b.dataset.draw))
    .map((el) => {
      const len = Math.ceil(el.getTotalLength()) + 2;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      return { el, len, last: -1 };
    });
  nodes = Array.from(root.querySelectorAll<SVGGElement>("[data-node]"));
  pops = Array.from(root.querySelectorAll<HTMLElement>("[data-pop]"));
  ab = root.querySelector("[data-ab]");
  sel = root.querySelector("[data-sel]");
  cursor = root.querySelector("[data-cursor]");
  layers = {};
  root.querySelectorAll<HTMLElement>("[data-layer]").forEach((el) => (layers[el.dataset.layer!] = el));
  props = {};
  root.querySelectorAll<HTMLElement>("[data-prop]").forEach((el) => (props[el.dataset.prop!] = el));
  for (const k of Object.keys(vars)) delete vars[k];
  lastStage = -2;

  for (const k of Object.keys(apps)) delete apps[k];
  for (const k of Object.keys(appOp)) delete appOp[k];
  root.querySelectorAll<HTMLElement>("[data-app]").forEach((el) => (apps[el.dataset.app!] = el));

  let start = 0;
  codeLines = Array.from(root.querySelectorAll<HTMLElement>("[data-cl]")).map((el) => {
    const cx = el.querySelector<HTMLElement>("[data-cx]")!;
    const len = Math.max(1, (cx.textContent ?? "").length);
    const line = { el, cx, len, start, n: -1 };
    start += len + 6; // a short pause at every line end
    return line;
  });
  codeTotal = Math.max(1, start);
  dcarets = Array.from(root.querySelectorAll<HTMLElement>("[data-dcaret]"));
  termLines = Array.from(root.querySelectorAll<HTMLElement>("[data-tl]"));
  preview = root.querySelector("[data-preview]");
  scores = Array.from(root.querySelectorAll<HTMLElement>("[data-score]")).map((el) => ({
    ring: el.querySelector<SVGCircleElement>(".ring")!,
    num: el.querySelector<HTMLElement>("[data-scoren]")!,
    last: -1,
  }));

  deploy = root.querySelector("[data-deploy]");
  browser = root.querySelector("[data-browser]");
  dstate = Array.from(root.querySelectorAll<HTMLElement>("[data-dstate]"));
  dbar = root.querySelector("[data-dbar]");
  dsteps = Array.from(root.querySelectorAll<HTMLElement>("[data-dstep]"));
  const u = root.querySelector<HTMLElement>("[data-type-url]");
  url = u ? { el: u, text: u.dataset.typeUrl ?? "", n: -1 } : null;
  ucaret = root.querySelector("[data-ucaret]");
  bload = root.querySelector("[data-bload]");
  bpage = root.querySelector("[data-bpage]");
  live = root.querySelector("[data-live]");
  toasts = Array.from(root.querySelectorAll<HTMLElement>("[data-toast]"));
  visitors = root.querySelector("[data-visitors]");
  vcount = root.querySelector("[data-vcount]");
  lastV = -1;
}

/** Opacity with visibility: hidden elements cost nothing to paint. */
function show(el: HTMLElement | null, v: number, key?: string) {
  if (!el) return;
  const k = key ?? "";
  const prev = k ? appOp[k] : Number(el.dataset.op ?? -1);
  if (prev !== undefined && Math.abs(prev - v) < 0.002) return;
  if (k) appOp[k] = v;
  else el.dataset.op = String(v);
  el.style.opacity = v.toFixed(3);
  el.style.visibility = v <= 0.001 ? "hidden" : "visible";
}

function setVar(el: HTMLElement, name: string, v: number) {
  if (Math.abs((vars[name] ?? -1) - v) < 0.0008) return;
  vars[name] = v;
  el.style.setProperty(name, v.toFixed(4));
}

/* Selection rectangles inside the artboard (its own 1440 × 900 px), one per design stage. */
const K = ARTBOARD.w / 1440;
const RECTS = [
  [90, 236, 560, 540],
  [92, 262, 548, 296],
  [710, 140, 620, 620],
  [92, 692, 226, 70],
].map(([x, y, w, h]) => [ARTBOARD.x + x * K, ARTBOARD.y + y * K, w * K, h * K]);
const SEL_KEYS: [number, number][] = [
  [7.35, 0],
  [7.9, 0],
  [8.08, 1],
  [8.5, 1],
  [8.68, 2],
  [9.1, 2],
  [9.28, 3],
  [9.75, 3],
];

function selectionAt(t: number) {
  const k = SEL_KEYS;
  if (t <= k[0][0]) return RECTS[0];
  if (t >= k[k.length - 1][0]) return RECTS[3];
  let i = 0;
  while (k[i + 1][0] <= t) i++;
  const a = RECTS[k[i][1]];
  const b = RECTS[k[i + 1][1]];
  if (a === b) return a;
  const u = smooth(span(t, k[i][0], k[i + 1][0]));
  return a.map((v, j) => v + (b[j] - v) * u);
}

export function updateScreen(t: number) {
  if (!idea || !design || !ab) return;

  /* Which app is on the display */
  const toD = smooth(span(t, T.toDesign[0], T.toDesign[1]));
  const toDev = smooth(span(t, T.toDev[0], T.toDev[1]));
  const toL = smooth(span(t, T.toLaunch[0], T.toLaunch[1]));
  const op = {
    idea: 1 - toD,
    design: toD * (1 - toDev),
    dev: toDev * (1 - toL),
    launch: toL,
  };
  for (const [k, v] of Object.entries(op)) show(apps[k] ?? null, v, k);

  if (op.dev > 0) updateDev(span(t, T.dev[0], T.dev[1]));
  if (op.launch > 0) updateLaunch(span(t, T.launch[0], T.launch[1]));

  /* 01 — the brief types itself, the structure draws itself */
  if (op.idea > 0) {
    const p = span(t, T.idea[0], T.idea[1]);
    const windows: [number, number][] = [
      [0.0, 0.18],
      [0.2, 0.32],
      [0.34, 0.46],
      [0.48, 0.6],
      [0.62, 0.74],
    ];
    let current = -1;
    typed.forEach((x, i) => {
      const w = windows[i] ?? [1, 1];
      const u = span(p, w[0], w[1]);
      const n = Math.round(u * x.text.length);
      if (n !== x.n) {
        x.el.textContent = x.text.slice(0, n);
        x.n = n;
      }
      if (u > 0 && (u < 1 || current === -1)) current = i;
      if (u >= 1) current = i;
    });
    carets.forEach((c, i) => {
      const on = i === current ? "1" : "0";
      if (c.style.opacity !== on) c.style.opacity = on;
    });
    draws.forEach((d, i) => {
      const u = i < 5 ? span(p, 0.12 + i * 0.07, 0.22 + i * 0.07) : span(p, 0.64 + (i - 5) * 0.055, 0.72 + (i - 5) * 0.055);
      const off = d.len * (1 - smooth(u));
      if (Math.abs(off - d.last) > 0.3) {
        d.el.style.strokeDashoffset = off.toFixed(1);
        d.last = off;
      }
    });
    nodes.forEach((n, i) => {
      const v = smooth(span(p, 0.08 + i * 0.075, 0.15 + i * 0.075));
      n.style.opacity = v.toFixed(3);
    });
    pops.forEach((el, i) => {
      const a = [0.4, 0.52, 0.64, 0.6][i] ?? 0.6;
      const v = smooth(span(p, a, a + 0.07));
      el.style.opacity = v.toFixed(3);
      el.style.transform = `scale(${(0.965 + 0.035 * v).toFixed(4)})`;
    });
  }

  /* 02 — wireframe → layout → typography → images → polish */
  if (op.design > 0) {
    setVar(ab, "--l", smooth(span(t, T.layout[0], T.layout[1])));
    setVar(ab, "--ty", smooth(span(t, T.type[0], T.type[1])));
    setVar(ab, "--im", smooth(span(t, T.images[0], T.images[1])));
    setVar(ab, "--po", smooth(span(t, T.polish[0], T.polish[1])));

    if (sel && cursor) {
      const o = smooth(span(t, 7.3, 7.45)) * (1 - smooth(span(t, 9.62, 9.78)));
      const [x, y, w, h] = selectionAt(t);
      sel.style.opacity = o.toFixed(3);
      sel.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      sel.style.width = `${w.toFixed(1)}px`;
      sel.style.height = `${h.toFixed(1)}px`;
      cursor.style.opacity = o.toFixed(3);
      cursor.style.transform = `translate(${(x + w - 10).toFixed(1)}px, ${(y + h - 8).toFixed(1)}px)`;
    }
    const stage = t < 7.35 ? -1 : t < 8.0 ? 0 : t < 8.6 ? 1 : t < 9.2 ? 2 : t < 9.8 ? 3 : -1;
    if (stage !== lastStage) {
      const L = ["hero", "h1", "img", "cta"];
      const P = ["layout", "type", "img", "po"];
      Object.entries(layers).forEach(([k, el]) => el.classList.toggle("on", stage >= 0 && L[stage] === k));
      Object.entries(props).forEach(([k, el]) => el.classList.toggle("on", stage >= 0 && P[stage] === k));
      lastStage = stage;
    }
  }
}


/* 03 — the page is written line by line; the preview assembles; the build runs; the scores fill. */
const PREVIEW_PARTS: [string, number][] = [
  ["--p1", 6],
  ["--p2", 9],
  ["--p3", 11],
  ["--p4", 13],
  ["--p5", 14],
];
function updateDev(p: number) {
  const chars = smooth(span(p, 0, 0.62)) * codeTotal;
  let current = -1;
  const lineDone: number[] = [];
  codeLines.forEach((l, i) => {
    const n = Math.max(0, Math.min(l.len, Math.round(chars - l.start)));
    lineDone[i] = n / l.len;
    if (n !== l.n) {
      l.cx.style.maxWidth = `${n}ch`;
      l.el.classList.toggle("on", chars > l.start);
      l.n = n;
    }
    if (chars > l.start) current = i;
  });
  dcarets.forEach((c, i) => {
    const on = i === current && p < 0.66 ? "1" : "0";
    if (c.style.opacity !== on) c.style.opacity = on;
  });
  if (preview) {
    for (const [name, line] of PREVIEW_PARTS) setVar(preview, name, smooth(span(lineDone[line] ?? 0, 0.3, 1)));
  }
  termLines.forEach((el, i) => {
    const v = smooth(span(p, 0.64 + i * 0.035, 0.67 + i * 0.035));
    el.style.opacity = v.toFixed(3);
  });
  scores.forEach((sc, i) => {
    const v = smooth(span(p, 0.84 + i * 0.02, 0.97 + i * 0.01));
    if (Math.abs(v - sc.last) < 0.002) return;
    sc.last = v;
    sc.ring.style.strokeDashoffset = (100 - 100 * v).toFixed(1);
    sc.num.textContent = String(Math.round(100 * v));
  });
}

/* 04 — deploy, the domain goes live, the browser opens the site, the first orders arrive. */
function updateLaunch(p: number) {
  const toBrowser = smooth(span(p, 0.36, 0.42));
  show(deploy, 1 - toBrowser);
  show(browser, toBrowser);
  if (toBrowser < 1) {
    if (dbar) dbar.style.transform = `scaleX(${smooth(span(p, 0.02, 0.3)).toFixed(4)})`;
    dsteps.forEach((el, i) => el.classList.toggle("done", p > 0.06 + i * 0.05));
    const liveNow = smooth(span(p, 0.29, 0.33));
    if (dstate[0]) dstate[0].style.opacity = (1 - liveNow).toFixed(3);
    if (dstate[1]) dstate[1].style.opacity = liveNow.toFixed(3);
  }
  if (toBrowser > 0) {
    if (url) {
      const n = Math.round(span(p, 0.42, 0.5) * url.text.length);
      if (n !== url.n) {
        url.el.textContent = url.text.slice(0, n);
        url.n = n;
      }
    }
    if (ucaret) ucaret.style.opacity = p > 0.41 && p < 0.52 ? "1" : "0";
    if (bload) {
      const l = span(p, 0.5, 0.58);
      bload.style.transform = `scaleX(${smooth(l).toFixed(4)})`;
      bload.style.opacity = (l > 0 && l < 1 ? 1 : 0).toString();
    }
    if (bpage) {
      const v = smooth(span(p, 0.53, 0.62));
      bpage.style.opacity = v.toFixed(3);
      bpage.style.transform = `translateY(${(-110 * smooth(span(p, 0.72, 1))).toFixed(1)}px)`;
    }
    show(live, smooth(span(p, 0.62, 0.68)));
    toasts.forEach((el, i) => {
      const a = 0.7 + i * 0.09;
      const v = smooth(span(p, a, a + 0.05));
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translateY(${((1 - v) * 14).toFixed(1)}px)`;
    });
    show(visitors, smooth(span(p, 0.66, 0.72)));
    const count = Math.round(38 * smooth(span(p, 0.66, 1)));
    if (vcount && count !== lastV) {
      vcount.textContent = String(count);
      lastV = count;
    }
  }
}
