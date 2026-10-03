// Turns the generated film clips into a scroll-scrubbable image sequence.
//
//   node scripts/film-frames.mjs --fps 24 --width 1600 --quality 0.82 --grade film-src/table-track.json \
//     --out public/film film-src/clips-light/v1.mp4 film-src/clips-light/v2.mp4
//
// (--bridge 0:106:120:1.94:0.5,0.537:0.508,0.576 hides a stretch of a clip behind a cross-zoom.)
//
// For every output frame it: decodes the clip in Google Chrome, finds the chroma-green display,
// records its four corners (normalised 0…1, TL TR BR BL) and replaces the green with a dark
// "screen off" glass tone, then writes a WebP. The site maps the live DOM display onto the corners.
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
const FPS = Number(opt("fps", 15));
const WIDTH = Number(opt("width", 1600));
const OUT = opt("out", "public/film");
const QUALITY = Number(opt("quality", 0.74));
// --bridge clip:a:b:k:ax,ay:bx,by (repeatable) — frames a…b of a clip are replaced on the site by a
// cross-zoom between a and b (a generation artefact hidden by a push-in). k: subject scale from a to b.
const bridges = [];
for (let b = opt("bridge"); b; b = opt("bridge")) {
  const [clip, a, bb, k, pa, pb] = b.split(":");
  bridges.push({ clip: +clip, a: +a, b: +bb, k: +k, pa: pa.split(",").map(Number), pb: pb.split(",").map(Number) });
}
// --grade <track.json>: the studio grade (scripts/grade.js), leaving the white table untouched —
// tracked through the approach clip (scripts/table-track.mjs), fixed in the locked lid clip.
const GRADE = opt("grade", null);
// --nokey 0,2: clips with no display in them (the approach) are written as generated, no green clean-up.
const NOKEY = new Set(String(opt("nokey", "")).split(",").filter(Boolean).map(Number));
const clips = args;
const root = process.cwd();
const TRACK = GRADE ? JSON.parse(fs.readFileSync(GRADE, "utf8")) : null;
// the table in the locked clip: from its back edge to its front edge, side to side
const LOCKED = { by: 0.433, fy: 0.9235 };
const keepFor = (clipIndex, local) => {
  if (!TRACK) return null;
  if (clipIndex === 0 && TRACK[Math.min(local, TRACK.length - 1)]) {
    const g = TRACK[Math.min(local, TRACK.length - 1)];
    // exact: the table top well inside its edges (with the laptop on it)
    const ix = 0.012 * (g.bx[1] - g.bx[0]) + 0.004;
    const inner = { pts: [[g.bx[0] + ix, g.by + 0.004], [g.bx[1] - ix, g.by + 0.004], [g.fx[1] - ix, g.fy - 0.003], [g.fx[0] + ix, g.fy - 0.003]], feather: 0.001, grow: 0 };
    // search, a hair beyond its measured edges: the table's own white pixels are kept, the floor
    // around it is still graded (no box, no glow)
    const m = 0.004;
    const top = { pts: [[g.bx[0] - m, g.by - 0.001], [g.bx[1] + m, g.by - 0.001], [g.fx[1] + m, g.fy], [g.fx[1] + m, g.fb + 0.004], [g.fx[0] - m, g.fb + 0.004], [g.fx[0] - m, g.fy]], feather: 0, grow: 0, refine: true };
    const legs = g.legs.map(([x0, x1, y0, y1]) => ({ pts: [[x0 - m, y0], [x1 + m, y0], [x1 + m, y1 + 0.003], [x0 - m, y1 + 0.003]], feather: 0, grow: 0, refine: true }));
    return [inner, top, ...legs];
  }
  return [{ pts: [[-0.05, LOCKED.by], [1.05, LOCKED.by], [1.05, LOCKED.fy], [-0.05, LOCKED.fy]], feather: 0.0015, grow: 0 }];
};
const GRADE_JS = GRADE ? fs.readFileSync(path.join(root, "scripts/grade.js"), "utf8") : "";
fs.mkdirSync(path.join(OUT, "frames"), { recursive: true });

const PAGE = `<!doctype html><html><body style="margin:0;background:#000"><video id="v" muted playsinline preload="auto"></video><canvas id="c"></canvas><script>${GRADE_JS}</script><script>
window.load = (src) => new Promise((res, rej) => { window.__prev = null; window.__lastQuad = null; const v = document.getElementById('v'); v.onloadeddata = () => res({ d: v.duration, w: v.videoWidth, h: v.videoHeight }); v.onerror = () => rej('video error ' + (v.error && v.error.code)); v.src = src; v.load(); });
window.frame = (time, W, quality, keep, nokey) => new Promise((res) => {
  const v = document.getElementById('v');
  const done = () => {
    const H = Math.round(W * v.videoHeight / v.videoWidth);
    const c = document.getElementById('c'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(v, 0, 0, W, H);
    const img = g.getImageData(0, 0, W, H); const d = img.data;
    // Green mask → per-row and per-column extents → straight edges fitted by least squares.
    const isG = (i) => { const r = d[i], gg = d[i + 1], b = d[i + 2]; return gg > 55 && gg - Math.max(r, b) > 38 && gg > 1.45 * Math.max(r, b); };
    let n = 0;
    const L = new Int32Array(H).fill(-1), R = new Int32Array(H).fill(-1), Tc = new Int32Array(W).fill(-1), Bc = new Int32Array(W).fill(-1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!isG((y * W + x) * 4)) continue;
      n++;
      if (L[y] < 0) L[y] = x; R[y] = x;
      if (Tc[x] < 0) Tc[x] = y; Bc[x] = y;
    }
    let quad = null;
    if (n > W * H * 0.0015) {
      let y0 = H, y1 = -1, x0 = W, x1 = -1;
      for (let y = 0; y < H; y++) if (L[y] >= 0 && R[y] - L[y] > 8) { if (y < y0) y0 = y; y1 = y; }
      for (let x = 0; x < W; x++) if (Tc[x] >= 0 && Bc[x] - Tc[x] > 4) { if (x < x0) x0 = x; x1 = x; }
      const fit = (pts) => { // least squares v = a·u + b
        let su = 0, sv = 0, suu = 0, suv = 0; const k = pts.length;
        for (const [u, v] of pts) { su += u; sv += v; suu += u * u; suv += u * v; }
        const den = k * suu - su * su; const a = den ? (k * suv - su * sv) / den : 0; return { a, b: (sv - a * su) / k };
      };
      const rows = [], cols = [];
      const my = (y1 - y0) * 0.14, mx = (x1 - x0) * 0.14;
      for (let y = Math.ceil(y0 + my); y <= y1 - my; y++) if (L[y] >= 0) rows.push(y);
      for (let x = Math.ceil(x0 + mx); x <= x1 - mx; x++) if (Tc[x] >= 0) cols.push(x);
      if (rows.length > 4 && cols.length > 4) {
        const med = (arr) => { const a = arr.slice().sort((p, q) => p - q); return a[a.length >> 1]; };
        const clip = {
          l: med(rows.map((y) => L[y])) <= 1, r: med(rows.map((y) => R[y])) >= W - 2,
          t: med(cols.map((x) => Tc[x])) <= 1, b: med(cols.map((x) => Bc[x])) >= H - 2,
        };
        const left = fit(rows.map((y) => [y, L[y] - 0.5])), right = fit(rows.map((y) => [y, R[y] + 0.5]));
        const top = fit(cols.map((x) => [x, Tc[x] - 0.5])), bot = fit(cols.map((x) => [x, Bc[x] + 0.5]));
        // x = a·y + b (sides), y = c·x + d (top/bottom)
        const meet = (side, tb) => { const x = (side.a * tb.b + side.b) / (1 - side.a * tb.a); return [x, tb.a * x + tb.b]; };
        let q = [meet(left, top), meet(right, top), meet(right, bot), meet(left, bot)];
        const A = window.__aspect;
        if (!clip.l && !clip.r && !clip.t && !clip.b) {
          const w = (Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]) + Math.hypot(q[2][0] - q[3][0], q[2][1] - q[3][1])) / 2;
          const h = (Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) + Math.hypot(q[2][0] - q[1][0], q[2][1] - q[1][1])) / 2;
          if (h > 40) window.__aspect = w / h;
          quad = q;
        } else if (A && !clip.t && !clip.l && !clip.r && clip.b) {
          // The bottom of the display has left the frame: rebuild it from the display's proportions.
          const w0 = q[1][0] - q[0][0];
          q[3] = [q[0][0], q[0][1] + w0 / A];
          q[2] = [q[1][0], q[1][1] + w0 / A];
          quad = q;
        } else if (A && !clip.t && clip.l && clip.r) {
          // Only the top edge is reliable: keep the previous frame's proportions about the visible top.
          const prev = window.__lastQuad;
          if (prev) {
            const s0 = (q[0][1] - (H - 1)) / (prev[0][1] - (H - 1) || 1);
            quad = prev.map(([x, y]) => [W / 2 + (x - W / 2) * s0, (H - 1) + (y - (H - 1)) * s0]);
          }
        } else if (window.__lastQuad) {
          quad = window.__lastQuad;
        }
        if (quad) window.__lastQuad = quad;
        if (quad) quad = quad.map(([x, y]) => [x / W, y / H]);
      }
    }
    // Screen off: replace the green with dark glass; the anti-aliased rim around it goes dark too.
    if (!nokey) {
    const core = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) { const r = d[k * 4], gg = d[k * 4 + 1], b = d[k * 4 + 2]; if (gg > 60 && gg - Math.max(r, b) > 40) core[k] = 1; }
    const nearCore = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && core[yy * W + xx]) return true; } return false; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; const r = d[i], gg = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, b); const m = gg - mx;
      if (core[y * W + x]) { const k = 10 + Math.round(6 * (1 - y / H)); d[i] = k; d[i + 1] = k + 1; d[i + 2] = k + 3; }
      else if (m > 4 && (mx < 40 || nearCore(x, y))) { const k = Math.min(1, (m - 4) / 30); const t = Math.round(mx * (1 - k) + 12 * k); d[i] = Math.round(r * (1 - k) + 12 * k); d[i + 1] = t; d[i + 2] = Math.round(b * (1 - k) + 14 * k); }
      else {
        // Green light on grey and aluminium (the keyboard as the lid closes): back toward neutral.
        // Warm tones (red above green) are left alone, with a soft ramp in between.
        const ex = gg - (r + b) / 2 - 3; if (ex > 0) { const w = Math.min(1, Math.max(0, (gg - r + 10) / 15)); if (w > 0) d[i + 1] = Math.round(gg - ex * w); }
      }
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
    if (quad) despill(quad.map(([x, y]) => [x * W, y * H]));
    }
    g.putImageData(img, 0, 0);
    if (keep && window.studioGrade) window.studioGrade(g, W, H, keep);
    // Motion energy: mean absolute luminance change against the previous frame, at 160 px wide.
    const sw = 160, sh = Math.round(160 * H / W);
    const sc = window.__small || (window.__small = document.createElement('canvas'));
    sc.width = sw; sc.height = sh;
    const sg = sc.getContext('2d', { willReadFrequently: true });
    sg.drawImage(c, 0, 0, sw, sh);
    const sd = sg.getImageData(0, 0, sw, sh).data;
    const lum = new Float32Array(sw * sh);
    for (let k = 0; k < sw * sh; k++) lum[k] = 0.299 * sd[k * 4] + 0.587 * sd[k * 4 + 1] + 0.114 * sd[k * 4 + 2];
    let motion = 0;
    if (window.__prev && window.__prev.length === lum.length) { for (let k = 0; k < lum.length; k++) motion += Math.abs(lum[k] - window.__prev[k]); motion /= lum.length; }
    window.__prev = lum;
    res({ data: c.toDataURL('image/webp', quality).split(',')[1], quad, area: n / (W * H), motion });
  };
  v.addEventListener('seeked', done, { once: true });
  v.currentTime = time;
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
  const size = fs.statSync(p).size;
  const type = p.endsWith(".mp4") ? "video/mp4" : "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s);
    const end = e ? Number(e) : size - 1;
    res.writeHead(206, { "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1, "Content-Type": type });
    fs.createReadStream(p, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": size, "Content-Type": type, "Accept-Ranges": "bytes" });
    fs.createReadStream(p).pipe(res);
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const sport = server.address().port;

const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required",
  `--user-data-dir=/tmp/codera-frames-${port}`, "about:blank",
], { stdio: "ignore" });
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
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
  return r.result?.result?.value;
};
await send("Page.enable");
await send("Page.navigate", { url: `http://127.0.0.1:${sport}/__page.html` });
await sleep(800);

const manifest = { width: 0, height: 0, fps: FPS, frames: 0, src: "/film/frames/{i}.webp", clips: [], quads: [], motion: [] };
let index = 0;
for (const [clipIndex, clip] of clips.entries()) {
  const meta = await evaluate(`window.load(${JSON.stringify("/" + clip)})`);
  const count = Math.floor(meta.d * FPS) + 1;
  const start = index;
  for (let k = 0; k < count; k++) {
    const time = Math.min(meta.d - 0.001, k / FPS);
    const f = await evaluate(`window.frame(${time}, ${WIDTH}, ${QUALITY}, ${JSON.stringify(keepFor(clipIndex, k))}, ${NOKEY.has(clipIndex)})`);
    fs.writeFileSync(path.join(OUT, "frames", `${index}.webp`), Buffer.from(f.data, "base64"));
    manifest.quads.push(f.quad ? f.quad.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]) : null);
    manifest.motion.push(Number(f.motion.toFixed(3)));
    index++;
  }
  manifest.clips.push({ name: path.basename(clip, ".mp4"), start, count, duration: meta.d });
  manifest.width = WIDTH;
  manifest.height = Math.round((WIDTH * meta.h) / meta.w);
  console.log(`${clip}: ${meta.w}x${meta.h} ${meta.d.toFixed(2)}s → ${count} frames`);
}
manifest.frames = index;
if (bridges.length) manifest.bridges = bridges;
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest));
console.log(`wrote ${index} frames and ${path.join(OUT, "manifest.json")}`);
ws.close();
chrome.kill();
server.close();
