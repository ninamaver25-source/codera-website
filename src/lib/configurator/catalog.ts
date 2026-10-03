/**
 * BUILD YOUR PROJECT — everything a visitor can choose, and every price.
 *
 * All prices live in this file (EUR, excl. VAT). An estimate is always computed from these
 * rules; the AI only maps a written description onto the options below and never sets a price.
 */

export type ServiceId = "website" | "shop" | "visuals" | "care";
export type FeatureId =
  | "booking"
  | "cms"
  | "blog"
  | "animations"
  | "3d"
  | "payments"
  | "ai"
  | "newsletter"
  | "accounts"
  | "seo"
  | "copy"
  | "branding";
export type PagesId = "1" | "2-4" | "5-10" | "10-20" | "20+";
export type ProductsId = "up-to-20" | "20-100" | "100+";
export type VisualId = "product-photo" | "brand-photo" | "video" | "ai-visuals";
export type VisualScale = "small" | "medium" | "large";
export type CarePlan = "essential" | "plus";

/** One project, as configured by the visitor (or suggested from their description). */
export interface Config {
  services: ServiceId[];
  pages: PagesId;
  languages: number;
  features: FeatureId[];
  products: ProductsId;
  visuals: VisualId[];
  visualScale: VisualScale;
  care: CarePlan;
}

export type Range = readonly [number, number];

export const SERVICES: { id: ServiceId; label: string; hint: string }[] = [
  { id: "website", label: "Website", hint: "Custom design and development" },
  { id: "shop", label: "E-commerce", hint: "Products, cart and checkout" },
  { id: "visuals", label: "Visual production", hint: "Photo, video and AI visuals" },
  { id: "care", label: "Website care", hint: "Updates, backups, security" },
];

export const PAGES: { id: PagesId; label: string }[] = [
  { id: "1", label: "1 page" },
  { id: "2-4", label: "2–4 pages" },
  { id: "5-10", label: "5–10 pages" },
  { id: "10-20", label: "10–20 pages" },
  { id: "20+", label: "20+ pages" },
];

export const FEATURES: { id: FeatureId; label: string }[] = [
  { id: "booking", label: "Booking system" },
  { id: "cms", label: "CMS — edit it yourself" },
  { id: "blog", label: "Blog / news" },
  { id: "animations", label: "Custom animations" },
  { id: "3d", label: "3D elements" },
  { id: "payments", label: "Online payments" },
  { id: "ai", label: "AI integrations" },
  { id: "newsletter", label: "Newsletter" },
  { id: "accounts", label: "Member login" },
  { id: "seo", label: "SEO setup" },
  { id: "copy", label: "Copywriting" },
  { id: "branding", label: "Logo & brand basics" },
];

export const PRODUCTS: { id: ProductsId; label: string }[] = [
  { id: "up-to-20", label: "Up to 20 products" },
  { id: "20-100", label: "20–100 products" },
  { id: "100+", label: "100+ products" },
];

export const VISUALS: { id: VisualId; label: string }[] = [
  { id: "product-photo", label: "Product photography" },
  { id: "brand-photo", label: "Brand & campaign photos" },
  { id: "video", label: "Short video & reels" },
  { id: "ai-visuals", label: "AI-generated visuals" },
];

export const SCALES: { id: VisualScale; label: string }[] = [
  { id: "small", label: "Half-day shoot" },
  { id: "medium", label: "Full-day shoot" },
  { id: "large", label: "Campaign · 2+ days" },
];

export const CARE: { id: CarePlan; label: string; hint: string }[] = [
  { id: "essential", label: "Essential", hint: "Updates, backups, security, uptime" },
  { id: "plus", label: "Plus", hint: "Essential + monthly improvements, priority" },
];

export const MAX_LANGUAGES = 6;

/* ------------------------------------------------------------------ */
/*  Prices (EUR). Ranges are [from, to].                                */
/* ------------------------------------------------------------------ */

export const PRICE = {
  /** Design and development of the website, by size. "1 page" is the "from €250" entry point. */
  website: { "1": [250, 350], "2-4": [400, 550], "5-10": [550, 700], "10-20": [850, 1150], "20+": [1300, 1800] } as Record<PagesId, Range>,
  /** Every language after the first, by size. */
  language: { "1": [50, 70], "2-4": [80, 100], "5-10": [100, 120], "10-20": [150, 200], "20+": [250, 300] } as Record<PagesId, Range>,
  /** The shop on top of the site (product pages, cart, checkout, payments included). */
  shop: [700, 1000] as Range,
  products: { "up-to-20": [0, 0], "20-100": [150, 300], "100+": [400, 700] } as Record<ProductsId, Range>,
  features: {
    booking: [150, 200],
    cms: [150, 250],
    blog: [120, 200],
    animations: [120, 180],
    "3d": [300, 600],
    payments: [150, 250],
    ai: [300, 700],
    newsletter: [60, 120],
    accounts: [300, 500],
    seo: [100, 200],
    copy: [150, 300],
    branding: [250, 450],
  } as Record<FeatureId, Range>,
  visuals: {
    "product-photo": { small: [250, 350], medium: [400, 550], large: [800, 1200] },
    "brand-photo": { small: [300, 400], medium: [450, 650], large: [900, 1400] },
    video: { small: [350, 500], medium: [600, 900], large: [1200, 2000] },
    "ai-visuals": { small: [150, 300], medium: [250, 450], large: [500, 800] },
  } as Record<VisualId, Record<VisualScale, Range>>,
  /** Website care, per month. */
  care: { essential: [39, 49], plus: [79, 99] } as Record<CarePlan, Range>,
};

export const EMPTY: Config = {
  services: [],
  pages: "5-10",
  languages: 1,
  features: [],
  products: "up-to-20",
  visuals: [],
  visualScale: "small",
  care: "essential",
};

/** Is there a website (or shop) in the project? Website options only show then. */
export const hasSite = (c: Config) => c.services.includes("website") || c.services.includes("shop");

/** Makes any input a valid configuration: unknown values dropped, numbers clamped. */
export function sanitize(input: unknown): Config {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = <T extends string>(v: unknown, list: readonly { id: T }[], def: T): T => (list.some((x) => x.id === v) ? (v as T) : def);
  const many = <T extends string>(v: unknown, list: readonly { id: T }[]): T[] =>
    Array.isArray(v) ? list.filter((x) => v.includes(x.id)).map((x) => x.id) : [];
  const lang = Math.round(Number(o.languages));
  return {
    services: many(o.services, SERVICES),
    pages: pick(o.pages, PAGES, EMPTY.pages),
    languages: Number.isFinite(lang) ? Math.min(MAX_LANGUAGES, Math.max(1, lang)) : 1,
    features: many(o.features, FEATURES),
    products: pick(o.products, PRODUCTS, EMPTY.products),
    visuals: many(o.visuals, VISUALS),
    visualScale: pick(o.visualScale, SCALES, EMPTY.visualScale),
    care: pick(o.care, CARE, EMPTY.care),
  };
}
