/* eslint-disable @next/next/no-img-element */
/**
 * AURE — a premium fragrance e-commerce site. Its hero image is the same render as the
 * live bottle, so the camera can travel into it. The image box is AURE_IMAGE in the storyboard.
 */
export function Aure() {
  return (
    <div className="site site-aure" style={{ "--scroll-max": "-1300px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="aure-brand">AURE</span>
        <nav className="s-links">
          <span>Fragrance</span>
          <span>Body</span>
          <span>Journal</span>
          <span>Bag (0)</span>
        </nav>
        <span className="s-pill">Shop</span>
      </header>
      <div className="site-page">
        <section className="aure-hero">
          <div className="aure-hero-text">
            <span className="s-kicker">N° 04 — Eau de parfum</span>
            <h1>
              Aure
              <br />
              <em>No. 04</em>
            </h1>
            <p>Fig leaf, iris and cedar. A scent for the last warm evening of the year.</p>
            <div className="aure-price">€180 · 50 ml</div>
            <span className="s-pill s-pill-dark">Add to bag</span>
          </div>
          <div className="aure-hero-img">
            <img src="/images/aure-hero.jpg" alt="" loading="lazy" decoding="async" />
          </div>
        </section>
        <section className="aure-notes">
          <div className="aure-note">
            <span className="s-kicker">Top</span>
            <p>Bergamot, fig leaf</p>
          </div>
          <div className="aure-note">
            <span className="s-kicker">Heart</span>
            <p>Iris, white tea</p>
          </div>
          <div className="aure-note">
            <span className="s-kicker">Base</span>
            <p>Cedar, ambrette</p>
          </div>
          <blockquote>“Made in small batches in Grasse. Bottled by hand, numbered, never rushed.”</blockquote>
        </section>
        <section className="aure-collection">
          <span className="s-kicker">The collection</span>
          <div className="aure-tiles">
            {[
              ["No. 01", "Neroli, salt", "€160", "#e8dfd0"],
              ["No. 02", "Vetiver, smoke", "€170", "#d9d1c4"],
              ["No. 04", "Fig leaf, iris", "€180", "#efe6d6"],
            ].map(([n, d, p, bg]) => (
              <div className="aure-tile" key={n} style={{ background: bg }}>
                <span className="aure-tile-name">{n}</span>
                <span className="aure-tile-desc">{d}</span>
                <span className="aure-tile-price">{p}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
