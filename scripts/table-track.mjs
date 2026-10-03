// Tracks the white table through the approach clip, so the studio grade can leave it untouched.
//
//   node scripts/table-track.mjs --frames 146 --src <ungraded frames dir> --out film-src/table-track.json
//
// Starts from hand-measured keyframes (below), interpolated per frame; the back and front edges then
// snap to the table in each (ungraded) frame — walking out from the white top until it ends — and
// are smoothed over time. Per frame: back edge by, front edge fy, front face bottom fb, the top's x
// extents at the back (bx) and front (fx), and the legs [x0, x1, y0, y1].
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? def : args[i + 1];
};
const COUNT = Number(opt("frames", 146));
const OUT = opt("out", "film-src/table-track.json");
// the frames to measure: ungraded ones (a run of film-frames.mjs without --grade)
const SRC = path.resolve(opt("src", "public/film/frames"));

// f: frame; by/fy/fb: back edge, front edge, front face bottom (y); bx/fx: x extents at back/front;
// legs: [x0, x1, y0, y1] front-left, front-right, back-left, back-right (off-frame when not seen).
const KEYS = [
  { f: 0, by: 0.5375, fy: 0.5698, fb: 0.587, bx: [0.378, 0.617], fx: [0.366, 0.629], legs: [[0.356, 0.379, 0.585, 0.755], [0.613, 0.634, 0.585, 0.755], [0.387, 0.398, 0.585, 0.703], [0.601, 0.613, 0.585, 0.703]] },
  { f: 30, by: 0.522, fy: 0.556, fb: 0.578, bx: [0.357, 0.645], fx: [0.357, 0.645], legs: [[0.357, 0.378, 0.576, 0.759], [0.624, 0.645, 0.576, 0.759], [0.384, 0.396, 0.576, 0.7], [0.607, 0.619, 0.576, 0.7]] },
  { f: 60, by: 0.49, fy: 0.545, fb: 0.58, bx: [0.287, 0.71], fx: [0.287, 0.71], legs: [[0.287, 0.312, 0.578, 0.86], [0.684, 0.71, 0.578, 0.86], [0.334, 0.353, 0.578, 0.74], [0.646, 0.664, 0.578, 0.74]] },
  { f: 70, by: 0.4895, fy: 0.5866, fb: 0.6225, bx: [0.258, 0.698], fx: [0.205, 0.779], legs: [[0.205, 0.245, 0.62, 0.975], [0.745, 0.779, 0.62, 0.975], [0.286, 0.312, 0.62, 0.805], [0.674, 0.7, 0.62, 0.805]] },
  { f: 80, by: 0.476, fy: 0.626, fb: 0.668, bx: [0.13, 0.87], fx: [0.09, 0.91], legs: [[0.09, 0.135, 0.666, 1.05], [0.865, 0.91, 0.666, 1.05], [0.233, 0.263, 0.666, 0.868], [0.735, 0.77, 0.666, 0.868]] },
  { f: 85, by: 0.472, fy: 0.664, fb: 0.733, bx: [0.06, 0.94], fx: [0.0, 1.0], legs: [[-0.02, 0.06, 0.73, 1.05], [0.94, 1.02, 0.73, 1.05], [0.185, 0.22, 0.73, 0.93], [0.775, 0.81, 0.73, 0.93]] },
  { f: 92, by: 0.469, fy: 0.73, fb: 0.79, bx: [-0.02, 1.02], fx: [-0.05, 1.05], legs: [[-0.12, -0.06, 0.79, 1.05], [1.06, 1.12, 0.79, 1.05], [0.105, 0.16, 0.788, 1.05], [0.855, 0.895, 0.788, 1.05]] },
  { f: 98, by: 0.466, fy: 0.773, fb: 0.83, bx: [-0.05, 1.05], fx: [-0.1, 1.1], legs: [[-0.12, -0.06, 0.83, 1.05], [1.06, 1.12, 0.83, 1.05], [0.095, 0.125, 0.828, 1.05], [0.885, 0.92, 0.828, 1.05]] },
  { f: 105, by: 0.46, fy: 0.815, fb: 0.84, bx: [-0.05, 1.05], fx: [-0.1, 1.1], legs: [[-0.12, -0.06, 0.84, 1.05], [1.06, 1.12, 0.84, 1.05], [0.04, 0.07, 0.838, 1.05], [0.93, 0.96, 0.838, 1.05]] },
  { f: 120, by: 0.452, fy: 0.88, fb: 0.907, bx: [-0.05, 1.05], fx: [-0.1, 1.1], legs: [[-0.12, -0.06, 0.9, 1.05], [1.06, 1.12, 0.9, 1.05], [-0.1, -0.05, 0.9, 1.05], [1.05, 1.1, 0.9, 1.05]] },
  { f: 135, by: 0.437, fy: 0.907, fb: 0.935, bx: [-0.05, 1.05], fx: [-0.1, 1.1], legs: [[-0.12, -0.06, 0.93, 1.05], [1.06, 1.12, 0.93, 1.05], [-0.1, -0.05, 0.93, 1.05], [1.05, 1.1, 0.93, 1.05]] },
  { f: 145, by: 0.432, fy: 0.926, fb: 0.95, bx: [-0.05, 1.05], fx: [-0.1, 1.1], legs: [[-0.12, -0.06, 0.95, 1.05], [1.06, 1.12, 0.95, 1.05], [-0.1, -0.05, 0.95, 1.05], [1.05, 1.1, 0.95, 1.05]] },
];
const lerp = (a, b, u) => a + (b - a) * u;
const prior = (f) => {
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1].f) i++;
  const A = KEYS[i];
  const B = KEYS[i + 1];
  const u = Math.max(0, Math.min(1, (f - A.f) / (B.f - A.f)));
  const L = (a, b) => (Array.isArray(a) ? a.map((v, k) => L(v, b[k])) : lerp(a, b, u));
  return { by: L(A.by, B.by), fy: L(A.fy, B.fy), fb: L(A.fb, B.fb), bx: L(A.bx, B.bx), fx: L(A.fx, B.fx), legs: L(A.legs, B.legs) };
};

const PAGE = `<!doctype html><html><body><script>
window.track = (src, p) => new Promise((res, rej) => {
  const im = new Image();
  im.onerror = () => rej('image error');
  im.onload = () => {
    const W = im.naturalWidth, H = im.naturalHeight;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data;
    const L = (x, y) => { x = Math.max(0, Math.min(W - 1, Math.round(x))); y = Math.max(0, Math.min(H - 1, Math.round(y))); const i = (y * W + x) * 4; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; };
    const med = (a) => { const s = a.filter((v) => v !== null).sort((p, q) => p - q); return s.length ? s[s.length >> 1] : null; };
    // From a point inside the white top, walk outward until the white ends (3 pixels darker than
    // the top by 14 or more): that is the edge. Null when the walk leaves the frame or never starts
    // on the white.
    const walk = (x0, y0, dx, dy, max) => {
      const ref = L(x0, y0);
      if (ref < 200) return null;
      let run = 0;
      for (let k = 1; k < max; k++) {
        const x = x0 + dx * k, y = y0 + dy * k;
        if (x < 1 || y < 1 || x > W - 2 || y > H - 2) return null;
        if (L(x, y) < ref - 14) { if (++run >= 3) return dx ? (x - dx * 2) / W : (y - dy * 2) / H; } else run = 0;
      }
      return null;
    };
    const wB = p.bx[1] - p.bx[0], wF = p.fx[1] - p.fx[0];
    const yB = (p.by + 0.22 * (p.fy - p.by)) * H, yF = (p.fy - 0.18 * (p.fy - p.by)) * H;
    const maxX = Math.round(0.5 * W);
    // the back and front edges: walk up and down from the top at a few columns beside the laptop
    const cols = [0.12, 0.2, 0.8, 0.88].map((k) => p.bx[0] + wB * k).filter((x) => x > 0.03 && x < 0.97);
    const ym = (p.by + p.fy) / 2 * H;
    const by = med(cols.map((x) => walk(x * W, ym, 0, -1, Math.round(0.2 * H))));
    const fy = med(cols.map((x) => walk(x * W, ym, 0, 1, Math.round(0.3 * H))));
    // the four corners: walk left and right along a row near the back and a row near the front
    const inB = [p.bx[0] + 0.18 * wB, p.bx[1] - 0.18 * wB];
    const inF = [p.fx[0] + 0.18 * wF, p.fx[1] - 0.18 * wF];
    const side = (xs, y, dir) => (xs < 0.02 || xs > 0.98 ? null : walk(xs * W, y, dir, 0, maxX));
    res({
      by, fy,
      bl: side(inB[0], yB, -1), br: side(inB[1], yB, 1),
      fl: side(inF[0], yF, -1), fr: side(inF[1], yF, 1),
      // where the corners were measured (to slide them along the side to the edges)
      yB: yB / H, yF: yF / H,
    });
  };
  im.src = src;
});
</script></body></html>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__page.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(PAGE);
  }
  const p = path.join(SRC, path.basename(decodeURIComponent(url.pathname)));
  if (!fs.existsSync(p)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": "image/webp" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const sport = server.address().port;
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", `--user-data-dir=/tmp/codera-track-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch {}
  await sleep(250);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const n = ++id;
    pending.set(n, r);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
await send("Page.navigate", { url: `http://127.0.0.1:${sport}/__page.html` });
await sleep(600);

const raw = [];
for (let f = 0; f < COUNT; f++) {
  const p = prior(f);
  const r = await send("Runtime.evaluate", { expression: `window.track(${JSON.stringify(`/frames/${f}.webp`)}, ${JSON.stringify(p)})`, returnByValue: true, awaitPromise: true });
  raw.push({ p, m: r.result?.result?.value ?? {} });
}
// measured where found (and near the prior), prior elsewhere; then a median over 5 frames and a
// 3-frame average. Corners measured on rows inside the top are carried to the back and front edges
// along the line through both rows.
const near = (v, p, tol) => (v != null && Math.abs(v - p) < tol ? v : p);
const smoothS = (a) => {
  const m = a.map((_, i) => {
    const w = a.slice(Math.max(0, i - 2), i + 3).slice().sort((x, y) => x - y);
    return w[w.length >> 1];
  });
  return m.map((_, i) => (m[Math.max(0, i - 1)] + m[i] + m[Math.min(m.length - 1, i + 1)]) / 3);
};
const S = (get) => smoothS(raw.map(get));
const by = S(({ p, m }) => near(m.by, p.by, 0.02));
const fy = S(({ p, m }) => near(m.fy, p.fy, 0.025));
// the sides come from the measured keyframes (the floor beside the table is often as bright as the
// table, so its sides are not measured per frame)
const out = raw.map(({ p }, f) => {
  const r = (v) => Number(v.toFixed(4));
  const dfy = fy[f] - p.fy;
  return { by: r(by[f]), fy: r(fy[f]), fb: r(p.fb + dfy), bx: p.bx.map(r), fx: p.fx.map(r), legs: p.legs.map((l) => l.map(r)) };
});
fs.writeFileSync(OUT, JSON.stringify(out));
const found = (k) => raw.filter(({ m }) => m[k] != null).length;
console.log(`tracked ${COUNT} frames → ${OUT}; back edge found in ${found("by")}, front edge in ${found("fy")}`);
for (const f of [0, 30, 60, 70, 80, 85, 92, 98, 105, 120, 135, 145]) console.log(f, JSON.stringify(out[f]), "raw", JSON.stringify(raw[f].m));
ws.close();
chrome.kill();
server.close();
