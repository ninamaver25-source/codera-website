/* eslint-disable @next/next/no-img-element */
/** PINNACLE — alpine retreats. A travel site above a lake. */
export function Pinnacle() {
  return (
    <div className="site site-pin" style={{ "--scroll-max": "-1000px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="pin-brand">PINNACLE</span>
        <nav className="s-links">
          <span>Stays</span>
          <span>Journeys</span>
          <span>Journal</span>
        </nav>
        <span className="s-pill">Book</span>
      </header>
      <div className="site-page">
        <section className="pin-hero">
          <img className="pin-bg" src="/images/alba-lake.jpg" alt="" decoding="async" />
          <div className="pin-text">
            <span className="s-kicker">Alpine retreats · Switzerland</span>
            <h1>
              Above the lake,
              <br />
              below the sky.
            </h1>
            <p>Eleven houses between the water and the ridge. Breakfast comes up the hill.</p>
            <span className="s-pill">Explore stays</span>
          </div>
        </section>
        <section className="pin-cards">
          {[
            ["alba-pool", "The Lake House", "from €420 / night"],
            ["alba-terrace", "Ridge Cabin", "from €310 / night"],
          ].map(([img, t, p]) => (
            <figure key={img}>
              <div className="pin-tile">
                <img src={`/images/${img}.jpg`} alt="" loading="lazy" decoding="async" />
              </div>
              <figcaption>
                <span>{t}</span>
                <span>{p}</span>
              </figcaption>
            </figure>
          ))}
        </section>
      </div>
    </div>
  );
}
