/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

/** Wireframe offsets of a block: where it sits before the layout is resolved. */
const off = (dx: number, dy: number, ds = 0): CSSProperties => ({ "--dx": `${dx}px`, "--dy": `${dy}px`, "--ds": ds } as CSSProperties);

/** The finished site: every stage complete (used by the development preview and the launch). */
const FINAL = { "--l": 1, "--ty": 1, "--im": 1, "--po": 1 } as CSSProperties;

/**
 * The client website being designed (AURE, a fragrance shop), at 1440 × 900. Four CSS variables
 * carry it from wireframe to finished interface: --l layout, --ty typography, --im images,
 * --po polish (each 0 … 1); --in parts the layers as the camera passes into the screen.
 */
export function Artboard({ final = false }: { final?: boolean }) {
  return (
    <div className="ab" data-ab={final ? undefined : ""} style={final ? FINAL : undefined}>
      <div className="ab-paper" />
      <div className="ab-cols" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </div>

      <header className="ab-nav blk" style={off(0, -6)}>
        <span className="wire" />
        <span className="txt wm">AURE</span>
        <span className="bar" style={{ left: 72, top: 36, width: 96, height: 16 }} />
        <nav className="txt ab-links">
          <span>Fragrance</span>
          <span>Body</span>
          <span>Story</span>
          <span>Journal</span>
        </nav>
        <span className="bar" style={{ left: 560, top: 38, width: 320, height: 12 }} />
        <span className="txt ab-bag">Bag (0)</span>
        <span className="bar" style={{ right: 72, top: 38, width: 70, height: 12 }} />
      </header>

      <div className="ab-front">
        <div className="ab-kicker blk" style={off(26, 40)}>
          <span className="bar" style={{ left: 0, top: 2, width: 230, height: 12 }} />
          <span className="txt">N° 04 — Eau de parfum</span>
        </div>
        <div className="ab-h1 blk" style={off(34, 52, 0.06)}>
          <span className="wire" />
          <span className="bar" style={{ left: 0, top: 18, width: 380, height: 92 }} />
          <span className="bar" style={{ left: 0, top: 148, width: 520, height: 92 }} />
          <h3 className="txt">
            Aure
            <br />
            No. 04
          </h3>
        </div>
        <div className="ab-p blk" style={off(30, 70)}>
          <span className="bar" style={{ left: 0, top: 4, width: 420, height: 11 }} />
          <span className="bar" style={{ left: 0, top: 32, width: 380, height: 11 }} />
          <span className="bar" style={{ left: 0, top: 60, width: 250, height: 11 }} />
          <p className="txt">Fig leaf, iris and cedar. A scent for the last warm evening of the year.</p>
        </div>
        <div className="ab-price blk" style={off(30, 78)}>
          <span className="bar" style={{ left: 0, top: 2, width: 150, height: 11 }} />
          <span className="txt">€180 · 50 ml</span>
        </div>
        <div className="ab-ctas blk" style={off(40, 84)}>
          <span className="ab-btn">
            <i className="ab-btn-fill" />
            <b className="lbl lbl-dark">Add to bag</b>
            <b className="lbl lbl-light">Add to bag</b>
          </span>
          <span className="txt ab-more">Discover the notes →</span>
          <span className="bar" style={{ left: 240, top: 22, width: 170, height: 11 }} />
        </div>
      </div>

      <figure className="ab-img blk" style={off(70, 60, 0.16)}>
        <span className="wire" />
        <svg className="ab-x" viewBox="0 0 600 600" preserveAspectRatio="none" aria-hidden>
          <line x1="0" y1="0" x2="600" y2="600" />
          <line x1="600" y1="0" x2="0" y2="600" />
        </svg>
        <img src="/images/aure-hero.jpg" alt="" decoding="async" />
      </figure>

      <div className="ab-notes blk" style={off(60, 40)}>
        {[
          ["Top", "Bergamot, fig leaf"],
          ["Heart", "Iris, white tea"],
          ["Base", "Cedar, ambrette"],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="bar" style={{ left: 0, top: 4, width: 60, height: 9 }} />
            <span className="bar" style={{ left: 0, top: 30, width: 150, height: 11 }} />
            <span className="txt k">{k}</span>
            <span className="txt v">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
