// The soft backdrop of a still: the still itself, out of focus, continued above and below by its
// own mirror image, which melts into a softer continuation of its outermost rows. Laid behind the
// sharp still, it fills a tall screen with the same room — no stretched bands, no hard edges.
//
//   node scripts/backdrop.mjs --width 1200 --blur 7 --out public/film/devices-back public/film/devices.webp
//
// Writes <out>.webp: <width> × 3·height, where height is the still's own height at that width; the
// still (blurred by --blur px) is the middle third.
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
const WIDTH = Number(opt("width", 1200));
const BLUR = Number(opt("blur", 7));
const OUT = opt("out", "public/film/backdrop");
const QUALITY = Number(opt("quality", 0.82));
const [src] = args;
const root = process.cwd();

const PAGE = `<!doctype html><html><body style="margin:0"><script>
window.run = (src, W, r1, quality) => new Promise((res, rej) => {
  const im = new Image();
  im.onerror = () => rej('image error');
  im.onload = () => {
    const H = Math.round(W * im.naturalHeight / im.naturalWidth);
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    // U: mirror | still | mirror (vertically), so every blur below is continuous across the seams.
    const U = mk(W, 3 * H); const u = U.getContext('2d'); u.imageSmoothingQuality = 'high';
    u.drawImage(im, 0, H, W, H);
    u.save(); u.translate(0, H); u.scale(1, -1); u.drawImage(im, 0, 0, W, H); u.restore();
    u.save(); u.translate(0, 3 * H); u.scale(1, -1); u.drawImage(im, 0, 0, W, H); u.restore();
    // Blur with mirrored side margins (no dark or transparent rim at the left and right).
    const blur = (r) => {
      const pad = Math.ceil(r * 3) + 2;
      const P = mk(W + 2 * pad, 3 * H); const p = P.getContext('2d');
      p.drawImage(U, pad, 0);
      p.save(); p.translate(pad, 0); p.scale(-1, 1); p.drawImage(U, 0, 0); p.restore();
      p.save(); p.translate(pad + 2 * W, 0); p.scale(-1, 1); p.drawImage(U, 0, 0); p.restore();
      const B = mk(W + 2 * pad, 3 * H); const b = B.getContext('2d'); b.filter = 'blur(' + r + 'px)'; b.drawImage(P, 0, 0);
      const C = mk(W, 3 * H); C.getContext('2d').drawImage(B, pad, 0, W, 3 * H, 0, 0, W, 3 * H);
      return C;
    };
    const B1 = blur(r1);
    const B2 = blur(Math.max(r1 * 3, W * 0.03));
    const out = mk(W, 3 * H); const o = out.getContext('2d'); o.imageSmoothingQuality = 'high';
    // far: the outermost rows of the softest copy, carried on (soft vertical light, like the room going on)
    const k = Math.max(2, Math.round(H * 0.02));
    o.drawImage(B2, 0, H, W, k, 0, 0, W, H + 1);
    o.drawImage(B2, 0, 2 * H - k, W, k, 0, 2 * H - 1, W, H + 1);
    // eased alpha ramp between two heights (y0 transparent → y1 opaque)
    const ramp = (g, y0, y1, total, inv) => {
      for (let i = 0; i <= 8; i++) { const s = i / 8; const a = s * s * (3 - 2 * s); g.addColorStop(Math.min(1, Math.max(0, (y0 + (y1 - y0) * s) / total)), 'rgba(0,0,0,' + (inv ? 1 - a : a).toFixed(4) + ')'); }
    };
    const masked = (srcC, stops) => {
      const c = mk(W, 3 * H); const g = c.getContext('2d'); g.drawImage(srcC, 0, 0);
      g.globalCompositeOperation = 'destination-in';
      const gr = g.createLinearGradient(0, 0, 0, 3 * H); stops(gr); g.fillStyle = gr; g.fillRect(0, 0, W, 3 * H);
      return c;
    };
    // near: the mirror image, soft, fading out with distance from the still
    o.drawImage(masked(B2, (gr) => { ramp(gr, H - 0.3 * H, H - 0.04 * H, 3 * H, false); ramp(gr, 2 * H + 0.03 * H, 2 * H + 0.2 * H, 3 * H, true); }), 0, 0);
    // middle: the still out of focus, melting into the mirror just beyond its edges
    o.drawImage(masked(B1, (gr) => { ramp(gr, H - 0.1 * H, H, 3 * H, false); ramp(gr, 2 * H, 2 * H + 0.1 * H, 3 * H, true); }), 0, 0);
    res({ data: out.toDataURL('image/webp', quality).split(',')[1], W, H: 3 * H });
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
  const type = p.endsWith(".png") ? "image/png" : p.endsWith(".webp") ? "image/webp" : p.endsWith(".jpg") ? "image/jpeg" : "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const sport = server.address().port;
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", `--user-data-dir=/tmp/codera-back-${port}`, "about:blank"], { stdio: "ignore" });
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
await sleep(800);
const r = await send("Runtime.evaluate", { expression: `window.run(${JSON.stringify("/" + src)}, ${WIDTH}, ${BLUR}, ${QUALITY})`, returnByValue: true, awaitPromise: true });
if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
const out = r.result.result.value;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(`${OUT}.webp`, Buffer.from(out.data, "base64"));
console.log(`${src} → ${OUT}.webp ${out.W}x${out.H}`);
ws.close();
chrome.kill();
server.close();
