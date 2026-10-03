import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITES, type SiteName } from "../../../components/home/sites";
import "../../../components/home/sites/sites.css";

/**
 * Tooling route: renders one website mockup at 1440 × 900 so scripts/screens.mjs can raster it
 * for the floating screens of the hero. Not linked, not indexed.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return Object.keys(SITES).map((site) => ({ site }));
}

export default async function MockPage({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  const Site = SITES[site as SiteName];
  if (!Site) notFound();
  return (
    <div style={{ width: 1440, height: 900, overflow: "hidden", background: "#000" }}>
      <Site />
    </div>
  );
}
