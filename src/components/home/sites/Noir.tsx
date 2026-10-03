/* eslint-disable @next/next/no-img-element */
/** NOIR — a beauty & hair salon. Black-and-white photography, didone type. */
export function Noir() {
  return (
    <div className="site site-noir" style={{ "--scroll-max": "-1100px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="noir-brand">NOIR</span>
        <nav className="s-links">
          <span>Hair</span>
          <span>Skin</span>
          <span>Studio</span>
          <span>Journal</span>
        </nav>
        <span className="s-pill s-pill-dark">Book</span>
      </header>
      <div className="site-page">
        <section className="noir-hero">
          <div className="noir-hero-img">
            <img src="/images/noir-portrait.jpg" alt="" loading="lazy" decoding="async" />
          </div>
          <div className="noir-hero-text">
            <h1>
              Hair.
              <br />
              Skin.
              <br />
              <em>Light.</em>
            </h1>
            <p>A quiet studio in the old town. Two chairs, one long mirror, natural light until six.</p>
            <span className="s-link">Book an appointment ↗</span>
          </div>
        </section>
        <section className="noir-services">
          {[
            ["noir-silver", "Cut & colour", "from €90"],
            ["noir-serene", "Skin rituals", "from €120"],
            ["noir-fur", "Editorial", "on request"],
          ].map(([img, t, p]) => (
            <figure key={img}>
              <div className="noir-tile">
                <img src={`/images/${img}.jpg`} alt="" loading="lazy" decoding="async" />
              </div>
              <figcaption>
                <span>{t}</span>
                <span>{p}</span>
              </figcaption>
            </figure>
          ))}
        </section>
        <footer className="site-footer site-footer-dark">
          <span>NOIR · Gornji trg 3 · Ljubljana</span>
          <span>Tue — Sat · 09:00 — 18:00</span>
        </footer>
      </div>
    </div>
  );
}
