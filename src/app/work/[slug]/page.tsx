import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, findProject } from "../../../components/film/projects";
import { ProjectSite } from "../../../components/film/ProjectSite";
import { SiteViewer } from "../../../components/film/SiteViewer";
import "../../../components/home/sites/sites.css";
import "../../../components/film/case.css";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = findProject(slug);
  return p ? { title: `${p.name} — ${p.kind} · codERA`, description: p.line } : {};
}

/** One project: the website itself, full width, with the way back into the film. */
export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = findProject(slug);
  if (!p) notFound();
  const i = PROJECTS.findIndex((x) => x.slug === p.slug);
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  return (
    <main className="case">
      <header className="case-nav">
        <Link href="/#work" className="case-back">
          ← cod<b>ERA</b>
        </Link>
        <span className="case-idx">
          0{i + 1} / 0{PROJECTS.length}
        </span>
      </header>
      <section className="case-head">
        <span className="case-kind">{p.kind}</span>
        <h1 className="case-title">{p.name}</h1>
        <p className="case-line">{p.line}</p>
      </section>
      <SiteViewer url={`${p.slug}.com`}>
        <ProjectSite slug={p.slug} />
      </SiteViewer>
      <nav className="case-foot" aria-label="Projects">
        <Link href={`/work/${next.slug}`} className="case-next">
          <span>Next project</span>
          <b>{next.name}</b>
        </Link>
        <Link href="/#project" className="case-cta">
          Start a project <i aria-hidden>→</i>
        </Link>
      </nav>
    </main>
  );
}
