/**
 * Bland Neurophysiological Grading Scale for Carpal Tunnel Syndrome.
 *
 * Source data supplied as the "Grading Scale for Carpal Tunnel Syndrome"
 * (Bland neurophysiological grading, grades 0–6).
 */

export const APB_DML_NORMAL_UPPER_LIMIT_MS = 4.2;
export const APB_DML_SEVERE_CUTOFF_MS = 6.5;
export const APB_CMAP_GRADE6_CUTOFF_MV = 0.2;

export type CtsGradeCriterion = Record<
  string,
  | string
  | boolean
  | {
      status?: string;
      operator?: string;
      value?: number;
      unit?: string;
    }
>;

export interface CtsGradeDefinition {
  grade: number;
  severity: string;
  description: string;
  criteria: CtsGradeCriterion;
  /** Short human-readable summary of the defining criteria. */
  summary: string;
}

export const CTS_GRADES: CtsGradeDefinition[] = [
  {
    grade: 0,
    severity: "Normal",
    description: "No neurophysiological abnormality detected.",
    criteria: { neurophysiological_abnormality: false },
    summary: "No neurophysiological abnormality.",
  },
  {
    grade: 1,
    severity: "Very mild",
    description: "Very mild CTS, detectable only with the most sensitive tests.",
    criteria: {
      routine_nerve_conduction: "May be normal",
      sensitive_comparison_tests: "Abnormal",
    },
    summary: "Routine nerve conduction may be normal; sensitive comparison tests abnormal.",
  },
  {
    grade: 2,
    severity: "Mild",
    description:
      "Slow sensory nerve conduction velocity on finger-wrist measurement, with normal terminal motor latency.",
    criteria: {
      median_sensory_conduction_velocity: "Slowed",
      median_sensory_response: "Present",
      APB_distal_motor_latency: "Normal",
    },
    summary: "Median sensory conduction velocity slowed; sensory response present; APB distal motor latency normal.",
  },
  {
    grade: 3,
    severity: "Moderate",
    description:
      "Sensory potential preserved with slowed motor conduction and distal motor latency to APB less than 6.5 ms.",
    criteria: {
      median_sensory_response: "Present",
      APB_distal_motor_latency: {
        status: "Prolonged",
        operator: "<",
        value: 6.5,
        unit: "ms",
      },
    },
    summary: "Sensory response present; APB distal motor latency prolonged but <6.5 ms.",
  },
  {
    grade: 4,
    severity: "Severe",
    description:
      "Sensory potentials absent, motor response preserved, and distal motor latency to APB less than 6.5 ms.",
    criteria: {
      median_sensory_response: "Absent",
      median_motor_response: "Present",
      APB_distal_motor_latency: {
        operator: "<",
        value: 6.5,
        unit: "ms",
      },
    },
    summary: "Median sensory response absent; motor response preserved; APB distal motor latency <6.5 ms.",
  },
  {
    grade: 5,
    severity: "Very severe",
    description: "Terminal motor latency to APB greater than 6.5 ms.",
    criteria: {
      APB_distal_motor_latency: {
        operator: ">",
        value: 6.5,
        unit: "ms",
      },
    },
    summary: "APB distal motor latency >6.5 ms.",
  },
  {
    grade: 6,
    severity: "Extremely severe",
    description:
      "Sensory and motor potentials effectively unrecordable, with surface motor potential from APB less than 0.2 mV.",
    criteria: {
      median_sensory_response: "Effectively unrecordable",
      median_motor_response: "Effectively unrecordable",
      APB_CMAP_amplitude: {
        operator: "<",
        value: 0.2,
        unit: "mV",
      },
    },
    summary: "Sensory and motor responses effectively unrecordable; APB CMAP <0.2 mV.",
  },
];

export const CTS_ABBREVIATIONS: Record<string, string> = {
  CTS: "Carpal Tunnel Syndrome",
  APB: "Abductor Pollicis Brevis",
  CMAP: "Compound Muscle Action Potential",
};

export const CTS_GRADING_SCALE = {
  title: "Grading Scale for Carpal Tunnel Syndrome",
  scaleName: "Bland Neurophysiological Grading Scale",
  condition: "Carpal Tunnel Syndrome",
  abbreviation: "CTS",
  gradeRange: { minimum: 0, maximum: 6 },
  grades: CTS_GRADES,
  abbreviations: CTS_ABBREVIATIONS,
  clinicalApplication: {
    purpose: "Electrophysiological severity classification of median neuropathy at the wrist",
    assessmentMethod: "Nerve conduction studies",
    output: {
      grade: "Integer from 0 to 6",
      severity: "Corresponding severity category",
    },
  },
} as const;

export type TriState = "not-done" | "normal" | "abnormal";
export type SensoryVelocity = "not-done" | "normal" | "slowed";
export type SensoryResponse = "not-done" | "present" | "absent" | "unrecordable";
export type MotorResponse = "not-done" | "present" | "unrecordable";

export interface CtsInputs {
  /** Comparative / segmental sensitive studies. */
  sensitiveComparisonTests: TriState;
  medianSensoryConductionVelocity: SensoryVelocity;
  medianSensoryResponse: SensoryResponse;
  medianMotorResponse: MotorResponse;
  /** APB distal motor latency in milliseconds. */
  apbDistalMotorLatencyMs: number | null;
  /** APB compound muscle action potential amplitude in millivolts. */
  apbCmapAmplitudeMv: number | null;
}

export interface CtsResult {
  hasData: boolean;
  grade: number;
  severity: string;
  description: string;
  matchedCriteria: string[];
  notes: string[];
}

const isNumber = (value: number | null): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Assign the Bland grade from documented nerve-conduction findings.
 *
 * The scale is applied in descending severity so that a single severe finding
 * (e.g. a distal motor latency >6.5 ms) is not masked by preserved sensory data.
 */
export function gradeCts(input: CtsInputs): CtsResult {
  const dml = input.apbDistalMotorLatencyMs;
  const cmap = input.apbCmapAmplitudeMv;
  const sensory = input.medianSensoryResponse;
  const motor = input.medianMotorResponse;
  const velocity = input.medianSensoryConductionVelocity;
  const sensitive = input.sensitiveComparisonTests;

  const hasData =
    sensitive !== "not-done" ||
    velocity !== "not-done" ||
    sensory !== "not-done" ||
    motor !== "not-done" ||
    isNumber(dml) ||
    isNumber(cmap);

  const notes: string[] = [];
  const matchedCriteria: string[] = [];

  const bothUnrecordable = sensory === "unrecordable" && motor === "unrecordable";
  let grade = 0;

  if (isNumber(dml) && dml === APB_DML_SEVERE_CUTOFF_MS) {
    notes.push(
      "A distal motor latency of exactly 6.5 ms sits on the boundary between grades 3/4 (<6.5 ms) and grade 5 (>6.5 ms); verify the laboratory cut-off.",
    );
  }

  if (bothUnrecordable) {
    grade = 6;
    matchedCriteria.push("Median sensory and motor responses effectively unrecordable");
    if (!isNumber(cmap)) {
      notes.push(
        "APB CMAP amplitude was not entered — grade 6 requires a surface CMAP <0.2 mV, so confirm the amplitude.",
      );
    } else if (cmap < APB_CMAP_GRADE6_CUTOFF_MV) {
      matchedCriteria.push(`APB CMAP ${cmap} mV (<0.2 mV)`);
    } else {
      notes.push(
        `APB CMAP ${cmap} mV is not below the 0.2 mV threshold that defines grade 6; re-check electrode placement, temperature and gain before finalising.`,
      );
    }
  } else if (isNumber(dml) && dml > APB_DML_SEVERE_CUTOFF_MS) {
    grade = 5;
    matchedCriteria.push(`APB distal motor latency ${dml} ms (>6.5 ms)`);
  } else if ((sensory === "absent" || sensory === "unrecordable") && motor === "present") {
    grade = 4;
    matchedCriteria.push(
      sensory === "absent" ? "Median sensory response absent" : "Median sensory response effectively unrecordable",
    );
    matchedCriteria.push("Median motor response preserved");
    if (isNumber(dml)) {
      matchedCriteria.push(`APB distal motor latency ${dml} ms (<6.5 ms)`);
      if (dml > APB_DML_NORMAL_UPPER_LIMIT_MS) {
        notes.push(
          "Motor latency is prolonged but remains below the 6.5 ms cut-off that defines grade 5.",
        );
      }
    }
  } else if ((sensory === "absent" || sensory === "unrecordable") && motor === "not-done") {
    grade = 4;
    matchedCriteria.push(
      sensory === "absent" ? "Median sensory response absent" : "Median sensory response effectively unrecordable",
    );
    notes.push(
      "Median motor response was not documented — grade 4 assumes a preserved motor response with a distal motor latency <6.5 ms.",
    );
  } else if (isNumber(dml) && dml > APB_DML_NORMAL_UPPER_LIMIT_MS) {
    grade = 3;
    if (sensory === "present") matchedCriteria.push("Median sensory response present");
    matchedCriteria.push(`APB distal motor latency ${dml} ms (prolonged but <6.5 ms)`);
    if (motor === "unrecordable") {
      notes.push(
        "Motor response is documented as unrecordable but a measurable distal motor latency was entered — check the entry.",
      );
    }
  } else if (sensory === "present" && velocity === "slowed") {
    grade = 2;
    matchedCriteria.push("Median sensory response present");
    matchedCriteria.push("Median sensory conduction velocity slowed");
    matchedCriteria.push(
      isNumber(dml)
        ? `APB distal motor latency ${dml} ms (normal)`
        : "APB distal motor latency normal (not entered)",
    );
  } else if (sensitive === "abnormal") {
    grade = 1;
    matchedCriteria.push("Routine nerve conduction may be normal");
    matchedCriteria.push("Sensitive comparison tests abnormal");
  } else {
    grade = 0;
    matchedCriteria.push("No neurophysiological abnormality documented");
  }

  if (grade !== 6 && (sensory === "not-done" || motor === "not-done" || !isNumber(dml))) {
    const missing: string[] = [];
    if (sensory === "not-done") missing.push("median sensory response");
    if (motor === "not-done") missing.push("median motor response");
    if (!isNumber(dml)) missing.push("APB distal motor latency");
    notes.push(
      `Incomplete study: ${missing.join(", ")} not entered. The grade reflects only the documented findings.`,
    );
  }

  if (motor === "unrecordable" && !bothUnrecordable && sensory !== "unrecordable") {
    notes.push(
      "An unrecordable motor response with a recordable or absent sensory response does not map cleanly onto the Bland scale — interpret with the reporting neurophysiologist.",
    );
  }

  const definition = CTS_GRADES.find((item) => item.grade === grade) ?? CTS_GRADES[0];

  return {
    hasData,
    grade,
    severity: definition.severity,
    description: definition.description,
    matchedCriteria,
    notes,
  };
}
