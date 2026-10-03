import { siteOf, type BriefCare, type BriefFeature, type BriefVisual, type Picks, type SiteType } from "./brief";
import type { Range } from "./catalog";

/** The site's languages: English first, then the others in the order of the menu. */
export const LANGS = [
  { id: "en", code: "EN", name: "English", locale: "en-US", english: "English" },
  { id: "sl", code: "SL", name: "Slovenščina", locale: "sl-SI", english: "Slovenian" },
  { id: "fr", code: "FR", name: "Français", locale: "fr-FR", english: "French" },
  { id: "es", code: "ES", name: "Español", locale: "es-ES", english: "Spanish" },
  { id: "de", code: "DE", name: "Deutsch", locale: "de-DE", english: "German" },
  { id: "hr", code: "HR", name: "Hrvatski", locale: "hr-HR", english: "Croatian" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];
export const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.id === v);
export const langInfo = (l: Lang) => LANGS.find((x) => x.id === l)!;

/** A price range in the language's own way of writing money. */
export function formatRangeIn(r: Range, lang: Lang) {
  if (lang === "en") return `€${r[0].toLocaleString("en-US")} – €${r[1].toLocaleString("en-US")}`;
  const f = new Intl.NumberFormat(langInfo(lang).locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  return `${f.format(r[0])} – ${f.format(r[1])}`;
}

type Terms = { type: Record<SiteType, string>; feature: Record<BriefFeature, string>; visual: Record<BriefVisual, string>; care: Record<Exclude<BriefCare, "none">, string> };

/** What the AI says back, outside English: the project as a short list (no grammar to get wrong). */
const TERMS: Record<Exclude<Lang, "en">, Terms> = {
  sl: {
    type: { landing: "pristajalna stran", business: "poslovna spletna stran", ecommerce: "spletna trgovina", portfolio: "portfelj", booking: "spletna stran z rezervacijami", custom: "spletna stran po meri" },
    feature: { booking: "spletne rezervacije", contact: "kontaktni obrazec", multilingual: "dodaten jezik", ecommerce: "spletna trgovina", cms: "CMS", blog: "blog", animations: "animacije", advanced: "napredne animacije", ai: "AI integracija", custom: "razvoj po meri" },
    visual: { branding: "logotip in celostna podoba", social: "vsebine za družbena omrežja", product: "fotografije izdelkov", website: "fotografije za spletno stran", ai: "AI vizualne vsebine", video: "video in animacija" },
    care: { basic: "osnovno vzdrževanje", full: "celovito vzdrževanje" },
  },
  fr: {
    type: { landing: "landing page", business: "site vitrine", ecommerce: "boutique en ligne", portfolio: "portfolio", booking: "site de réservation", custom: "site sur mesure" },
    feature: { booking: "réservation en ligne", contact: "formulaire de contact", multilingual: "deuxième langue", ecommerce: "boutique en ligne", cms: "CMS", blog: "blog", animations: "animations", advanced: "animations avancées", ai: "intégration IA", custom: "développement sur mesure" },
    visual: { branding: "logo et identité", social: "visuels pour les réseaux sociaux", product: "photos de produits", website: "visuels pour le site", ai: "visuels IA", video: "vidéo et motion" },
    care: { basic: "maintenance de base", full: "maintenance complète" },
  },
  es: {
    type: { landing: "landing page", business: "web corporativa", ecommerce: "tienda online", portfolio: "portafolio", booking: "web de reservas", custom: "web a medida" },
    feature: { booking: "reservas online", contact: "formulario de contacto", multilingual: "segundo idioma", ecommerce: "tienda online", cms: "CMS", blog: "blog", animations: "animaciones", advanced: "animaciones avanzadas", ai: "integración de IA", custom: "desarrollo a medida" },
    visual: { branding: "logo e identidad", social: "visuales para redes sociales", product: "fotos de producto", website: "imágenes para la web", ai: "visuales con IA", video: "vídeo y motion" },
    care: { basic: "mantenimiento básico", full: "mantenimiento completo" },
  },
  de: {
    type: { landing: "Landingpage", business: "Unternehmenswebsite", ecommerce: "Onlineshop", portfolio: "Portfolio", booking: "Buchungswebsite", custom: "individuelle Website" },
    feature: { booking: "Online-Buchung", contact: "Kontaktformular", multilingual: "zweite Sprache", ecommerce: "Onlineshop", cms: "CMS", blog: "Blog", animations: "Animationen", advanced: "erweiterte Animationen", ai: "KI-Integration", custom: "individuelle Entwicklung" },
    visual: { branding: "Logo & Branding", social: "Social-Media-Visuals", product: "Produktfotos", website: "Bilder für die Website", ai: "KI-Visuals", video: "Video & Motion" },
    care: { basic: "Basis-Betreuung", full: "Rundum-Betreuung" },
  },
  hr: {
    type: { landing: "landing stranica", business: "poslovna web stranica", ecommerce: "web trgovina", portfolio: "portfolio", booking: "web stranica za rezervacije", custom: "web stranica po mjeri" },
    feature: { booking: "online rezervacije", contact: "kontakt obrazac", multilingual: "dodatni jezik", ecommerce: "web trgovina", cms: "CMS", blog: "blog", animations: "animacije", advanced: "napredne animacije", ai: "AI integracija", custom: "razvoj po mjeri" },
    visual: { branding: "logo i brending", social: "vizuali za društvene mreže", product: "fotografije proizvoda", website: "fotografije za web", ai: "AI vizuali", video: "video i animacija" },
    care: { basic: "osnovno održavanje", full: "potpuno održavanje" },
  },
};

/** The AI's reading of a project, in a language other than English (the English sentence is describeBrief). */
export function describeBriefIn(p: Picks, lang: Exclude<Lang, "en">): string {
  const t = TERMS[lang];
  const site = siteOf(p);
  const parts: string[] = [];
  if (site) parts.push(t.type[site]);
  for (const f of p.features) if (!(f === "ecommerce" && site === "ecommerce") && !(f === "booking" && site === "booking")) parts.push(t.feature[f]);
  for (const v of p.visuals) parts.push(t.visual[v]);
  if (p.care && p.care !== "none") parts.push(t.care[p.care]);
  const s = parts.join(" · ");
  return s ? s.charAt(0).toUpperCase() + s.slice(1) + "." : "";
}
