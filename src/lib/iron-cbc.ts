export interface IronCbcInputs {
  hemoglobin: string;
  hbLowerLimit: string;
  mcv: string;
  rdw: string;
  rdwUpperLimit: string;
}

export const EMPTY_IRON_CBC: IronCbcInputs = {
  hemoglobin: "", hbLowerLimit: "12", mcv: "", rdw: "", rdwUpperLimit: "14.5",
};

export function assessIronCbc(inputs: IronCbcInputs) {
  const values = Object.values(inputs);
  if (values.some(value => !value.trim())) return { status: "incomplete" as const };
  const { hemoglobin, hbLowerLimit, mcv, rdw, rdwUpperLimit } = Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [key, Number(value)]),
  );
  if ([hemoglobin, hbLowerLimit, mcv, rdw, rdwUpperLimit].some(value => !Number.isFinite(value) || value <= 0)
    || hemoglobin > 25 || hbLowerLimit > 25 || mcv > 200 || rdw > 100 || rdwUpperLimit > 100) {
    return { status: "invalid" as const };
  }
  const anemia = hemoglobin < hbLowerLimit;
  const elevatedRdw = rdw > rdwUpperLimit;
  const morphology = mcv < 80 ? "microcytic" : mcv <= 100 ? "normocytic" : "macrocytic";
  let pattern: "no-anemia" | "microcytic-anemia" | "normocytic-high-rdw" | "normocytic-normal-rdw" | "macrocytic-anemia";
  let condition: string;
  let ironDeficiencyFit: "compatible" | "possible" | "not-typical";
  if (!anemia) {
    pattern = "no-anemia";
    condition = "Hb is at or above the entered lower reference limit";
    ironDeficiencyFit = "possible";
  } else if (mcv < 80) {
    pattern = "microcytic-anemia";
    condition = "Hb is below the reference limit and MCV <80 fL";
    ironDeficiencyFit = "compatible";
  } else if (mcv <= 100 && elevatedRdw) {
    pattern = "normocytic-high-rdw";
    condition = "Hb is below the reference limit, MCV is 80–100 fL, and RDW-CV exceeds its upper reference limit";
    ironDeficiencyFit = "compatible";
  } else if (mcv <= 100) {
    pattern = "normocytic-normal-rdw";
    condition = "Hb is below the reference limit, MCV is 80–100 fL, and RDW-CV is not elevated";
    ironDeficiencyFit = "possible";
  } else {
    pattern = "macrocytic-anemia";
    condition = "Hb is below the reference limit and MCV >100 fL";
    ironDeficiencyFit = "not-typical";
  }
  return { status: "ready" as const, anemia, elevatedRdw, morphology, pattern, condition, ironDeficiencyFit };
}