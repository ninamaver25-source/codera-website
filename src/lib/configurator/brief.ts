import { PRICE, type PagesId, type Range } from "./catalog";

/**
 * The AI PRICE GENERATOR: a description in the visitor's own words, the services they pick, and a
 * deterministic estimate. Every amount comes from the studio's price list (PRICE in catalog.ts);
 * the AI only reads the description and picks options — it never sets a price.
 */
export type SiteType = "landing" | "business" | "ecommerce" | "portfolio" | "booking" | "custom";
export type BriefFeature = "booking" | "contact" | "multilingual" | "ecommerce" | "cms" | "blog" | "animations" | "advanced" | "ai" | "custom";
export type BriefVisual = "branding" | "social" | "product" | "website" | "ai" | "video";
export type BriefCare = "none" | "basic" | "full";

export interface Picks {
  type: SiteType | null;
  features: BriefFeature[];
  visuals: BriefVisual[];
  care: BriefCare | null;
}
export interface Brief extends Picks {
  description: string;
}

export const NO_PICKS: Picks = { type: null, features: [], visuals: [], care: null };
export const NO_BRIEF: Brief = { description: "", ...NO_PICKS };

export const TYPE_OPTIONS: { id: SiteType; label: string }[] = [
  { id: "landing", label: "Landing Page" },
  { id: "business", label: "Business Website" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "portfolio", label: "Portfolio" },
  { id: "booking", label: "Booking Website" },
  { id: "custom", label: "Custom Website" },
];
export const FEATURE_OPTIONS: { id: BriefFeature; label: string }[] = [
  { id: "booking", label: "Online Booking" },
  { id: "contact", label: "Contact Form" },
  { id: "multilingual", label: "Multilingual" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "cms", label: "CMS" },
  { id: "blog", label: "Blog" },
  { id: "animations", label: "Animations" },
  { id: "advanced", label: "Advanced Animations" },
  { id: "ai", label: "AI Integration" },
  { id: "custom", label: "Custom Development" },
];
export const VISUAL_OPTIONS: { id: BriefVisual; label: string }[] = [
  { id: "branding", label: "Logo / Branding" },
  { id: "social", label: "Social Media Visuals" },
  { id: "product", label: "Product Visuals" },
  { id: "website", label: "Website Visuals" },
  { id: "ai", label: "AI Visuals" },
  { id: "video", label: "Video / Motion" },
];
export const CARE_OPTIONS: { id: BriefCare; label: string }[] = [
  { id: "none", label: "No monthly care" },
  { id: "basic", label: "Basic Care" },
  { id: "full", label: "Full Website Care" },
];

/* ------------------------------------------------------------------ */
/*  Prices: the price list's own entries, mapped onto these options     */
/* ------------------------------------------------------------------ */

/** The size each kind of site usually has (for languages). */
const SIZE: Record<SiteType, PagesId> = { landing: "1", portfolio: "2-4", business: "5-10", booking: "5-10", ecommerce: "5-10", custom: "10-20" };
const span = (a: Range, b: Range): Range => [a[0], b[1]];
const plus = (a: Range, b: Range): Range => [a[0] + b[0], a[1] + b[1]];
const BASE: Record<SiteType, Range> = {
  landing: PRICE.website["1"],
  business: span(PRICE.website["2-4"], PRICE.website["5-10"]),
  ecommerce: plus(PRICE.website["5-10"], PRICE.shop),
  portfolio: PRICE.website["2-4"],
  booking: plus(span(PRICE.website["2-4"], PRICE.website["5-10"]), PRICE.features.booking),
  custom: span(PRICE.website["5-10"], PRICE.website["10-20"]),
};
/** Custom development (integrations, calculators, custom logic) is not in the price list yet. */
const CUSTOM_DEVELOPMENT: Range = [300, 800];
const FEATURE_PRICE: Record<Exclude<BriefFeature, "multilingual">, Range> = {
  booking: PRICE.features.booking,
  contact: [0, 0],
  ecommerce: PRICE.shop,
  cms: PRICE.features.cms,
  blog: PRICE.features.blog,
  animations: PRICE.features.animations,
  advanced: PRICE.features["3d"],
  ai: PRICE.features.ai,
  custom: CUSTOM_DEVELOPMENT,
};
const VISUAL_PRICE: Record<BriefVisual, Range> = {
  branding: PRICE.features.branding,
  social: PRICE.visuals["brand-photo"].small,
  product: PRICE.visuals["product-photo"].small,
  website: PRICE.visuals["brand-photo"].small,
  ai: PRICE.visuals["ai-visuals"].small,
  video: PRICE.visuals.video.small,
};
const CARE_PRICE: Record<Exclude<BriefCare, "none">, Range> = { basic: PRICE.care.essential, full: PRICE.care.plus };

export interface BriefLine {
  label: string;
  range: Range;
}
export interface BriefEstimate {
  lines: BriefLine[];
  /** one-off total, rounded to €50 ([0, 0] when only care is chosen) */
  total: Range;
  monthly: Range | null;
}

const lbl = <T extends string>(list: { id: T; label: string }[], id: T) => list.find((x) => x.id === id)?.label ?? id;

/** Features without a site type assume a business website. */
export const siteOf = (p: Picks): SiteType | null => p.type ?? (p.features.length ? "business" : null);

export function estimateBrief(p: Picks): BriefEstimate | null {
  const site = siteOf(p);
  const care = p.care && p.care !== "none" ? CARE_PRICE[p.care] : null;
  if (!site && !p.visuals.length && !care) return null;
  const lines: BriefLine[] = [];
  let total: Range = [0, 0];
  const push = (label: string, r: Range) => {
    lines.push({ label, range: r });
    total = plus(total, r);
  };
  if (site) {
    push(p.type ? lbl(TYPE_OPTIONS, site) : "Business Website (assumed)", BASE[site]);
    for (const f of p.features) {
      if (f === "ecommerce" && site === "ecommerce") continue; // the shop is the site
      if (f === "booking" && site === "booking") continue; // booking is the site
      if (f === "animations" && p.features.includes("advanced")) continue; // included in advanced
      if (f === "multilingual") push("Multilingual · a second language", PRICE.language[SIZE[site]]);
      else push(f === "contact" ? "Contact Form · included" : lbl(FEATURE_OPTIONS, f), FEATURE_PRICE[f]);
    }
  }
  for (const v of p.visuals) push(lbl(VISUAL_OPTIONS, v), VISUAL_PRICE[v]);
  if (care && p.care) lines.push({ label: `${lbl(CARE_OPTIONS, p.care)} · per month`, range: care });
  return { lines, total: [Math.floor(total[0] / 50) * 50, Math.ceil(total[1] / 50) * 50], monthly: care };
}

const euro = (n: number) => `€${n.toLocaleString("en-US")}`;
export const formatEstimate = (r: Range) => `${euro(r[0])} – ${euro(r[1])}`;

const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : (items[0] ?? ""));
const TYPE_WORDS: Record<SiteType, string> = {
  landing: "landing page",
  business: "business website",
  ecommerce: "e-commerce website",
  portfolio: "portfolio website",
  booking: "booking website",
  custom: "custom website",
};
const FEATURE_WORDS: Record<BriefFeature, string> = {
  booking: "online booking",
  contact: "a contact form",
  multilingual: "a second language",
  ecommerce: "an online shop",
  cms: "a CMS",
  blog: "a blog",
  animations: "animations",
  advanced: "advanced animations",
  ai: "AI integration",
  custom: "custom development",
};
const VISUAL_WORDS: Record<BriefVisual, string> = {
  branding: "logo & branding",
  social: "social media visuals",
  product: "product visuals",
  website: "website visuals",
  ai: "AI visuals",
  video: "video & motion",
};

/** One sentence, the way the AI says back what it understood. */
export function describeBrief(p: Picks): string {
  const site = siteOf(p);
  const feats = p.features.filter((f) => !(f === "ecommerce" && site === "ecommerce") && !(f === "booking" && site === "booking")).map((f) => FEATURE_WORDS[f]);
  const vis = p.visuals.map((v) => VISUAL_WORDS[v]);
  const care = p.care === "basic" ? "basic website care" : p.care === "full" ? "full website care" : "";
  let s = "";
  if (site) {
    s = `${/^[aeiou]/.test(TYPE_WORDS[site]) ? "An" : "A"} ${TYPE_WORDS[site]}${feats.length ? ` with ${list(feats)}` : ""}`;
    if (vis.length) s += `, plus ${list(vis)}`;
    if (care) s += `, and ${care} every month`;
  } else if (vis.length) {
    s = `${list(vis).replace(/^./, (c) => c.toUpperCase())}${care ? `, and ${care} every month` : ""}`;
  } else if (care) {
    s = `${care.replace(/^./, (c) => c.toUpperCase())} for your website, every month`;
  }
  return s ? `${s}.` : "";
}

/** A brief as it comes from a browser: anything unknown is dropped. */
export function sanitizeBrief(v: unknown): Brief {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const one = <T extends string>(x: unknown, opts: { id: T }[]) => (opts.some((i) => i.id === x) ? (x as T) : null);
  const many = <T extends string>(x: unknown, opts: { id: T }[]) => (Array.isArray(x) ? opts.filter((i) => x.includes(i.id)).map((i) => i.id) : []);
  const d = typeof o.description === "string" ? o.description.replace(/\s+/g, " ").trim().slice(0, 1500) : "";
  return { description: d, type: one(o.type, TYPE_OPTIONS), features: many(o.features, FEATURE_OPTIONS), visuals: many(o.visuals, VISUAL_OPTIONS), care: one(o.care, CARE_OPTIONS) };
}

/** The picks as readable lines, for the e-mail. */
export function briefRows(p: Picks): [string, string][] {
  return [
    ["Website type", p.type ? lbl(TYPE_OPTIONS, p.type) : "—"],
    ["Features", p.features.map((f) => lbl(FEATURE_OPTIONS, f)).join(", ") || "—"],
    ["Visual production", p.visuals.map((v) => lbl(VISUAL_OPTIONS, v)).join(", ") || "—"],
    ["Website care", p.care ? lbl(CARE_OPTIONS, p.care) : "—"],
  ];
}

/* ------------------------------------------------------------------ */
/*  Reading a description without a model (EN, SL, FR, ES, DE, HR)       */
/* ------------------------------------------------------------------ */

const SHOP = /e-?commerce|comercio electr[óo]nico|web ?shop|online-?shop|onlineshop|online (shop|store)|tienda|boutique|\bshop\b|\bstore\b|trgovin|checkout|\bcart\b|warenkorb|panier|carrito|ko[šs]aric|sell (products|online)|prodaj|vendre|vender|verkaufen/i;
const BOOK = /reservation|r[ée]serv|reserva|rezerv|booking|buchung|buchen|\bbook (a|an|online)|appointment|rendez-vous|\bcita|termin|naro[čc]anj|naru[čc]ivanj/i;
const FEATURE_RULES: [BriefFeature, RegExp][] = [
  ["booking", BOOK],
  ["contact", /contact|kontakt|inquir|enquir|anfrage|povpra[šs]evanj|\bupit|\bform\b|formular|formulaire|formulario|obrazec|obrazac/i],
  ["multilingual", /multilingu|bilingu|multiling[üu]e|biling[üu]e|mehrsprachig|zweisprachig|vi[šs]ejezi[čc]|dvojezi|ve[čc]jezi|two languages|several languages|languages|langues|idiomas|sprachen|dva jezika|ve[čc] jezikov|vi[šs]e jezika|translat|traduc|[üu]bersetz|prijevod|prevod/i],
  ["ecommerce", SHOP],
  ["cms", /\bcms\b|(edit|update|change|manage)[\w\s,'-]{0,30}(myself|ourselves|on (my|our) own|in-house)|edit (the )?(content|texts?|menu)|urejal|sam(a|i)? urejati|sami urejali|sami ure[đd]ivati|samostalno ure[đd]ivati|selbst (bearbeiten|pflegen|[äa]ndern)|modifier (nous|moi)-m[êe]mes?|g[ée]rer (le|nos|notre) contenu|editar (nosotros|yo)|gestionar (el|nuestro) contenido/i],
  ["blog", /\bblog|news\b|journal|novic|[čc]lank|novost|[čc]lanci|actualit[ée]s|noticias|neuigkeiten|art[íi]culos/i],
  ["animations", /animation|animacij|animaci[óo]n|animaciones|interactive|interaktiv|interactif|interactiv|scroll (effect|animation)|parallax/i],
  ["advanced", /\b3d\b|three-?d|webgl|advanced animation|immersive|immersiv|inmersiv|cinematic|napredn[a-z]* animacij|animations avanc[ée]es|animaciones avanzadas|(aufwendige|erweiterte) animation/i],
  ["ai", /\bai\b|\bia\b|\bki-|chat ?bot|artificial intelligence|intelligence artificielle|inteligencia artificial|k[üu]nstliche intelligenz|umetn[a-z]* inteligenc|umjetn[a-z]* inteligencij|\bgpt|assistant|assistent|asistent/i],
  ["custom", /custom (feature|functionality|development|logic|integration|tool)|integration (with|mit)|int[ée]gration (avec|de)|integraci[óo]n con|integracij[a-z]* (s|z|sa)\b|anbindung|schnittstelle|\bapi\b|\bcrm\b|\berp\b|calculator|calculateur|calculadora|rechner|configurator|configurateur|configurador|konfigurator|kalkulator|funkcij[a-z]* po (meri|mjeri)|fonctionnalit[ée]s sur mesure|funcionalidades a medida/i],
];
const VISUAL_RULES: [BriefVisual, RegExp][] = [
  ["branding", /\blogo|branding|brending|brand identity|visual identity|identit[ée] visuelle|identidad (visual|corporativa)|markenidentit[äa]t|corporate design|celostn|identitet/i],
  ["social", /social[- ]media|soziale medien|r[ée]seaux sociaux|redes sociales|instagram|tiktok|facebook|linkedin|dru[žz]bena omre[žz]ja|dru[šs]tven[a-z]* mre[žz]|socialn/i],
  ["product", /product (photo|visual|shot|image)s?|packshot|produktfoto|produktbild|photos? (de |des )?produits?|fotos? de productos?|fotograf[íi]as? de productos?|fotografij[a-z]* (izdelk|proizvod|artikl)/i],
  ["website", /galler|galerij|galerie|galer[íi]a|photos?\b|photographs\b|fotografij|\bfotos\b|imagery|slike|pictures|bilder\b|im[áa]genes/i],
  ["ai", /ai (visual|image|photo)s?|ai-generated|generated (images|visuals)|ai vizual|ai slike|ki-(bilder|visuals)|(visuels|images) ia|(im[áa]genes|visuales) (con|de) ia/i],
  ["video", /\bvideo|v[íi]deo|vid[ée]o|reels?\b|\bfilm\b|motion graphics|bewegtbild|snemanj|snimanj|youtube/i],
];

/** Two languages named in the description (in any of the six) mean a multilingual site. */
const LANGUAGES = [
  /english|angle[šs]|angl\.|engles|englisch|anglais|ingl[ée]s/i,
  /sloven|slowenisch|slov[èe]ne|esloveno/i,
  /german|deutsch|nem[šs][čc]in|njema[čc]|allemand|alem[áa]n/i,
  /italian|italijan|talijan|italienisch|italien\b|italiano/i,
  /croatian|hrva[šs]|hrvatsk|kroatisch|croate|croata/i,
  /french|franco[šs]|francusk|franz[öo]sisch|fran[çc]ais|franc[ée]s/i,
  /spanish|[šs]pan[šs]|[šs]panjol|spanisch|espagnol|espa[ñn]ol/i,
];

/** Maps a description onto the options. */
export function readBriefLocally(description: string): Picks {
  const t = description.trim();
  const features = new Set(FEATURE_RULES.filter(([, re]) => re.test(t)).map(([id]) => id));
  if (LANGUAGES.filter((re) => re.test(t)).length > 1) features.add("multilingual");
  const visuals = VISUAL_RULES.filter(([, re]) => re.test(t)).map(([id]) => id);
  // "product photos" are product visuals, not photos for the site (unless a gallery is asked for)
  if (visuals.includes("product") && visuals.includes("website") && !/galler|galerij|galerie|galer[íi]a/i.test(t)) visuals.splice(visuals.indexOf("website"), 1);
  if (features.has("advanced")) features.delete("animations");
  let type: SiteType | null = null;
  if (/landing|one[- ]page|single[- ]page|one-?pager|einseitig|une seule page|una sola p[áa]gina|p[áa]gina [úu]nica|enostransk|ena stran|jednostrani[čc]/i.test(t)) type = "landing";
  else if (SHOP.test(t)) type = "ecommerce";
  else if (/portfolio|portafolio|portfelj|photographer|photographe\b|fot[óo]grafo|fotograf(?!ij|[íi]a)|\bartist|artiste|artista|k[üu]nstler|umetni[kc]|umjetni|designer|dise[ñn]ador|oblikoval|dizajner/i.test(t)) type = "portfolio";
  else if (/booking (site|website|platform)|apartment|apartma|apartman|appartement|apartamento|ferienwohnung|accommodation|nastanit|smje[šs]taj|h[ée]bergement|alojamiento|unterkunft|holiday rental|salon|barber|frizer|friseur|coiffeur|peluquer|spa\b|clinic|klinik|cl[íi]nica|ordinacij|praxis/i.test(t) && BOOK.test(t)) type = "booking";
  else if (/platform|plateforme|plataforma|plattform|portal|portail|web ?app|application web|aplicaci[óo]n web|webanwendung|aplikacij|complex|complej|komplex|kompleksn|slo[žz]en|custom (web)?site|site sur mesure|web a medida|individuelle website|stran po meri|stranic[a-z]* po mjeri/i.test(t)) type = "custom";
  else if (/web ?site|webseite|spletn|\bsite\b|\bweb\b|stran|stranic|page|p[áa]gina|seite|restaurant|restavrac|restoran|caf[eé]|kafi[ćc]|cafeter|\bbar\b|h[oô]tel|company|podjetj|tvrtk|poduze[ćc]|firma|unternehmen|empresa|entreprise|soci[ée]t[ée]|business|negocio|studio|agency|agencij|agentur|agence|agencia|shop|clinic|salon/i.test(t) || features.size) type = "business";
  if (type === "ecommerce") features.delete("ecommerce");
  if (type === "booking") features.delete("booking");
  const care: BriefCare | null = /full (website )?(care|maintenance|support)|priority support|monthly improvements|celotn[a-z]* vzdr[žz]evanj|celovit[a-z]* vzdr[žz]evanj|potpun[a-z]* odr[žz]avanj|maintenance compl[èe]te|mantenimiento completo|vollst[äa]ndige (wartung|betreuung)|rundum-betreuung|support prioritaire|soporte prioritario/i.test(t)
    ? "full"
    : /maintenance|website care|\bcare\b|support|updates|hosting|vzdr[žz]evanj|posodobitv|odr[žz]avanj|a[žz]uriranj|entretien|mises? [àa] jour|h[ée]bergement|mantenimiento|soporte|actualizaciones|wartung|betreuung|pflege/i.test(t)
      ? "basic"
      : null;
  return { type, features: FEATURE_OPTIONS.filter((o) => features.has(o.id)).map((o) => o.id), visuals, care };
}

/* ------------------------------------------------------------------ */
/*  The generator itself: one box — a description and a few options      */
/* ------------------------------------------------------------------ */

export type QuickOption = "website" | "shop" | "booking" | "multilingual" | "visuals" | "care";
export const QUICK_OPTIONS: { id: QuickOption; label: string }[] = [
  { id: "website", label: "Website" },
  { id: "shop", label: "Online shop" },
  { id: "booking", label: "Booking" },
  { id: "multilingual", label: "Multilingual" },
  { id: "visuals", label: "Visual production" },
  { id: "care", label: "Website care" },
];

/** The options a description implies (the AI ticks them). */
export function optionsOf(p: Picks): QuickOption[] {
  const o = new Set<QuickOption>();
  if (p.type && p.type !== "ecommerce") o.add("website");
  if (p.type === "ecommerce" || p.features.includes("ecommerce")) o.add("shop");
  if (p.type === "booking" || p.features.includes("booking")) o.add("booking");
  if (p.features.includes("multilingual")) o.add("multilingual");
  if (p.visuals.length) o.add("visuals");
  if (p.care && p.care !== "none") o.add("care");
  return QUICK_OPTIONS.filter((q) => o.has(q.id)).map((q) => q.id);
}

/** The project to price: the details the AI read in the description, governed by the options ticked. */
export function picksOf(ai: Picks, opts: QuickOption[]): Picks {
  const has = (q: QuickOption) => opts.includes(q);
  const site = has("website") || has("shop") || has("booking") || has("multilingual");
  let type: SiteType | null = null;
  if (has("shop")) type = "ecommerce";
  else if (site) type = ai.type && ai.type !== "ecommerce" ? ai.type : "business";
  if (type === "booking" && !has("booking")) type = "business";
  const features = new Set<BriefFeature>();
  if (site) {
    for (const f of ai.features) if (f !== "ecommerce" && f !== "booking" && f !== "multilingual") features.add(f);
    if (has("booking") && type !== "booking") features.add("booking");
    if (has("multilingual")) features.add("multilingual");
  }
  return {
    type,
    features: FEATURE_OPTIONS.filter((f) => features.has(f.id)).map((f) => f.id),
    visuals: has("visuals") ? (ai.visuals.length ? ai.visuals : ["website"]) : [],
    care: has("care") ? (ai.care === "full" ? "full" : "basic") : null,
  };
}
