/**
 * Ankle–brachial index (ABI) calculation.
 *
 * Ported from the supplied standalone Ankle_Brachial_Index_Calculator.html.
 * Uses the higher of the two brachial pressures as the denominator and the
 * higher of dorsalis pedis / posterior tibial pressure for each ankle.
 */

export const ABI_MAX_PRESSURE_MMHG = 350;

export type AbiLevel = "bad" | "warn" | "good" | "neutral";

export interface AbiInputs {
  rightBrachial: string;
  leftBrachial: string;
  rightDorsalisPedis: string;
  rightPosteriorTibial: string;
  leftDorsalisPedis: string;
  leftPosteriorTibial: string;
}

export interface AbiCategory {
  label: string;
  level: AbiLevel;
}

export interface AbiSideResult {
  name: "Right" | "Left";
  abi: number | null;
  category: string;
  level: AbiLevel;
  higherAnklePressure: number | null;
  complete: boolean;
  note: string;
}

export interface AbiResult {
  brachialReference: number | null;
  brachialCount: number;
  right: AbiSideResult;
  left: AbiSideResult;
  report: string;
}

/** Parse a pressure field; empty, non-numeric or out-of-range values are ignored. */
export function parsePressure(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 && value <= ABI_MAX_PRESSURE_MMHG ? value : null;
}

export function abiCategory(value: number): AbiCategory {
  if (value <= 0.9) return { label: "Abnormal (PAD range)", level: "bad" };
  if (value < 1) return { label: "Borderline", level: "warn" };
  if (value <= 1.4) return { label: "Normal", level: "good" };
  return { label: "Noncompressible", level: "warn" };
}

export function calculateAbi(inputs: AbiInputs): AbiResult {
  const brachials = [parsePressure(inputs.rightBrachial), parsePressure(inputs.leftBrachial)].filter(
    (value): value is number => value !== null && value > 0,
  );
  const brachialReference = brachials.length ? Math.max(...brachials) : null;

  const lines = ["Ankle–brachial index (resting):"];
  if (brachialReference !== null) {
    lines.push(`Reference brachial systolic pressure: ${brachialReference} mmHg.`);
  }

  const side = (
    name: "Right" | "Left",
    dorsalisRaw: string,
    posteriorRaw: string,
  ): AbiSideResult => {
    const dorsalis = parsePressure(dorsalisRaw);
    const posterior = parsePressure(posteriorRaw);
    const readings = [dorsalis, posterior].filter((value): value is number => value !== null);
    const complete = dorsalis !== null && posterior !== null;
    const abi =
      brachialReference !== null && readings.length
        ? Math.max(...readings) / brachialReference
        : null;
    const category = abi === null ? { label: "Awaiting values", level: "neutral" as const } : abiCategory(abi);
    const higherAnklePressure = readings.length ? Math.max(...readings) : null;

    const note =
      abi === null
        ? ""
        : (complete ? "" : "Provisional: enter both ankle arteries. ") +
          `Higher ankle pressure: ${higherAnklePressure} mmHg.`;

    lines.push(
      `${name} ABI: ` +
        (abi === null
          ? "not calculated"
          : `${abi.toFixed(2)} (${category.label})` +
            (complete ? "" : " [provisional: incomplete ankle measurements]")),
    );

    return {
      name,
      abi,
      category: category.label,
      level: category.level,
      higherAnklePressure,
      complete,
      note,
    };
  };

  const right = side("Right", inputs.rightDorsalisPedis, inputs.rightPosteriorTibial);
  const left = side("Left", inputs.leftDorsalisPedis, inputs.leftPosteriorTibial);

  if (brachials.length < 2) {
    lines.push("Note: Both brachial pressures have not been entered.");
  }

  return {
    brachialReference,
    brachialCount: brachials.length,
    right,
    left,
    report: lines.join("\n"),
  };
}
