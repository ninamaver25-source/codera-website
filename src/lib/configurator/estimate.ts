import { CARE, FEATURES, PAGES, PRICE, PRODUCTS, SCALES, VISUALS, hasSite, type Config, type Range } from "./catalog";

export interface Line {
  label: string;
  range: Range;
}

export interface Estimate {
  /** What the visitor sees under YOUR PROJECT, in order. */
  lines: Line[];
  /** One-off total, rounded to €50 (0–0 when nothing is chosen). */
  total: Range;
  /** Website care per month, if chosen. */
  monthly: Range | null;
}

export const NOTE = "Estimated price only. Final pricing is confirmed after project review.";

const add = (a: Range, b: Range): Range => [a[0] + b[0], a[1] + b[1]];
const label = <T extends string>(list: { id: T; label: string }[], id: T) => list.find((x) => x.id === id)?.label ?? id;

/** The price of a configuration: rules only, the same input always gives the same answer. */
export function estimate(c: Config): Estimate {
  const lines: Line[] = [];
  let total: Range = [0, 0];
  const push = (text: string, r: Range) => {
    lines.push({ label: text, range: r });
    total = add(total, r);
  };

  if (hasSite(c)) {
    const shop = c.services.includes("shop");
    push(`${shop ? "E-commerce website" : "Custom website"} · ${label(PAGES, c.pages)}`, PRICE.website[c.pages]);
    if (shop) {
      push(`Online shop · ${label(PRODUCTS, c.products)}`, add(PRICE.shop, PRICE.products[c.products]));
    }
    if (c.languages > 1) {
      const per = PRICE.language[c.pages];
      push(`${c.languages} languages`, [per[0] * (c.languages - 1), per[1] * (c.languages - 1)]);
    }
    for (const f of c.features) {
      if (f === "payments" && shop) continue; // included in the shop
      push(label(FEATURES, f), PRICE.features[f]);
    }
  }

  if (c.services.includes("visuals")) {
    const kinds = c.visuals.length ? c.visuals : (["product-photo"] as const);
    for (const v of kinds) push(`${label(VISUALS, v)} · ${label(SCALES, c.visualScale).toLowerCase()}`, PRICE.visuals[v][c.visualScale]);
  }

  const monthly = c.services.includes("care") ? PRICE.care[c.care] : null;
  if (monthly) lines.push({ label: `Website care · ${label(CARE, c.care)} / month`, range: monthly });

  const round: Range = [Math.floor(total[0] / 50) * 50, Math.ceil(total[1] / 50) * 50];
  return { lines, total: round, monthly };
}

export const euro = (n: number) => `€${n.toLocaleString("en-US")}`;
export const formatRange = (r: Range) => (r[0] === r[1] ? euro(r[0]) : `${euro(r[0])}–${euro(r[1])}`);
