/**
 * Liver scores used by the unified Liver tool — preserved from LiverMiniApp
 * and Liver Auto-Calc (same equations and default cut-offs).
 *
 * FIB-4 = (age × AST) / (platelets × √ALT)
 * APRI  = ((AST / AST ULN) × 100) / platelets
 * NFS   = −1.675 + 0.037×age + 0.094×BMI + 1.13×IFG + 0.99×(AST/ALT) − 0.013×platelets − 0.66×albumin
 * MELD 3.0 and Child-Pugh as implemented on the existing Liver page.
 */

export type LiverRisk = "low" | "indeterminate" | "high" | null;

export type LiverCutoffs = {
  fib4Low: number;
  fib4High: number;
  fib4LowElderly: number;
  apriLow: number;
  apriHigh: number;
  nfsLow: number;
  nfsHigh: number;
};

export type LftPattern = "hepatocellular" | "cholestatic" | "mixed" | "normal" | "unknown";

export const AASLD_LIVER_CUTOFFS: LiverCutoffs = {
  fib4Low: 1.3,
  fib4High: 2.67,
  fib4LowElderly: 2.0,
  apriLow: 0.5,
  apriHigh: 1.5,
  nfsLow: -1.455,
  nfsHigh: 0.676,
};

export function classifyFIB4(
  age: number,
  ast: number,
  alt: number,
  plt: number,
  c: LiverCutoffs,
): { score: number; risk: LiverRisk } {
  if (!age || !ast || !alt || !plt) return { score: NaN, risk: null };
  const score = (age * ast) / (plt * Math.sqrt(alt));
  const low = age >= 65 ? c.fib4LowElderly : c.fib4Low;
  const risk: LiverRisk = score < low ? "low" : score <= c.fib4High ? "indeterminate" : "high";
  return { score, risk };
}

export function classifyAPRI(
  ast: number,
  astULN: number,
  plt: number,
  c: LiverCutoffs,
): { score: number; risk: LiverRisk } {
  if (!ast || !astULN || !plt) return { score: NaN, risk: null };
  const score = ((ast / astULN) * 100) / plt;
  const risk: LiverRisk = score < c.apriLow ? "low" : score <= c.apriHigh ? "indeterminate" : "high";
  return { score, risk };
}

export function classifyNFS(
  age: number,
  bmi: number,
  hyperglycemia: boolean,
  plt: number,
  alb: number,
  ast: number,
  alt: number,
  c: LiverCutoffs,
): { score: number; risk: LiverRisk } {
  if (!age || !bmi || !plt || !alb || !ast || !alt) return { score: NaN, risk: null };
  const ifg = hyperglycemia ? 1 : 0;
  const score = -1.675 + 0.037 * age + 0.094 * bmi + 1.13 * ifg + 0.99 * (ast / alt) - 0.013 * plt - 0.66 * alb;
  const risk: LiverRisk = score < c.nfsLow ? "low" : score <= c.nfsHigh ? "indeterminate" : "high";
  return { score, risk };
}

export function patternFromLFTs(ast: number, alt: number, alp: number, alpULN = 120): LftPattern {
  if (!ast && !alt && !alp) return "unknown";
  const altULN = 40;
  const altR = alt / altULN;
  const alpR = alp / alpULN;
  if (altR < 1 && alpR < 1) return "normal";
  const R = altR / Math.max(alpR, 0.01);
  if (R >= 5) return "hepatocellular";
  if (R <= 2) return "cholestatic";
  return "mixed";
}

export function calcMeld3(params: {
  bilirubin: number;
  inr: number;
  creatinine: number;
  sodium: number;
  albumin: number;
  sex: string;
}): number {
  const bilirubin = Math.max(1, params.bilirubin);
  const normalizedInr = Math.max(1, params.inr);
  const cr = Math.min(3, Math.max(1, params.creatinine));
  const na = Math.min(137, Math.max(125, params.sodium));
  const albumin = Math.min(3.5, Math.max(1.5, params.albumin));
  return Math.max(
    6,
    Math.min(
      40,
      Math.round(
        1.33 * (params.sex === "female" ? 1 : 0) +
          4.56 * Math.log(bilirubin) +
          0.82 * (137 - na) -
          0.24 * (137 - na) * Math.log(bilirubin) +
          9.09 * Math.log(normalizedInr) +
          11.14 * Math.log(cr) +
          1.85 * (3.5 - albumin) -
          1.83 * (3.5 - albumin) * Math.log(cr) +
          6,
      ),
    ),
  );
}

export function calcChildPugh(params: {
  bilirubin: number;
  albumin: number;
  inr: number;
  ascites: boolean;
  encephalopathy: boolean;
}): number {
  const bilirubinPoints = params.bilirubin < 2 ? 1 : params.bilirubin <= 3 ? 2 : 3;
  const albuminPoints = params.albumin > 3.5 ? 1 : params.albumin >= 2.8 ? 2 : 3;
  const inrPoints = params.inr < 1.7 ? 1 : params.inr <= 2.3 ? 2 : 3;
  return bilirubinPoints + albuminPoints + inrPoints + (params.ascites ? 3 : 1) + (params.encephalopathy ? 3 : 1);
}

export function childPughClass(score: number): "A" | "B" | "C" {
  return score <= 6 ? "A" : score <= 9 ? "B" : "C";
}
