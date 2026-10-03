import type { CSSProperties } from "react";
import { Artboard } from "./Artboard";

/* Syntax classes: k keyword, t tag, a attribute, s string, n number, c comment, p punctuation */
type Tok = [string, string];

/** The page the developer writes while the preview assembles itself. */
export const CODE: Tok[][] = [
  [["k", "import"], ["p", " { "], ["", "Nav"], ["p", ", "], ["", "ProductImage"], ["p", ", "], ["", "Notes"], ["p", " } "], ["k", "from"], ["s", ' "@/components"'], ["p", ";"]],
  [["k", "import"], ["p", " { "], ["", "AddToBag"], ["p", " } "], ["k", "from"], ["s", ' "@/shop"'], ["p", ";"]],
  [],
  [["k", "export default function"], ["", " Home"], ["p", "() {"]],
  [["k", "  return"], ["p", " ("]],
  [["p", "    <"], ["t", "main"], ["a", " className"], ["p", "="], ["s", '"home"'], ["p", ">"]],
  [["p", "      <"], ["t", "Nav"], ["a", " links"], ["p", "={"], ["s", '["Fragrance", "Body", "Story", "Journal"]'], ["p", "} />"]],
  [["p", "      <"], ["t", "section"], ["a", " className"], ["p", "="], ["s", '"hero"'], ["p", ">"]],
  [["p", "        <"], ["t", "p"], ["a", " className"], ["p", "="], ["s", '"kicker"'], ["p", ">"], ["", "N° 04 — Eau de parfum"], ["p", "</"], ["t", "p"], ["p", ">"]],
  [["p", "        <"], ["t", "h1"], ["p", ">"], ["", "Aure"], ["p", "<"], ["t", "br"], ["p", " />"], ["", "No. 04"], ["p", "</"], ["t", "h1"], ["p", ">"]],
  [["p", "        <"], ["t", "p"], ["a", " className"], ["p", "="], ["s", '"lead"'], ["p", ">"], ["", "Fig leaf, iris and cedar."], ["p", "</"], ["t", "p"], ["p", ">"]],
  [["p", "        <"], ["t", "AddToBag"], ["a", " product"], ["p", "="], ["s", '"aure-04"'], ["a", " price"], ["p", "={"], ["n", "180"], ["p", "} />"]],
  [["p", "      </"], ["t", "section"], ["p", ">"]],
  [["p", "      <"], ["t", "ProductImage"], ["a", " src"], ["p", "="], ["s", '"/aure-04.avif"'], ["a", " priority"], ["p", " />"]],
  [["p", "      <"], ["t", "Notes"], ["a", " top"], ["p", "="], ["s", '"Bergamot"'], ["a", " heart"], ["p", "="], ["s", '"Iris"'], ["a", " base"], ["p", "="], ["s", '"Cedar"'], ["p", " />"]],
  [["p", "    </"], ["t", "main"], ["p", ">"]],
  [["p", "  );"]],
  [["p", "}"]],
];

/** The build log, one line at a time. */
const LOG: [string, string][] = [
  ["cmd", "$ npm run build"],
  ["ok", "✓ Compiled in 2.4 s"],
  ["ok", "✓ Types and lint passed"],
  ["ok", "✓ 12 pages generated"],
  ["ok", "✓ Images optimised · AVIF, WebP"],
  ["dim", "First load 92 kB · Ready to ship"],
];

const SCORES = ["Performance", "Accessibility", "Best practices", "SEO"];

const FILES: [string, number, boolean?][] = [
  ["app", 0],
  ["layout.tsx", 1],
  ["page.tsx", 1, true],
  ["components", 0],
  ["Nav.tsx", 1],
  ["ProductImage.tsx", 1],
  ["Notes.tsx", 1],
  ["shop", 0],
  ["AddToBag.tsx", 1],
  ["styles", 0],
  ["tokens.css", 1],
];

/** 03 — the code editor, its build log and a live preview that assembles as the code is written. */
export function DevApp() {
  return (
    <div className="app app-dev" data-app="dev">
      <div className="app-bar dark">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span className="app-title">aure-web</span>
        <span className="dev-crumb">app / page.tsx</span>
        <span className="app-meta">main · ● live preview</span>
      </div>
      <aside className="dev-files">
        <h6>Explorer</h6>
        <ul>
          {FILES.map(([name, depth, on]) => (
            <li key={name} className={`${depth ? "f" : "d"}${on ? " on" : ""}`}>
              {name}
            </li>
          ))}
        </ul>
      </aside>
      <section className="dev-editor">
        <div className="dev-tab">
          <b>page.tsx</b>
          <span>tokens.css</span>
        </div>
        <div className="dev-code">
          {CODE.map((line, i) => (
            <div key={i} className="cl" data-cl={i}>
              <span className="cn">{i + 1}</span>
              <span className="cx" data-cx={i}>
                {line.map(([k, v], j) => (
                  <span key={j} className={k ? `tk-${k}` : undefined}>
                    {v}
                  </span>
                ))}
              </span>
              <i className="caret dev-caret" data-dcaret={i} />
            </div>
          ))}
        </div>
        <div className="dev-term">
          <span className="dev-term-h">Terminal</span>
          {LOG.map(([k, v], i) => (
            <div key={i} className={`tl tl-${k}`} data-tl={i}>
              {v}
            </div>
          ))}
        </div>
      </section>
      <section className="dev-preview" data-preview>
        <div className="dev-preview-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="dev-url">localhost:3000</span>
        </div>
        <div className="dev-preview-view">
          <div className="dev-preview-scale">
            <Artboard final />
          </div>
        </div>
        <div className="dev-scores">
          {SCORES.map((s, i) => (
            <div key={s} className="score" data-score={i}>
              <svg viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="16" className="ring-bg" />
                <circle cx="20" cy="20" r="16" className="ring" pathLength={100} />
              </svg>
              <b data-scoren={i}>0</b>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const STEPS = ["Build", "Optimise images", "Edge network · 32 regions", "Domain · aure.com", "SSL certificate"];

/** 04 — the deployment, then the live site in a browser, then the first signs of life. */
export function LaunchApp() {
  return (
    <div className="app app-launch" data-app="launch">
      <div className="deploy" data-deploy>
        <div className="app-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="app-title">aure-web</span>
          <span className="dev-crumb">Deployments · Production</span>
          <span className="app-meta">v1.0.0</span>
        </div>
        <div className="deploy-body">
          <div className="deploy-main">
            <span className="deploy-kicker">Production deployment</span>
            <h2 className="deploy-title">
              <span data-dstate="0">Deploying aure.com</span>
              <span data-dstate="1">aure.com is live</span>
            </h2>
            <div className="deploy-bar">
              <i data-dbar />
            </div>
            <ol className="deploy-steps">
              {STEPS.map((s, i) => (
                <li key={s} data-dstep={i}>
                  <i className="tick" />
                  <span>{s}</span>
                  <em>{["38 s", "4 s", "2 s", "1 s", "1 s"][i]}</em>
                </li>
              ))}
            </ol>
          </div>
          <div className="deploy-thumb">
            <div className="deploy-thumb-scale">
              <Artboard final />
            </div>
          </div>
        </div>
      </div>
      <div className="browser" data-browser>
        <div className="br-tabs">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="br-tab">
            <i className="fav" />
            AURE — Fragrance
          </span>
        </div>
        <div className="br-bar">
          <span className="br-nav">
            <i />
            <i />
          </span>
          <span className="br-url">
            <svg viewBox="0 0 12 14" aria-hidden>
              <path d="M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2z" />
            </svg>
            <span data-type-url="aure.com" />
            <i className="caret" data-ucaret />
          </span>
          <i className="br-load" data-bload />
        </div>
        <div className="br-view">
          <div className="br-page" data-bpage>
            <Artboard final />
          </div>
        </div>
        <div className="live-pill" data-live>
          <i />
          Live · aure.com
        </div>
        <div className="toasts">
          {[
            ["New order", "Aure No. 04 · €180"],
            ["New subscriber", "The Journal"],
            ["New order", "Discovery set · €38"],
          ].map(([a, b], i) => (
            <div key={i} className="toast" data-toast={i} style={{ "--i": i } as CSSProperties}>
              <i />
              <b>{a}</b>
              <span>{b}</span>
            </div>
          ))}
        </div>
        <div className="visitors" data-visitors>
          <span>Visitors now</span>
          <b data-vcount>0</b>
        </div>
      </div>
    </div>
  );
}
