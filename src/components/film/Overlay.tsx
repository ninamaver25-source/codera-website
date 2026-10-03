import type { CSSProperties } from "react";
import { Split } from "./Split";
import { useT } from "./i18n";

/**
 * How much a headline has to shrink on larger screens so its longest line still fits (languages
 * differ in length): light lines are about 0.66 em a letter, bold lines 0.78 em.
 */
const fit = (lines: string[], room: number, boldFrom = 1): CSSProperties => {
  const em = Math.max(...lines.map((l, i) => l.length * (i >= boldFrom ? 0.78 : 0.66)));
  return { "--k": Math.min(1, room / em).toFixed(3) } as CSSProperties;
};
/** Step titles stand in a narrow column: shrink when a line is longer than the column holds. */
const fitStep = (lines: string[], chars: number): CSSProperties => {
  const longest = Math.max(...lines.map((l) => l.length));
  const word = Math.max(...lines.flatMap((l) => l.split(" ").map((w) => w.length)));
  return { "--k": Math.min(1, chars / longest).toFixed(3), "--kw": Math.min(1, (chars + 3) / word).toFixed(3) } as CSSProperties;
};

/** Typography of the film. Every unit is revealed and dissolved by scroll, never by a timer. */
export function Overlay() {
  const t = useT();
  return (
    <div className="ov">
      <div className="hero" data-rv="hero">
        <h1 className="hero-title" style={fit(t.hero.title, 15.4)}>
          <Split text={t.hero.title[0]} />
          <br />
          <Split text={t.hero.title[1]} className="hero-b" />
        </h1>
        <p className="hero-sub">
          <Split words text={t.hero.sub.replace(/ · /g, " ·\u0001").replace(/ /g, " ").replace(/\u0001/g, " ")} />
        </p>
        <a className="hero-cta" href="#project" data-to="project" data-hero-cta>
          {t.hero.cta} <i aria-hidden>→</i>
        </a>
      </div>
      <a className="cue" href="#process" data-cue data-to="process">
        {t.hero.cue} <i aria-hidden>↓</i>
      </a>

      <Step id="process" rv="s1" n="01" step={t.steps[0]} className="step-proc" chars={8} />
      <Step rv="s2" n="02" step={t.steps[1]} className="step-proc" chars={8} />
      <Step rv="s3" n="03" step={t.steps[2]} className="step-proc" chars={8} />
      <Step rv="s4" n="04" step={t.steps[3]} className="step-proc" chars={8} />

      <div className="more-wrap">
        <div className="more" data-rv="more">
          <h2 className="more-title" style={fit(t.more.title, 14.8)}>
            <Split text={t.more.title[0]} />
            <br />
            <Split text={t.more.title[1]} className="more-b" />
          </h2>
        </div>
        <p className="more-sub" data-rv="moreSub">
          <Split words text={t.more.sub} />
        </p>
      </div>

      {/* the last chapter: website care is over, the room again */}
      <div className="more-wrap">
        <div className="more" data-rv="build">
          <h2 className="more-title" style={fit(t.build.title, 14.8)}>
            <Split text={t.build.title[0]} />
            <br />
            <Split text={t.build.title[1]} className="more-b" />
          </h2>
        </div>
        <p className="more-sub" data-rv="buildSub">
          <Split words text={t.build.sub} />
        </p>
      </div>

      <Step id="services" rv="sv1" n="01" step={t.services[0]} className="step-svc" chars={12} />
      <Step rv="sv2" n="02" step={t.services[1]} className="step-svc" chars={12} />
      <Step rv="sv3" n="03" step={t.services[2]} className="step-svc step-care" chars={16} />
    </div>
  );
}

function Step({ id, rv, n, step, className, chars }: { id?: string; rv: string; n: string; step: { title: string[]; sub: string[] }; className?: string; chars: number }) {
  return (
    <div className={`step${className ? ` ${className}` : ""}`} data-rv={rv} id={id}>
      <div className="step-head">
        <span className="step-n">
          <Split text={n} />
        </span>
        <h2 className="step-title" style={fitStep(step.title, chars)}>
          {step.title.map((line) => (
            <span key={line} className="ln">
              <Split text={line} />
            </span>
          ))}
        </h2>
      </div>
      <p className="step-sub">
        {step.sub.map((line) => (
          <span key={line} className="ln">
            <Split words text={line} />
          </span>
        ))}
      </p>
    </div>
  );
}
