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
  const pattern = !anemia ? "no-anemia" : morphology === "macrocytic" ? "macrocytic-anemia"
    : morphology === "microcytic" ? "microcytic-anemia"
    : elevatedRdw ? "normocytic-high-rdw" : "normocytic-normal-rdw";
  return { status: "ready" as const, anemia, elevatedRdw, morphology, pattern };
}