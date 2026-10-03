/* eslint-disable @next/next/no-img-element */
/** THE MOVEMENT CLUB — a fashion label. Black, bold, editorial. */
export function Movement() {
  return (
    <div className="site site-move" style={{ "--scroll-max": "-1000px" } as React.CSSProperties}>
      <header className="site-nav">
        <span className="move-brand">The Movement Club</span>
        <nav className="s-links">
          <span>Collection</span>
          <span>Editorial</span>
          <span>Stores</span>
        </nav>
        <span className="s-pill">Shop</span>
      </header>
      <div className="site-page">
        <section className="move-hero">
          <img className="move-bg" src="/images/noir-fur.jpg" alt="" decoding="async" />
          <div className="move-text">
            <span className="s-kicker">AW 26 — The night drop</span>
            <h1>
              Move with
              <br />
              intent.
            </h1>
            <span className="s-pill">Shop the collection</span>
          </div>
        </section>
        <section className="move-row">
          {[
            ["noir-silver", "Silver line"],
            ["noir-serene", "Serene"],
            ["noir-portrait", "Studio 02"],
          ].map(([img, t]) => (
            <figure key={img}>
              <div className="move-tile">
                <img src={`/images/${img}.jpg`} alt="" loading="lazy" decoding="async" />
              </div>
              <figcaption>{t}</figcaption>
            </figure>
          ))}
        </section>
      </div>
    </div>
  );
}
