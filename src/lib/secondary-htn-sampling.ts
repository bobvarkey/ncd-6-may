// Sampling conditions for secondary hypertension biochemical tests.
// Fractionated metanephrines = plasma free metanephrine + normetanephrine.

/** Analytes measured in a fractionated metanephrine test. */
export const METANEPHRINE_ANALYTES = ["metanephrine", "normetanephrine"] as const;

/** Minutes the patient must lie supine before the sample is drawn. */
export const SUPINE_REST_MINUTES = 20;

/** Lower-case clause for embedding in lists, table cells and workup strings. */
export const METANEPHRINE_SAMPLING_CLAUSE = `draw after ${SUPINE_REST_MINUTES} minutes of supine rest`;

/** Full sentence used in clinical pearls and workup boxes. */
export const METANEPHRINE_SAMPLING_NOTE =
  `Fractionated metanephrines (which includes plasma free ${METANEPHRINE_ANALYTES[0]} and ${METANEPHRINE_ANALYTES[1]}) should be drawn after ${SUPINE_REST_MINUTES} minutes of supine rest.`;
