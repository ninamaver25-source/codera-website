import { ARTBOARD } from "./layout";
import { Artboard } from "./Artboard";
import { DevApp, LaunchApp } from "./Build";

const NOTES: [string, string][] = [
  ["Who", "People who buy fewer, better things"],
  ["Goal", "More direct sales, less noise"],
  ["Feel", "Calm, precise, quietly luxurious"],
  ["Pages", "Home · Shop · Story · Journal"],
];

/** Everything the laptop display shows, at 1440 × 900: the brief, the design tool, the code, the launch. */
export function Screen() {
  return (
    <div className="scr" data-screen>
      <div className="scr-story" aria-hidden>
        <IdeaApp />
        <DesignApp />
        <DevApp />
        <LaunchApp />
      </div>
      <div className="scr-glass" />
    </div>
  );
}

function IdeaApp() {
  return (
    <div className="app app-idea" data-app="idea">
      <div className="app-bar">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span className="app-title">AURE — Website brief</span>
        <span className="app-meta">Draft · v0.1</span>
      </div>
      <section className="brief">
        <span className="brief-kicker">01 — Discovery</span>
        <h1 className="brief-title">
          <span data-type="A new website for AURE." />
          <i className="caret" data-caret="0" />
        </h1>
        <dl className="brief-notes">
          {NOTES.map(([k, v], i) => (
            <div key={k} data-note={i}>
              <dt>{k}</dt>
              <dd>
                <span data-type={v} />
                <i className="caret" data-caret={i + 1} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="board">
        <span className="board-label">Structure</span>
        <svg className="sitemap" viewBox="0 0 600 300" aria-hidden>
          <path data-draw="0" d="M300 64 V112 H96 V150" />
          <path data-draw="1" d="M300 112 H232 V150" />
          <path data-draw="2" d="M300 112 H368 V150" />
          <path data-draw="3" d="M300 112 H504 V150" />
          <path data-draw="4" d="M96 198 V236" />
          {[
            [300, 40, "Home", true],
            [96, 174, "Shop", false],
            [232, 174, "Story", false],
            [368, 174, "Journal", false],
            [504, 174, "Contact", false],
            [96, 260, "Product", false],
          ].map(([x, y, label, main], i) => (
            <g key={label as string} data-node={i} transform={`translate(${x} ${y})`}>
              <rect x={-58} y={-22} width={116} height={44} rx={12} className={main ? "main" : ""} />
              <text y={6} textAnchor="middle">
                {label as string}
              </text>
            </g>
          ))}
        </svg>
        <div className="sticky s1" data-pop="0">
          Hero = the product
        </div>
        <div className="sticky s2" data-pop="1">
          One clear action
        </div>
        <div className="sticky s3" data-pop="2">
          Less, but better
        </div>
        <div className="wire-thumb" data-pop="3">
          <svg viewBox="0 0 240 150" aria-hidden>
            <rect data-draw="5" x="6" y="6" width="228" height="138" rx="6" />
            <rect data-draw="6" x="18" y="18" width="204" height="10" rx="3" />
            <rect data-draw="7" x="18" y="44" width="92" height="40" rx="3" />
            <rect data-draw="8" x="128" y="44" width="94" height="88" rx="3" />
            <rect data-draw="9" x="18" y="96" width="56" height="16" rx="8" />
          </svg>
          <span>Home — first sketch</span>
        </div>
      </section>
    </div>
  );
}

function DesignApp() {
  const ab = { left: ARTBOARD.x, top: ARTBOARD.y, width: ARTBOARD.w, height: ARTBOARD.h };
  return (
    <div className="app app-design" data-app="design">
      <div className="tool-bar">
        <span className="tb-logo" />
        <span className="tb-file">
          AURE <em>/</em> Website — Home
        </span>
        <span className="tb-tools">
          {["M5 4l12 6-5 1.5L10 17z", "M4 4h12v12H4z", "M5 5h10M10 5v10", "M4 15c4-8 8-8 12 0", "M10 3v14M3 10h14"].map((d, i) => (
            <svg key={i} viewBox="0 0 20 20" className={i === 0 ? "on" : ""} aria-hidden>
              <path d={d} />
            </svg>
          ))}
        </span>
        <span className="tb-right">
          <i className="av av1">N</i>
          <i className="av av2">K</i>
          <b className="tb-share">Share</b>
          <span className="tb-zoom">100%</span>
        </span>
      </div>
      <aside className="pane pane-left">
        <h6>Pages</h6>
        <ul>
          <li className="on">Home</li>
          <li>Shop</li>
          <li>Product</li>
          <li>Story</li>
        </ul>
        <h6>Layers</h6>
        <ul className="layers">
          <li>Home — Desktop</li>
          <li data-layer="nav" className="in">
            Navigation
          </li>
          <li data-layer="hero" className="in">
            Hero
          </li>
          <li data-layer="h1" className="in2">
            Headline
          </li>
          <li data-layer="img" className="in2">
            Image
          </li>
          <li data-layer="cta" className="in2">
            Button
          </li>
          <li data-layer="notes" className="in">
            Notes
          </li>
        </ul>
      </aside>
      <main className="canvas">
        <span className="ab-label" style={{ left: ARTBOARD.x - 240, top: ARTBOARD.y - 52 - 30 }}>
          Home — Desktop · 1440
        </span>
      </main>
      <div className="ab-frame" style={ab}>
        <div className="ab-scale" style={{ transform: `scale(${ARTBOARD.w / 1440})` }}>
          <Artboard />
        </div>
      </div>
      <div className="sel" data-sel>
        <i />
        <i />
        <i />
        <i />
      </div>
      <svg className="cursor" data-cursor viewBox="0 0 24 24" aria-hidden>
        <path d="M5 3l14 8-6 1.6L10 19z" />
      </svg>
      <aside className="pane pane-right">
        <div className="tabs">
          <b>Design</b>
          <span>Prototype</span>
          <span>Inspect</span>
        </div>
        <section data-prop="layout">
          <h6>Layout</h6>
          <div className="row">
            <span>Columns</span>
            <b>12</b>
          </div>
          <div className="row">
            <span>Gutter</span>
            <b>24</b>
          </div>
          <div className="row">
            <span>Margin</span>
            <b>100</b>
          </div>
        </section>
        <section data-prop="type">
          <h6>Typography</h6>
          <div className="type-specimen">Aa</div>
          <div className="row">
            <span>Display</span>
            <b>150 / 0.9</b>
          </div>
          <div className="row">
            <span>Body</span>
            <b>19 / 1.5</b>
          </div>
        </section>
        <section data-prop="img">
          <h6>Image</h6>
          <div className="row">
            <span>Fill</span>
            <b>aure-04.jpg</b>
          </div>
          <div className="row">
            <span>Ratio</span>
            <b>1 : 1</b>
          </div>
        </section>
        <section data-prop="po">
          <h6>Fill</h6>
          <div className="swatches">
            <i style={{ background: "#F2EFE9" }} />
            <i style={{ background: "#111111" }} />
            <i style={{ background: "#701F2B" }} />
            <i style={{ background: "#EBE9E4" }} />
          </div>
        </section>
      </aside>
    </div>
  );
}
