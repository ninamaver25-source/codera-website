// Rasterise the website mockups for the hero's floating screens (needs the dev server on :3001
// and Google Chrome):   node scripts/screens.mjs lumiere noir alba movement pinnacle vela aure
import { spawn, execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const names = process.argv.slice(2);
const out = "public/images/screens";
mkdirSync(out, { recursive: true });
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--window-size=1440,900", "--hide-scrollbars",
  "--no-first-run", "--no-default-browser-check", `--user-data-dir=/tmp/codera-screens-${port}`, "about:blank",
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
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
for (const name of names) {
  await send("Page.navigate", { url: `http://localhost:3001/mock/${name}` });
  for (let i = 0; i < 200; i++) {
    const ok = await evaluate(`document.fonts.status === "loaded" && document.querySelector(".site") && Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0)`);
    if (ok) break;
    await sleep(250);
  }
  await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 86, fromSurface: true, clip: { x: 0, y: 0, width: 1440, height: 900, scale: 1 } });
  const file = `${out}/${name}.jpg`;
  writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  execFileSync("sips", ["--resampleWidth", "960", file], { stdio: "ignore" });
  console.log("saved", file);
}
ws.close(); chrome.kill();
