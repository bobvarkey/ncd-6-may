import { describe, expect, it } from "vitest";
import { gradeCts, type CtsInputs } from "@/data/cts-grading-scale";

const base: CtsInputs = {
  sensitiveComparisonTests: "not-done",
  medianSensoryConductionVelocity: "not-done",
  medianSensoryResponse: "not-done",
  medianMotorResponse: "not-done",
  apbDistalMotorLatencyMs: null,
  apbCmapAmplitudeMv: null,
};

const normalStudy: CtsInputs = {
  sensitiveComparisonTests: "normal",
  medianSensoryConductionVelocity: "normal",
  medianSensoryResponse: "present",
  medianMotorResponse: "present",
  apbDistalMotorLatencyMs: 3.8,
  apbCmapAmplitudeMv: 8,
};

describe("Bland CTS neurophysiological gradation", () => {
  it("reports no data before any finding is documented", () => {
    const result = gradeCts(base);
    expect(result.hasData).toBe(false);
    expect(result.grade).toBe(0);
  });

  it("grades a normal study as 0", () => {
    expect(gradeCts(normalStudy).grade).toBe(0);
    expect(gradeCts(normalStudy).severity).toBe("Normal");
  });

  it("grades abnormal sensitive comparison tests with otherwise normal routine studies as 1", () => {
    expect(gradeCts({ ...normalStudy, sensitiveComparisonTests: "abnormal" }).grade).toBe(1);
  });

  it("grades slowed sensory velocity with normal distal motor latency as 2", () => {
    const result = gradeCts({
      ...normalStudy,
      sensitiveComparisonTests: "abnormal",
      medianSensoryConductionVelocity: "slowed",
      apbDistalMotorLatencyMs: 4.0,
    });
    expect(result.grade).toBe(2);
    expect(result.severity).toBe("Mild");
  });

  it("grades preserved sensory response with prolonged distal motor latency as 3", () => {
    const result = gradeCts({
      ...normalStudy,
      medianSensoryConductionVelocity: "slowed",
      apbDistalMotorLatencyMs: 5.6,
    });
    expect(result.grade).toBe(3);
    expect(result.severity).toBe("Moderate");
  });

  it("grades absent sensory response with preserved motor response as 4", () => {
    const result = gradeCts({
      ...normalStudy,
      medianSensoryConductionVelocity: "not-done",
      medianSensoryResponse: "absent",
      apbDistalMotorLatencyMs: 5.0,
    });
    expect(result.grade).toBe(4);
    expect(result.severity).toBe("Severe");
  });

  it("assumes a preserved motor response for grade 4 when the motor study is undocumented", () => {
    const result = gradeCts({
      ...base,
      medianSensoryResponse: "absent",
      apbDistalMotorLatencyMs: 5.0,
    });
    expect(result.grade).toBe(4);
    expect(result.notes.join(" ")).toContain("preserved motor response");
  });

  it("grades distal motor latency above 6.5 ms as 5", () => {
    const result = gradeCts({
      ...normalStudy,
      medianSensoryResponse: "absent",
      apbDistalMotorLatencyMs: 7.2,
    });
    expect(result.grade).toBe(5);
    expect(result.severity).toBe("Very severe");
  });

  it("grades unrecordable sensory and motor responses with CMAP <0.2 mV as 6", () => {
    const result = gradeCts({
      ...base,
      medianSensoryResponse: "unrecordable",
      medianMotorResponse: "unrecordable",
      apbCmapAmplitudeMv: 0.1,
    });
    expect(result.grade).toBe(6);
    expect(result.severity).toBe("Extremely severe");
    expect(result.notes.join(" ")).not.toContain("not entered");
  });

  it("flags grade 6 when the CMAP amplitude has not been entered", () => {
    const result = gradeCts({
      ...base,
      medianSensoryResponse: "unrecordable",
      medianMotorResponse: "unrecordable",
    });
    expect(result.grade).toBe(6);
    expect(result.notes.join(" ")).toContain("CMAP amplitude");
  });

  it("flags the 6.5 ms boundary rather than silently rounding", () => {
    const result = gradeCts({
      ...normalStudy,
      apbDistalMotorLatencyMs: 6.5,
    });
    expect(result.notes.join(" ")).toContain("6.5 ms");
  });

  it("notes an incomplete study when key findings are missing", () => {
    const result = gradeCts({ ...base, medianSensoryResponse: "present" });
    expect(result.grade).toBe(0);
    expect(result.notes.join(" ")).toContain("Incomplete study");
  });
});
