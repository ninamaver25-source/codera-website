import { TouchImg } from "../../film/TouchImg";

/** ALBA — an architecture and interiors studio. Stone, oak, slow light. */
export function Alba({ brand = "ALBA", email = "studio@alba.si" }: { brand?: string; email?: string }) {
  return (
    <div className="site site-alba" style={{ "--scroll-max": "-900px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="alba-brand">{brand}</span>
        <nav className="s-links">
          <span>Projects</span>
          <span>Studio</span>
          <span>Journal</span>
          <span>Contact</span>
        </nav>
        <span className="s-pill">Enquire</span>
      </header>
      <div className="site-page">
        <section className="alba-hero">
          <div className="alba-hero-img">
            <TouchImg name="alba-villa" />
          </div>
          <div className="alba-hero-text">
            <span className="s-kicker">Architecture · Interiors</span>
            <h1>
              Houses for
              <br />
              slow light.
            </h1>
            <p>Stone, oak and glass, arranged around the way a day moves through a room.</p>
            <span className="s-link">Selected projects →</span>
          </div>
        </section>
        <section className="alba-grid">
          {[
            ["alba-pool", "Villa K", "Istria, 2025"],
            ["alba-terrace", "House on the ridge", "Bled, 2024"],
          ].map(([img, t, s]) => (
            <figure key={img}>
              <div className="alba-tile">
                <TouchImg name={img} loading="lazy" />
              </div>
              <figcaption>
                <span>{t}</span>
                <span>{s}</span>
              </figcaption>
            </figure>
          ))}
        </section>
        <footer className="site-footer">
          <span>{brand} · Studio · Ljubljana</span>
          <span>{email}</span>
        </footer>
      </div>
    </div>
  );
}
