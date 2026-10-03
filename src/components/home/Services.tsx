import Link from "next/link";
import { SERVICES } from "../../lib/services";
import { ServiceVisual } from "./ServiceVisual";

export function Services() {
  return (
    <section className="sec services" id="services" aria-labelledby="services-h">
      <header className="sec-head sec-head-split">
        <div>
          <span className="eyebrow">Services</span>
          <h2 id="services-h" className="sec-title">Choose what you need.</h2>
        </div>
        <p className="sec-aside">
          Strategy, design, development
          <br />
          and visual content — all in one place.
        </p>
      </header>
      <div className="svc-grid">
        {SERVICES.map((s) => (
          <Link className="svc" href={`/services/${s.slug}`} key={s.slug}>
            <span className="svc-visual" aria-hidden>
              <ServiceVisual kind={s.visual} />
            </span>
            <span className="svc-text">
              <span className="svc-title">
                {s.title.split(" ")[0]}
                <br />
                {s.title.split(" ").slice(1).join(" ")}
              </span>
              <span className="svc-line">{s.line}</span>
            </span>
            <span className="svc-arrow" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
