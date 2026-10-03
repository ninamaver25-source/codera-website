/** What the visitor sends: a description in their own words plus any quick-select chips. */
export interface EstimateInput {
  description: string;
  tags?: string[];
}

/** What every estimator returns; the UI renders exactly this. */
export interface Estimate {
  currency: "EUR";
  min: number;
  max: number;
  /** The checklist shown under the price, in display order. */
  items: string[];
  note: string;
  source: "mock" | "model";
}

export interface Estimator {
  estimate(input: EstimateInput): Promise<Estimate>;
}

export const NOTE = "This is an initial estimate. Final pricing is confirmed after reviewing your project.";

export const PLACEHOLDER =
  "I need a premium website for my restaurant with online reservations, menu, gallery and Slovenian + English language…";

export const CHIPS = ["Restaurant", "Salon", "E-commerce", "Booking system", "Multilingual", "Animations"] as const;
