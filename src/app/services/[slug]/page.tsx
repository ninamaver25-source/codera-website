import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES, findService } from "../../../lib/services";
import { ServiceVisual } from "../../../components/home/ServiceVisual";
import { EMAIL, PHONE } from "../../../components/home/Contact";
import "../../../components/home/home.css";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = findService((await params).slug);
  return s ? { title: `${s.title} — codERA`, description: s.line } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const service = findService((await params).slug);
  if (!service) notFound();
  return (
    <main className="home subpage">
      <header className="sub-nav">
        <Link className="nav-brand" href="/">
          <span>cod</span>ERA
        </Link>
        <Link className="sub-back" href="/#services">
          ← All services
        </Link>
      </header>
      <article className="sub-wrap">
        <div className="sub-text">
          <span className="eyebrow">Service</span>
          <h1 className="sub-title">{service.title}</h1>
          <p className="sub-intro">{service.intro}</p>
          <h2 className="sub-h">What’s included</h2>
          <ul className="sub-list">
            {service.includes.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <div className="sub-actions">
            <Link className="btn-solid" href="/#estimator">
              Get an instant estimate <span aria-hidden>→</span>
            </Link>
            <a className="btn-line" href={`mailto:${EMAIL}`}>
              Write to us
            </a>
            <a className="btn-line" href={PHONE.href}>
              Call {PHONE.display}
            </a>
          </div>
        </div>
        <div className="sub-visual" aria-hidden>
          <ServiceVisual kind={service.visual} />
        </div>
      </article>
      <nav className="sub-others" aria-label="Other services">
        {SERVICES.filter((s) => s.slug !== service.slug).map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`}>
            {s.title} <span aria-hidden>→</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
