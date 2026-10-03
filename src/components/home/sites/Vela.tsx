/** VELA — an AI / technology company. Warm off-white, graphite, mono details. */
export function Vela() {
  return (
    <div className="site site-vela" style={{ "--scroll-max": "-1200px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="vela-brand">VELA</span>
        <nav className="s-links s-links-mono">
          <span>Platform</span>
          <span>Models</span>
          <span>Pricing</span>
          <span>Docs</span>
        </nav>
        <span className="s-pill s-pill-dark">Start building</span>
      </header>
      <div className="site-page">
        <section className="vela-hero">
          <div className="vela-hero-text">
            <span className="s-kicker">Inference platform · v4</span>
            <h1>
              Intelligence,
              <br />
              quietly.
            </h1>
            <p>Foundation models tuned to your data, served in twelve milliseconds from the region next to your users.</p>
            <div className="vela-actions">
              <span className="s-pill s-pill-dark">Start building</span>
              <span className="s-link">Read the docs →</span>
            </div>
          </div>
          <div className="vela-visual" aria-hidden>
            <div className="vela-blob a" />
            <div className="vela-blob b" />
            <div className="vela-blob c" />
            <svg className="vela-signal" viewBox="0 0 560 620" preserveAspectRatio="none">
              <path d="M0 420 C 80 380, 120 470, 200 430 S 320 330, 400 370 S 520 300, 560 320" fill="none" stroke="rgba(21,19,15,0.55)" strokeWidth="1.2" />
              <path d="M0 470 C 90 440, 150 520, 230 480 S 350 400, 430 430 S 520 380, 560 400" fill="none" stroke="rgba(21,19,15,0.22)" strokeWidth="1" />
            </svg>
            <div className="vela-chip">
              <span>p50 latency</span>
              <strong>12 ms</strong>
            </div>
          </div>
        </section>
        <section className="vela-rows">
          {[
            ["Models", "Foundation models fine-tuned on your own corpus, versioned and evaluated."],
            ["Agents", "Autonomous workflows with typed tools, budgets and human checkpoints."],
            ["Inference", "Forty-one regions, one endpoint. Cold starts measured in milliseconds."],
          ].map(([t, d], i) => (
            <div className="vela-row" key={t}>
              <span className="s-mono">0{i + 1}</span>
              <h2>{t}</h2>
              <p>{d}</p>
              <span className="s-link">Explore →</span>
            </div>
          ))}
        </section>
        <section className="vela-band">
          <span>99.99 % uptime</span>
          <span>SOC 2 · ISO 27001</span>
          <span>EU data residency</span>
        </section>
      </div>
    </div>
  );
}
