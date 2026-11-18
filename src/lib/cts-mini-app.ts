/**
 * Grading logic for the supplied Bland CTS mini app.
 *
 * Ported verbatim from the standalone CTS_Grading_Calculator.html so the same
 * findings produce the same grade, conflict warnings and report impression.
 */

export type Sensory = "normal" | "slow" | "absent";
export type Comparison = "normal" | "abnormal" | "unknown";
export type Motor = "present" | "absent";
export type DmlCategory = "lt" | "gt" | "eq" | "unrecordable";
export type Prolonged = "yes" | "no" | "unknown";
export type Cmap = "adequate" | "low" | "absent";
export type Lumbrical = "yes" | "no" | "notdone";

export interface MiniState {
  sensory: Sensory | null;
  comparison: Comparison | null;
  motor: Motor | null;
  prolonged: Prolonged | null;
  dml: DmlCategory | null;
  cmap: Cmap | null;
  lumbrical: Lumbrical | null;
}

export const EMPTY_MINI_STATE: MiniState = {
  sensory: null,
  comparison: null,
  motor: null,
  prolonged: null,
  dml: null,
  cmap: null,
  lumbrical: null,
};

export const SEVERITY_LABELS = [
  "Normal",
  "Very mild",
  "Mild",
  "Moderate",
  "Severe",
  "Very severe",
  "Extremely severe",
];

export interface MiniResult {
  grade: number | null;
  why: string;
  warnings: string[];
  impression: string;
  lumbricalNote: string;
}

export function evaluateMiniApp(
  state: MiniState,
  latencyRaw: string,
  amplitudeRaw: string,
): MiniResult {
  const parsedLatency = latencyRaw.trim() === "" ? null : Number(latencyRaw);
  const parsedAmplitude = amplitudeRaw.trim() === "" ? null : Number(amplitudeRaw);
  const latency = parsedLatency !== null && Number.isFinite(parsedLatency) ? parsedLatency : null;
  const amplitude =
    parsedAmplitude !== null && Number.isFinite(parsedAmplitude) ? parsedAmplitude : null;

  const { sensory, comparison, prolonged, motor } = state;

  const dml: DmlCategory | null =
    latency === null ? state.dml : latency < 6.5 ? "lt" : latency > 6.5 ? "gt" : "eq";
  const cmap: Cmap | null =
    amplitude === null ? state.cmap : amplitude < 0.2 ? "low" : "adequate";

  const effectivelyAbsent = cmap === "low" || cmap === "absent" || motor === "absent";

  let grade: number | null = null;
  let why = "";
  const warnings: string[] = [];

  if (state.dml && latency !== null && state.dml !== dml) {
    warnings.push("Selected DML category conflicts with the exact entered DML.");
  }
  if (state.cmap && amplitude !== null && state.cmap !== cmap) {
    warnings.push("Selected CMAP category conflicts with the exact entered amplitude.");
  }
  if (motor === "present" && cmap === "absent") {
    warnings.push("Motor response marked recordable but APB CMAP marked unrecordable.");
  }
  if (motor === "absent" && cmap === "adequate") {
    warnings.push("Motor response marked unrecordable but APB CMAP is ≥0.2 mV.");
  }

  if (!sensory) {
    why = "Select median sensory response.";
  } else if (!cmap && !motor) {
    why = "Select APB CMAP category.";
  } else if (effectivelyAbsent) {
    if (sensory === "absent") {
      grade = 6;
      why = "Absent sensory response and APB CMAP <0.2 mV or unrecordable.";
    } else {
      why =
        "APB CMAP effectively unrecordable but sensory response present: pattern not classified by supplied criteria.";
    }
  } else if (!dml) {
    why = "Select median DML category.";
  } else if (dml === "eq") {
    why = "Exactly 6.5 ms is not assigned in the supplied grading criteria; manual review required.";
  } else if (dml === "unrecordable") {
    why = "DML unmeasurable with APB CMAP ≥0.2 mV: verify recording and review manually.";
  } else if (dml === "gt") {
    grade = 5;
    why = "Median APB DML >6.5 ms.";
  } else if (sensory === "absent") {
    grade = 4;
    why = "Absent median sensory potential with APB CMAP preserved and DML <6.5 ms.";
  } else if (prolonged === "yes") {
    grade = 3;
    why = "Sensory potential preserved with prolonged APB DML <6.5 ms.";
  } else if (prolonged !== "no") {
    why = "Indicate whether DML is prolonged relative to laboratory limits.";
  } else if (sensory === "slow") {
    grade = 2;
    why = "Slowed sensory conduction with normal APB DML.";
  } else if (sensory === "normal" && comparison === "abnormal") {
    grade = 1;
    why = "Routine sensory study normal with abnormal sensitive comparison test.";
  } else if (sensory === "normal" && comparison === "normal") {
    grade = 0;
    why = "No neurophysiological abnormality detected.";
  } else {
    why = "Select comparative testing result to distinguish Grade 0 from Grade 1.";
  }

  if (grade !== null && dml === "gt" && prolonged === "no") {
    warnings.push("DML >6.5 ms conflicts with normal motor latency classification.");
  }
  if (grade !== null && grade <= 2 && prolonged === "yes") {
    warnings.push("Prolonged motor latency conflicts with Grades 0–2.");
  }
  if (grade !== null && sensory === "absent" && comparison === "normal") {
    warnings.push("Absent sensory potential conflicts with normal comparative tests.");
  }

  if (warnings.length) {
    grade = null;
    why = warnings.join(" ");
  }

  const lumbricalNote =
    state.lumbrical === "yes"
      ? "Median second lumbrical potential recorded."
      : state.lumbrical === "no"
        ? "Median second lumbrical potential unrecordable."
        : state.lumbrical === "notdone"
          ? "Median second lumbrical response not tested."
          : "Median second lumbrical response not specified.";

  const impression =
    (grade === null
      ? `Grade not assigned. ${why}`
      : `Electrophysiological findings are consistent with ${SEVERITY_LABELS[grade].toLowerCase()} median neuropathy at the wrist (carpal tunnel syndrome), Bland Grade ${grade}/6. ${why}`) +
    ` ${lumbricalNote}`;

  return { grade, why, warnings, impression, lumbricalNote };
}
