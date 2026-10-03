// Finds every chroma-green display in a still, records its corners and turns the green into glass
// (dark, or with --glass light a blank light page).
//
//   node scripts/still-screens.mjs --width 3840 --glass light --out public/film/work-1 film-src/work/w1-monitor.png
//
// Writes <out>.webp (the cleaned still) and <out>.json: { width, height, screens: [[TL, TR, BR, BL], …] }
// with corners normalised 0…1, sorted left to right. The site maps live DOM screens onto them. Its
// soft backdrop is made from <out>.webp by scripts/backdrop.mjs.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const WIDTH = Number(opt("width", 3200));
const OUT = opt("out", "public/film/devices");
const QUALITY = Number(opt("quality", 0.86));
// --glass dark (screens off, black glass) or light (screens on, a blank ivory page)
const GLASS = opt("glass", "dark");
// --keep '<json>': grade the studio (scripts/grade.js) except inside these polygons (the white desk)
const KEEP = opt("keep", null);
const GRADE_JS = KEEP ? fs.readFileSync(path.join(process.cwd(), "scripts/grade.js"), "utf8") : "";
const [src] = args;
const root = process.cwd();

const PAGE = `<!doctype html><html><body style="margin:0"><canvas id="c"></canvas><script>${GRADE_JS}</script><script>
window.run = (src, W, quality, glass, keep) => new Promise((res, rej) => {
  const im = new Image();
  im.onerror = () => rej('image error');
  im.onload = () => {
    const H = Math.round(W * im.naturalHeight / im.naturalWidth);
    const c = document.getElementById('c'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high';
    g.drawImage(im, 0, 0, W, H);
    const img = g.getImageData(0, 0, W, H); const d = img.data;
    const isG = (i) => { const r = d[i], gg = d[i + 1], b = d[i + 2]; return gg > 55 && gg - Math.max(r, b) > 38 && gg > 1.45 * Math.max(r, b); };
    // Label the green mask on a coarse grid, then measure each region at full resolution.
    const S = 4, w = Math.ceil(W / S), h = Math.ceil(H / S);
    const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = Math.min(W - 1, x * S + 1), Y = Math.min(H - 1, y * S + 1); if (isG((Y * W + X) * 4)) m[y * w + x] = 1; }
    const lab = new Int32Array(w * h).fill(-1); const regions = [];
    for (let s0 = 0; s0 < w * h; s0++) {
      if (!m[s0] || lab[s0] >= 0) continue;
      const id = regions.length; let n = 0, x0 = w, x1 = 0, y0 = h, y1 = 0; const st = [s0]; lab[s0] = id;
      while (st.length) { const p = st.pop(); n++; const x = p % w, y = (p / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (const q of [p - 1, p + 1, p - w, p + w]) { if (q < 0 || q >= w * h) continue; if (Math.abs((q % w) - x) > 1) continue; if (m[q] && lab[q] < 0) { lab[q] = id; st.push(q); } } }
      regions.push({ n, x0: x0 * S, x1: Math.min(W - 1, x1 * S + S), y0: y0 * S, y1: Math.min(H - 1, y1 * S + S) });
    }
    const fit1 = (pts) => { let su = 0, sv = 0, suu = 0, suv = 0; const k = pts.length; for (const [u, v] of pts) { su += u; sv += v; suu += u * u; suv += u * v; } const den = k * suu - su * su; const a = den ? (k * suv - su * sv) / den : 0; return { a, b: (sv - a * su) / k }; };
    // Robust: refit without the points far from the first line (a camera cut-out, a notch, a glint).
    const fit = (pts) => { let f = fit1(pts); for (let pass = 0; pass < 2; pass++) { const res = pts.map(([u, v]) => Math.abs(v - (f.a * u + f.b))); const med = res.slice().sort((p, q) => p - q)[res.length >> 1]; const keep = pts.filter((_, i) => res[i] <= Math.max(1.5, 2.5 * med)); if (keep.length < 5) break; f = fit1(keep); } return f; };
    const screens = [];
    for (const R of regions) {
      if (R.n * S * S < W * H * 0.0006) continue;
      const bw = R.x1 - R.x0 + 1, bh = R.y1 - R.y0 + 1;
      const L = new Int32Array(bh).fill(-1), Rr = new Int32Array(bh).fill(-1), Tc = new Int32Array(bw).fill(-1), Bc = new Int32Array(bw).fill(-1);
      for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) { if (!isG((y * W + x) * 4)) continue; const yy = y - R.y0, xx = x - R.x0; if (L[yy] < 0) L[yy] = x; Rr[yy] = x; if (Tc[xx] < 0) Tc[xx] = y; Bc[xx] = y; }
      const rows = [], cols = []; const my = bh * 0.14, mx = bw * 0.14;
      for (let yy = Math.ceil(my); yy <= bh - my; yy++) if (L[yy] >= 0) rows.push(yy);
      for (let xx = Math.ceil(mx); xx <= bw - mx; xx++) if (Tc[xx] >= 0) cols.push(xx);
      if (rows.length < 5 || cols.length < 5) continue;
      const left = fit(rows.map((yy) => [yy + R.y0, L[yy] - 0.5])), right = fit(rows.map((yy) => [yy + R.y0, Rr[yy] + 0.5]));
      const top = fit(cols.map((xx) => [xx + R.x0, Tc[xx] - 0.5])), bot = fit(cols.map((xx) => [xx + R.x0, Bc[xx] + 0.5]));
      const meet = (side, tb) => { const x = (side.a * tb.b + side.b) / (1 - side.a * tb.a); return [x, tb.a * x + tb.b]; };
      const q = [meet(left, top), meet(right, top), meet(right, bot), meet(left, bot)];
      screens.push(q.map(([x, y]) => [x / W, y / H]));
    }
    screens.sort((a, b) => a[0][0] - b[0][0]);
    // Screens off: dark glass where the green was; neutralise green spill on lit surfaces.
    const core = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) { const r = d[k * 4], gg = d[k * 4 + 1], b = d[k * 4 + 2]; if (gg > 60 && gg - Math.max(r, b) > 40) core[k] = 1; }
    const nearCore = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && core[yy * W + xx]) return true; } return false; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; const r = d[i], gg = d[i + 1], b = d[i + 2];
      const mxv = Math.max(r, b); const k0 = gg - mxv;
      if (core[y * W + x]) {
        if (glass === 'light') { const k = 1 - 0.05 * (y / H); d[i] = Math.round(241 * k); d[i + 1] = Math.round(237 * k); d[i + 2] = Math.round(230 * k); }
        else { d[i] = 12; d[i + 1] = 13; d[i + 2] = 15; }
      }
      else if (k0 > 4 && (mxv < 40 || nearCore(x, y))) { const k = Math.min(1, (k0 - 4) / 30); d[i] = Math.round(r * (1 - k) + 12 * k); d[i + 1] = Math.round(mxv * (1 - k) + 13 * k); d[i + 2] = Math.round(b * (1 - k) + 15 * k); }
    }

    // Green light reflected under a display (desk, keyboard): pull it back to the hue of the surface beside it.
    const despill = (q) => {
      const xl = Math.min(q[0][0], q[3][0]), xr = Math.max(q[1][0], q[2][0]);
      const yt = Math.min(q[0][1], q[1][1]), yb = Math.max(q[2][1], q[3][1]);
      const qw = xr - xl, qh = yb - yt, sw = Math.max(4, Math.round(0.12 * qw));
      const zx0 = Math.max(0, Math.floor(xl - 0.15 * qw)), zx1 = Math.min(W - 1, Math.ceil(xr + 0.15 * qw));
      const zy0 = Math.max(0, Math.floor(yb)), zy1 = Math.min(H - 1, Math.ceil(yb + 1.3 * qh));
      for (let y = zy0; y <= zy1; y++) {
        const sm = [];
        for (const x0 of [zx0 - sw, zx1 + 1]) for (let x = x0; x < x0 + sw; x++) { if (x < 0 || x >= W) continue; const i = (y * W + x) * 4; sm.push(d[i + 1] - (d[i] + d[i + 2]) / 2); }
        if (sm.length < 4) continue;
        sm.sort((a, b) => a - b);
        const ref = sm[sm.length >> 1];
        const vy = Math.min(1, (1 - (y - zy0) / Math.max(1, zy1 - zy0)) / 0.3);
        for (let x = zx0; x <= zx1; x++) {
          const i = (y * W + x) * 4; const ex = d[i + 1] - (d[i] + d[i + 2]) / 2 - ref;
          if (ex <= 0) continue;
          const fx = Math.min(1, Math.min(x - zx0, zx1 - x) / Math.max(1, 0.08 * qw));
          d[i + 1] = Math.round(d[i + 1] - ex * Math.max(0, Math.min(1, fx * vy)));
        }
      }
    };
    for (const q of screens) despill(q.map(([x, y]) => [x * W, y * H]));
    g.putImageData(img, 0, 0);
    if (keep && window.studioGrade) window.studioGrade(g, W, H, keep);
    res({ data: c.toDataURL('image/webp', quality).split(',')[1], W, H, screens });
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
  const p = path.join(root, decodeURIComponent(url.pathname));
  if (!p.startsWith(root) || !fs.existsSync(p)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": p.endsWith(".png") ? "image/png" : "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const sport = server.address().port;
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", `--user-data-dir=/tmp/codera-still-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = list.find((t) => t.type === "page"); if (target) break; } catch {}
  await sleep(250);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await send("Page.navigate", { url: `http://127.0.0.1:${sport}/__page.html` });
await sleep(800);
const r = await send("Runtime.evaluate", { expression: `window.run(${JSON.stringify("/" + src)}, ${WIDTH}, ${QUALITY}, ${JSON.stringify(GLASS)}, ${KEEP || "null"})`, returnByValue: true, awaitPromise: true });
if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
const out = r.result.result.value;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(`${OUT}.webp`, Buffer.from(out.data, "base64"));
const screens = out.screens.map((q) => q.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));
fs.writeFileSync(`${OUT}.json`, JSON.stringify({ width: out.W, height: out.H, screens }));
console.log(`${src}: ${out.W}x${out.H}, ${screens.length} screens`, JSON.stringify(screens));
ws.close();
chrome.kill();
server.close();
