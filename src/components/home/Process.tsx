/* eslint-disable @next/next/no-img-element */
import { Laptop } from "./Laptop";
import { Lumiere } from "./sites/Lumiere";

export const STEPS = [
  { n: "01", title: "Your idea.", text: "You bring the vision — we help shape it into a clear, strategic plan." },
  { n: "02", title: "Design.", text: "We create a unique, modern design that captures your brand and converts visitors into clients." },
  { n: "03", title: "Development.", text: "We build a fast, secure and scalable website, tailored to your business needs." },
  { n: "04", title: "Launch.", text: "Your website goes live — ready to grow your business." },
] as const;

/** The flat text layer: one block per step beside the laptop, plus the closing line at the end. */
export function Steps() {
  return (
    <div className="steps" id="process">
      {STEPS.map((s, i) => (
        <div className="step" data-step={i} key={s.n}>
          <span className="step-n">
            {s.n}
            <i aria-hidden />
          </span>
          <h2>{s.title}</h2>
          <p>{s.text}</p>
        </div>
      ))}
      <div className="closed closed-left" data-closed>
        <h2>
          From idea
          <br />
          to impact.
        </h2>
      </div>
      <div className="closed closed-right" data-closed>
        <p>
          The same process
          <br />
          for every ambitious brand.
        </p>
      </div>
    </div>
  );
}

/**
 * The office: a warm wall with a tall window and late sun behind, a wooden desk in front, one
 * laptop on it. The far layer is the hero's backdrop too; the camera moves into it on scroll.
 */
export function OfficeScene() {
  return (
    <div className="office" data-office>
      <div className="office-far" aria-hidden>
        <div className="wall" />
        <div className="window-glow" />
        <div className="window">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="shaft shaft-a" />
        <div className="shaft shaft-b" />
        <div className="shape shape-l" />
        <div className="shape shape-r" />
        <div className="hero-dim" data-hero-dim />
      </div>
      <div className="office-near" data-near aria-hidden>
        <div className="desk">
          <div className="desk-light" />
        </div>
      </div>
      <div className="laptop-wrap" data-laptop>
        <div className="laptop-glow" data-laptop-glow />
        <Laptop className="laptop-main">
          <ScreenIdea />
          <ScreenDesign />
          <ScreenDev />
          <ScreenLaunch />
        </Laptop>
        <div className="laptop-shadow" />
      </div>
    </div>
  );
}

function ScreenIdea() {
  return (
    <div className="scr scr-idea" data-scr="0">
      <div className="doc-bar">
        <i />
        <i />
        <i />
        <span>Untitled — Brief</span>
      </div>
      <div className="doc-body">
        <p>
          A website for my
          <span className="caret" />
        </p>
      </div>
    </div>
  );
}

const SWATCHES = ["#0f0c0a", "#2a1d14", "#c9a27a", "#d8b48a", "#efe6d8"];

function ScreenDesign() {
  return (
    <div className="scr scr-design" data-scr="1">
      <div className="dt-bar">
        <span>Lumière — Home</span>
        <span className="dt-tabs">
          <b>Design</b>
          <i>Prototype</i>
          <i>Inspect</i>
        </span>
        <span>100 %</span>
      </div>
      <aside className="dt-left">
        <span className="dt-h">Layers</span>
        <ul>
          <li className="on">Hero</li>
          <li>Navigation</li>
          <li>Intro</li>
          <li>Menu</li>
          <li>Reservations</li>
          <li>Footer</li>
        </ul>
        <span className="dt-h">Assets</span>
        <div className="dt-thumbs">
          <img src="/images/sm/luma-table.jpg" alt="" loading="lazy" decoding="async" />
          <img src="/images/sm/luma-room.jpg" alt="" loading="lazy" decoding="async" />
          <img src="/images/sm/luma-terrace.jpg" alt="" loading="lazy" decoding="async" />
        </div>
      </aside>
      <div className="dt-canvas">
        <div className="dt-frame">
          <img src="/images/screens/lumiere.jpg" alt="" loading="lazy" decoding="async" />
          <i className="dt-sel" />
        </div>
      </div>
      <aside className="dt-right">
        <span className="dt-h">Colour</span>
        <div className="dt-swatches">
          {SWATCHES.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </div>
        <span className="dt-h">Type</span>
        <div className="dt-type">
          <b>Playfair Display</b>
          <span>Display · 92 / 1.02</span>
          <b>Manrope</b>
          <span>Body · 19 / 1.5</span>
        </div>
        <span className="dt-h">Spacing</span>
        <div className="dt-rows">
          <span>Section</span>
          <b>120</b>
          <span>Gutter</span>
          <b>100</b>
          <span>Radius</span>
          <b>999</b>
        </div>
      </aside>
    </div>
  );
}

function ScreenDev() {
  return (
    <div className="scr scr-dev" data-scr="2">
      <div className="dev-code">
        <div className="dev-tabs">
          <b>Hero.tsx</b>
          <span>hero.css</span>
          <span>reservations.ts</span>
        </div>
        <pre>
          <span className="ln">1</span><span className="k">export function</span> <span className="t">Hero</span>() {"{"}{"\n"}
          <span className="ln">2</span>  <span className="k">return</span> ({"\n"}
          <span className="ln">3</span>    &lt;<span className="t">section</span> <span className="a">className</span>=<span className="s">&quot;hero&quot;</span>&gt;{"\n"}
          <span className="ln">4</span>      &lt;<span className="t">img</span> <span className="a">src</span>=<span className="s">&quot;/dining-room.jpg&quot;</span> <span className="a">alt</span>=<span className="s">&quot;&quot;</span> /&gt;{"\n"}
          <span className="ln">5</span>      &lt;<span className="t">div</span> <span className="a">className</span>=<span className="s">&quot;hero-text&quot;</span>&gt;{"\n"}
          <span className="ln">6</span>        &lt;<span className="t">span</span> <span className="a">className</span>=<span className="s">&quot;kicker&quot;</span>&gt;Fine dining · Ljubljana&lt;/<span className="t">span</span>&gt;{"\n"}
          <span className="ln">7</span>        &lt;<span className="t">h1</span>&gt;{"\n"}
          <span className="ln">8</span>          A dining experience{"\n"}
          <span className="ln">9</span>          &lt;<span className="t">em</span>&gt;beyond taste.&lt;/<span className="t">em</span>&gt;{"\n"}
          <span className="ln">10</span>        &lt;/<span className="t">h1</span>&gt;{"\n"}
          <span className="ln">11</span>        &lt;<span className="t">a</span> <span className="a">className</span>=<span className="s">&quot;pill&quot;</span> <span className="a">href</span>=<span className="s">&quot;/reservations&quot;</span>&gt;{"\n"}
          <span className="ln">12</span>          Book a table{"\n"}
          <span className="ln">13</span>        &lt;/<span className="t">a</span>&gt;{"\n"}
          <span className="ln">14</span>      &lt;/<span className="t">div</span>&gt;{"\n"}
          <span className="ln">15</span>    &lt;/<span className="t">section</span>&gt;{"\n"}
          <span className="ln">16</span>  );{"\n"}
          <span className="ln">17</span>{"}"}{"\n"}
        </pre>
      </div>
      <div className="dev-preview">
        <div className="dev-url">
          <i />
          <span>localhost:3000</span>
        </div>
        <img src="/images/screens/lumiere.jpg" alt="" loading="lazy" decoding="async" />
      </div>
    </div>
  );
}

function ScreenLaunch() {
  return (
    <div className="scr scr-launch" data-scr="3" data-launch>
      <Lumiere />
    </div>
  );
}
