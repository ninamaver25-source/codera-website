/* eslint-disable @next/next/no-img-element */
import { MiniLaptop, MiniPhone } from "./Laptop";
import type { ServiceVisual as Kind } from "../../lib/services";

/** The premium visual of a service: a laptop with a finished site, a care dashboard, a product frame. */
export function ServiceVisual({ kind }: { kind: Kind }) {
  if (kind === "site")
    return (
      <MiniLaptop>
        <img src="/images/screens/lumiere.jpg" alt="" loading="lazy" decoding="async" />
      </MiniLaptop>
    );
  if (kind === "care")
    return (
      <MiniPhone>
        <div className="care">
          <div className="care-head">
            <span>Status</span>
            <b>All systems running</b>
          </div>
          <div className="care-bars" aria-hidden>
            {[42, 55, 48, 70, 62, 84, 76, 92].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="care-rows">
            <div>
              <span>Uptime</span>
              <b>99.98 %</b>
            </div>
            <div>
              <span>Updates</span>
              <b>12 / mo</b>
            </div>
            <div>
              <span>Security</span>
              <b>OK</b>
            </div>
          </div>
        </div>
      </MiniPhone>
    );
  return (
    <div className="vp-frame">
      <img src="/images/aure-hero.jpg" alt="" loading="lazy" decoding="async" />
      <span className="vp-rec">
        <i />
        REC 00:12
      </span>
    </div>
  );
}
