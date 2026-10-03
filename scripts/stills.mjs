// Headless Chrome stills of the film (needs the dev server on :3001 and Google Chrome).
//   node scripts/stills.mjs <outdir> <width> <height> t:0 t:3.2 0.5 ...   (t:<units of 14> or progress 0..1)
//   SETTLE=2200 node scripts/stills.mjs out 1440 900 t:7.0
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const [outDir, W, H, ...points] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, "--hide-scrollbars",
  ...(process.env.ANGLE ? [`--use-angle=${process.env.ANGLE}`] : []), "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader", "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=/tmp/codera-shots-${port}`, "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); target = list.find((t) => t.type === "page"); if (target) break; } catch {}
  await sleep(250);
}
if (!target) { console.error("no chrome target"); chrome.kill(); process.exit(1); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) console.log("console." + m.params.type, m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300)); if (m.method === "Runtime.exceptionThrown") console.log("exception", JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 700 });
for (const pt of points) {
  const p = pt.startsWith("t:") ? (parseFloat(pt.slice(2)) / +(process.env.UNITS || 14)) : parseFloat(pt);
  await send("Page.navigate", { url: `http://localhost:3001/?p=${p}${process.env.EXTRA || ""}` });
  // Wait for the curtain to open (assets loaded), then a little settle time for reflections.
  const t0 = Date.now(); for (let i = 0; i < 600; i++) { if (await evaluate(`!!document.querySelector(${JSON.stringify(process.env.READY || ".ofc-curtain.is-open")})`)) break; await sleep(250); } console.log("curtain after", ((Date.now() - t0) / 1000).toFixed(1), "s");
  await sleep(+(process.env.SETTLE || 2500));
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 88, fromSurface: true, captureBeyondViewport: false });
  const name = `${outDir}/${pt.replace(":", "")}.jpg`;
  writeFileSync(name, Buffer.from(shot.result.data, "base64"));
  console.log("saved", name);
}
ws.close(); chrome.kill();
