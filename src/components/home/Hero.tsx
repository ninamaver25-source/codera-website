import Link from "next/link";

/** The first screen: almost empty, a warm wall, one line. */
export function HeroCopy() {
  return (
    <div className="hero-copy" data-hero-copy>
      <h1 className="hero-h1">
        <span>We build</span>
        <span>digital experiences.</span>
      </h1>
      <p className="hero-sub">Websites &amp; visual production.</p>
    </div>
  );
}

export function HeroCue() {
  return (
    <Link className="hero-cue" href="/#process" data-to="process" data-hero-cue>
      <i className="hero-cue-line" aria-hidden />
      <span>Scroll to explore</span>
      <i className="hero-cue-ring" aria-hidden>
        ⌄
      </i>
    </Link>
  );
}
