/* eslint-disable @next/next/no-img-element */
/** LUMIÈRE — the restaurant website that is built through the process and shown on the central screen. */
export function Lumiere({ brand = "LUMIÈRE" }: { brand?: string }) {
  return (
    <div className="site site-lumiere" style={{ "--scroll-max": "-1000px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="lum-brand">{brand}</span>
        <nav className="s-links">
          <span>Home</span>
          <span>About</span>
          <span>Menu</span>
          <span>Reservations</span>
        </nav>
        <span className="s-pill">Book a table</span>
      </header>
      <div className="site-page">
        <section className="lum-hero">
          <img className="lum-hero-bg" src="/images/luma-hero.jpg" alt="" decoding="async" />
          <div className="lum-hero-text">
            <span className="s-kicker">Fine dining · Ljubljana</span>
            <h1>
              A dining experience
              <br />
              <em>beyond taste.</em>
            </h1>
            <p>Twelve courses over oak embers. One long evening at a table by the window.</p>
            <span className="s-pill">Book a table</span>
          </div>
        </section>
        <section className="lum-menu">
          <div className="lum-menu-list">
            <span className="s-kicker">The kitchen — October</span>
            <ul>
              {[
                ["Burnt leek, hazelnut, brown butter", "18"],
                ["Aged trout, horseradish, dill oil", "26"],
                ["Ember-roasted duck, quince, black garlic", "44"],
                ["Fig leaf ice, honeycomb", "16"],
              ].map(([d, p]) => (
                <li key={d}>
                  <span>{d}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lum-wide">
            <img src="/images/luma-table.jpg" alt="" loading="lazy" decoding="async" />
          </div>
        </section>
        <footer className="site-footer site-footer-dark">
          <span>{brand} · Trubarjeva 5 · Ljubljana</span>
          <span>Tue — Sat · 18:00 — 23:00</span>
        </footer>
      </div>
    </div>
  );
}
