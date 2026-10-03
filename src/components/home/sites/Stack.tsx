/* eslint-disable @next/next/no-img-element */
/** STACK — a smash-burger restaurant. Charcoal, warm light, one mustard accent; order ahead, pick up hot. */
export function Stack() {
  return (
    <div className="site site-stack" style={{ "--scroll-max": "-1100px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="stack-brand">
          STACK<i>.</i>
        </span>
        <nav className="s-links">
          <span>Menu</span>
          <span>Locations</span>
          <span>Catering</span>
          <span>Gift cards</span>
        </nav>
        <span className="s-pill stack-pill">Order now</span>
      </header>
      <div className="site-page">
        <section className="stack-hero">
          <img className="stack-bg" src="/images/burger-hero.jpg" alt="" decoding="async" />
          <div className="stack-text">
            <span className="s-kicker">Smash burgers · Ljubljana</span>
            <h1>
              Smashed.
              <br />
              Stacked.
              <br />
              <em>Served hot.</em>
            </h1>
            <p>Dry-aged beef, brioche baked at dawn and sauces made in-house. Order ahead and skip the line.</p>
            <div className="stack-actions">
              <span className="stack-cta">Order online</span>
              <span className="s-link">See the menu →</span>
            </div>
          </div>
          <div className="stack-badges">
            <span>
              <b>15 min</b> pick-up
            </span>
            <span>
              <b>4.9 ★</b> 2,300 reviews
            </span>
            <span>
              <b>11 — 23</b> every day
            </span>
          </div>
        </section>
        <section className="stack-menu">
          <div className="stack-menu-head">
            <span className="s-kicker">Bestsellers</span>
            <h2>Order the classics.</h2>
          </div>
          <div className="stack-tiles">
            {[
              ["burger-hero", "The Double", "Two smashed patties, aged cheddar, pickles", "€12"],
              ["burger-fries", "Truffle fries", "Hand-cut, sea salt, truffle mayo", "€5"],
              ["burger-shake", "Salted caramel shake", "Vanilla, caramel, flaky salt", "€6"],
            ].map(([img, name, desc, price]) => (
              <figure key={img}>
                <div className="stack-tile">
                  <img src={`/images/${img}.jpg`} alt="" loading="lazy" decoding="async" />
                </div>
                <figcaption>
                  <b>{name}</b>
                  <em>{price}</em>
                  <span>{desc}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
        <footer className="site-footer stack-foot">
          <span>STACK · Trubarjeva 21 · Ljubljana</span>
          <span>Open daily · 11:00 — 23:00</span>
        </footer>
      </div>
    </div>
  );
}
