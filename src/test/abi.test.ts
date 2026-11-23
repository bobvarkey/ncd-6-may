import { describe, expect, it } from "vitest";
import { abiCategory, calculateAbi, parsePressure, tbiCategory, type AbiInputs } from "@/lib/abi";

const empty: AbiInputs = {
  rightBrachial: "",
  leftBrachial: "",
  rightDorsalisPedis: "",
  rightPosteriorTibial: "",
  leftDorsalisPedis: "",
  leftPosteriorTibial: "",
  rightToe: "",
  leftToe: "",
};

describe("ABI pressure parsing", () => {
  it.each([
    ["", null],
    ["132", 132],
    ["0", 0],
    ["350", 350],
    ["351", null],
    ["-5", null],
    ["abc", null],
    [" 120 ", 120],
  ])("parses %s as %s", (raw, expected) => {
    expect(parsePressure(raw)).toBe(expected);
  });
});

describe("ABI categories", () => {
  it.each([
    [0.5, "Abnormal (PAD range)", "bad"],
    [0.9, "Abnormal (PAD range)", "bad"],
    [0.91, "Borderline", "warn"],
    [0.99, "Borderline", "warn"],
    [1.0, "Normal", "good"],
    [1.4, "Normal", "good"],
    [1.41, "Noncompressible", "warn"],
  ])("classifies %s as %s", (value, label, level) => {
    expect(abiCategory(value)).toEqual({ label, level });
  });
});

describe("ABI calculation", () => {
  it("uses the higher brachial pressure and the higher ankle artery on each side", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "132",
      leftBrachial: "128",
      rightDorsalisPedis: "118",
      rightPosteriorTibial: "124",
      leftDorsalisPedis: "108",
      leftPosteriorTibial: "112",
    });

    expect(result.brachialReference).toBe(132);
    expect(result.right.abi?.toFixed(2)).toBe("0.94");
    expect(result.right.category).toBe("Borderline");
    expect(result.right.higherAnklePressure).toBe(124);
    expect(result.left.abi?.toFixed(2)).toBe("0.85");
    expect(result.left.category).toBe("Abnormal (PAD range)");
    expect(result.right.note).toBe("Higher ankle pressure: 124 mmHg.");
    expect(result.report).toBe(
      [
        "Ankle–brachial index (resting):",
        "Reference brachial systolic pressure: 132 mmHg.",
        "Right ABI: 0.94 (Borderline)",
        "Left ABI: 0.85 (Abnormal (PAD range))",
      ].join("\n"),
    );
  });

  it("uses the higher of the two brachial pressures as the denominator", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "120",
      leftBrachial: "140",
      rightDorsalisPedis: "130",
    });
    expect(result.brachialReference).toBe(140);
    expect(result.right.abi?.toFixed(2)).toBe("0.93");
  });

  it("marks an incomplete ankle as provisional in the note and report", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "120",
      leftBrachial: "140",
      rightDorsalisPedis: "130",
    });
    expect(result.right.complete).toBe(false);
    expect(result.right.note).toBe(
      "Provisional: enter both ankle arteries. Higher ankle pressure: 130 mmHg.",
    );
    expect(result.report).toContain(
      "Right ABI: 0.93 (Borderline) [provisional: incomplete ankle measurements]",
    );
  });

  it("notes when only one brachial pressure has been entered", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "130",
      rightDorsalisPedis: "120",
      rightPosteriorTibial: "110",
    });
    expect(result.brachialCount).toBe(1);
    expect(result.right.abi?.toFixed(2)).toBe("0.92");
    expect(result.report).toContain(
      "Reference brachial systolic pressure: 130 mmHg.",
    );
    expect(result.report).toContain("Note: Both brachial pressures have not been entered.");
  });

  it("returns awaiting-values when no readable pressures are entered", () => {
    const result = calculateAbi(empty);
    expect(result.brachialReference).toBeNull();
    expect(result.right.abi).toBeNull();
    expect(result.right.category).toBe("Awaiting values");
    expect(result.right.level).toBe("neutral");
    expect(result.right.note).toBe("");
    expect(result.report).toBe(
      [
        "Ankle–brachial index (resting):",
        "Right ABI: not calculated",
        "Left ABI: not calculated",
        "Note: Both brachial pressures have not been entered.",
      ].join("\n"),
    );
  });

  it("does not use a zero brachial pressure as the reference", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "0",
      leftBrachial: "0",
      rightDorsalisPedis: "120",
      rightPosteriorTibial: "110",
    });
    expect(result.brachialReference).toBeNull();
    expect(result.right.abi).toBeNull();
  });

  it("accepts a zero ankle reading and takes the higher of the two arteries", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "100",
      leftBrachial: "100",
      rightDorsalisPedis: "0",
      rightPosteriorTibial: "80",
    });
    expect(result.right.complete).toBe(true);
    expect(result.right.higherAnklePressure).toBe(80);
    expect(result.right.abi?.toFixed(2)).toBe("0.80");
  });

  it("classifies a ratio above 1.40 as noncompressible", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "100",
      leftBrachial: "100",
      rightDorsalisPedis: "150",
      rightPosteriorTibial: "140",
    });
    expect(result.right.abi?.toFixed(2)).toBe("1.50");
    expect(result.right.category).toBe("Noncompressible");
    expect(result.right.level).toBe("warn");
  });
});

describe("toe–brachial index", () => {
  it.each([
    [0.5, "Abnormal (PAD range)", "bad"],
    [0.69, "Abnormal (PAD range)", "bad"],
    [0.7, "Normal", "good"],
    [1.2, "Normal", "good"],
  ])("classifies TBI %s as %s", (value, label, level) => {
    expect(tbiCategory(value)).toEqual({ label, level });
  });

  it("calculates TBI from the toe pressure and the higher brachial pressure", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "120",
      leftBrachial: "140",
      rightDorsalisPedis: "130",
      rightPosteriorTibial: "120",
      rightToe: "100",
      leftToe: "80",
    });
    expect(result.right.toePressure).toBe(100);
    expect(result.right.tbi?.toFixed(2)).toBe("0.71");
    expect(result.right.tbiCategory).toBe("Normal");
    expect(result.right.tbiLevel).toBe("good");
    expect(result.left.tbi?.toFixed(2)).toBe("0.57");
    expect(result.left.tbiCategory).toBe("Abnormal (PAD range)");
  });

  it("adds toe pressure and TBI lines to the report", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "100",
      leftBrachial: "100",
      rightDorsalisPedis: "90",
      rightPosteriorTibial: "80",
      rightToe: "70",
    });
    expect(result.report).toContain("Right toe pressure: 70 mmHg.");
    expect(result.report).toContain("Right TBI: 0.70 (Normal)");
    expect(result.report).not.toContain("Left TBI:");
  });

  it("does not add toe lines when no toe pressure is entered", () => {
    const result = calculateAbi({
      ...empty,
      rightBrachial: "120",
      leftBrachial: "120",
      rightDorsalisPedis: "100",
      rightPosteriorTibial: "100",
    });
    expect(result.right.tbi).toBeNull();
    expect(result.report).not.toContain("TBI:");
    expect(result.report).not.toContain("toe pressure");
  });

  it("cannot calculate TBI without a brachial reference", () => {
    const result = calculateAbi({ ...empty, rightToe: "90" });
    expect(result.right.toePressure).toBe(90);
    expect(result.right.tbi).toBeNull();
    expect(result.report).toContain("Right TBI: not calculated");
  });

  it("flags absolute toe pressures below 50 and 30 mmHg", () => {
    const low = calculateAbi({
      ...empty,
      rightBrachial: "100",
      leftBrachial: "100",
      rightToe: "45",
    });
    expect(low.right.tbiNote).toBe("Toe pressure <50 mmHg may impair wound healing.");
    expect(low.report).toContain("Right: Toe pressure <50 mmHg may impair wound healing.");

    const severe = calculateAbi({
      ...empty,
      rightBrachial: "100",
      leftBrachial: "100",
      rightToe: "20",
    });
    expect(severe.right.tbiNote).toBe("Toe pressure <30 mmHg suggests severe limb ischemia.");
  });
});
