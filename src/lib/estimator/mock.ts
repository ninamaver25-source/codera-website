import { NOTE, type Estimate, type EstimateInput, type Estimator } from "./types";

/**
 * A rule-based estimator that reads the description and the chips. It stands in for a
 * model-backed one: same input, same output, so the UI never changes when the model arrives.
 */

interface Rule {
  key: string;
  match: RegExp;
  item?: string;
  min: number;
  max: number;
}

const RULES: Rule[] = [
  { key: "restaurant", match: /restaurant|restavracij|bistro|caf[eé]|dining|gostiln/i, item: "Restaurant website structure (menu, story, contact)", min: 200, max: 300 },
  { key: "salon", match: /salon|beauty|hair|frizer|kozmeti|spa\b|barber|nails?/i, item: "Services and pricing pages", min: 200, max: 300 },
  { key: "ecommerce", match: /e-?commerce|web ?shop|online (shop|store)|store|trgovin|products? (catalog|page)|checkout|cart/i, item: "Online shop (products, cart, checkout)", min: 1100, max: 1900 },
  { key: "booking", match: /reservation|booking|appointment|rezervac|termin|book(ing)? system/i, min: 350, max: 550 },
  { key: "gallery", match: /galler|galerij|portfolio|photo (grid|gallery)/i, item: "Photo gallery", min: 80, max: 150 },
  { key: "menu", match: /\bmenu\b|\bmeni\b|jedilnik/i, min: 80, max: 150 },
  { key: "animations", match: /animation|animacij|motion|interactive|scroll effects?|3d/i, item: "Custom animations and motion design", min: 350, max: 700 },
  { key: "blog", match: /\bblog\b|news|novice|journal|\bcms\b|edit (it|content) (myself|ourselves)/i, item: "Blog with easy editing (CMS)", min: 300, max: 500 },
  { key: "visuals", match: /photo ?shoot|photograph|video|visuals?|drone|snemanj|fotografij/i, item: "Visual production (photo and video)", min: 400, max: 900 },
  { key: "brand", match: /\blogo\b|brand(ing| identity)|celostn/i, item: "Brand identity and logo", min: 300, max: 600 },
  { key: "seo", match: /\bseo\b|google|search/i, min: 100, max: 250 },
];

const LANGS: [RegExp, string][] = [
  [/sloven|slovenš|\bsi\b/i, "SI"],
  [/english|angleš|\ben\b/i, "EN"],
  [/german|deutsch|nemš|\bde\b/i, "DE"],
  [/italian|italij|\bit\b/i, "IT"],
  [/croatian|hrvaš|\bhr\b/i, "HR"],
  [/french|franc|\bfr\b/i, "FR"],
  [/spanish|španš|\bes\b/i, "ES"],
];

const TAG_KEYS: Record<string, string> = {
  restaurant: "restaurant",
  salon: "salon",
  "e-commerce": "ecommerce",
  "booking system": "booking",
  multilingual: "multilingual",
  animations: "animations",
};

const round = (n: number) => Math.round(n / 100) * 100;

export function estimateLocally({ description, tags = [] }: EstimateInput): Estimate {
  const text = description.trim();
  const keys = new Set(tags.map((t) => TAG_KEYS[t.toLowerCase()]).filter(Boolean));
  let min = 900;
  let max = 1300;
  const items = ["Custom website design"];

  const hit = (r: Rule) => keys.has(r.key) || r.match.test(text);
  for (const r of RULES) {
    if (!hit(r)) continue;
    keys.add(r.key);
    min += r.min;
    max += r.max;
    if (r.item) items.push(r.item);
  }
  if (keys.has("booking")) items.push(keys.has("restaurant") ? "Online reservation system" : "Online booking system");

  // Languages: count the ones named; "multilingual" alone means two.
  const named = LANGS.filter(([re]) => re.test(text)).map(([, code]) => code);
  const multilingual = keys.has("multilingual") || /multilingual|languages?|jezik|dvojezi|bilingual|translat/i.test(text);
  const count = Math.max(named.length, multilingual ? 2 : 0);
  if (count >= 2) {
    const codes = named.length >= 2 ? named.join(" + ") : "SI + EN";
    items.push(`${count} languages (${codes})`);
    min += (count - 1) * 200;
    max += (count - 1) * 350;
  }

  // Pages beyond the first five.
  const pages = /(\d{1,2})\s*(pages|strani|podstrani)/i.exec(text);
  if (pages) {
    const extra = Math.max(0, Number(pages[1]) - 5);
    min += extra * 60;
    max += extra * 100;
    if (extra > 0) items.push(`${pages[1]} pages`);
  }

  items.push("Responsive design", "Basic SEO setup");
  min = round(min);
  max = Math.max(round(max), min + 500);
  return { currency: "EUR", min, max, items, note: NOTE, source: "mock" };
}

export const mockEstimator: Estimator = {
  async estimate(input) {
    await new Promise((r) => setTimeout(r, 450));
    return estimateLocally(input);
  },
};
