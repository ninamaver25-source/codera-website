import { mockEstimator } from "./mock";
import type { Estimator } from "./types";

export type { Estimate, EstimateInput, Estimator } from "./types";
export { CHIPS, NOTE, PLACEHOLDER } from "./types";
export { estimateLocally } from "./mock";

/**
 * The estimator used by /api/estimate. To plug in a real model, add a provider that implements
 * `Estimator` (for example one that asks Claude for a JSON estimate) and return it here when its
 * credentials are configured; the API route and the UI stay as they are.
 */
export function getEstimator(): Estimator {
  return mockEstimator;
}
