import { useState } from "react";
import { Link } from "react-router-dom";
import ZoomableImage from "@/components/ZoomableImage";
import {
  Droplets,
  Pill,
  HeartPulse,
  Info,
  AlertTriangle,
} from "lucide-react";

function Doodle({ children }: { children: string }) {
  return (
    <span className="font-handwritten text-sm">{children}</span>
  );
}

function UrineDoodle({ children }: { children: string }) {
  return (
    <span className="font-handwritten text-sm">{children}</span>
  );
}

function MedTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="bladder-table overflow-x-auto rounded-xl border-2">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b-2">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-handwritten font-bold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BladderUrology() {
  const [tab, setTab] = useState<"physiology" | "dosing">("physiology");

  const btn = (active: boolean) =>
    `bladder-tab rounded-xl border-2 px-4 py-2 font-handwritten text-sm transition-colors ${
      active ? "font-bold" : ""
    }`;

  return (
    <div className="bladder-urology-page -mx-4 -mb-4 min-h-[calc(100dvh-8.5rem)] space-y-4 px-4 py-4 md:-mx-6 md:-mb-6 md:px-6 md:py-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("physiology")}
          className={btn(tab === "physiology")}
          data-active={tab === "physiology" ? "true" : "false"}
          aria-pressed={tab === "physiology"}
        >
          Bladder Control — Physiology
        </button>
        <button
          type="button"
          onClick={() => setTab("dosing")}
          className={btn(tab === "dosing")}
          data-active={tab === "dosing" ? "true" : "false"}
          aria-pressed={tab === "dosing"}
        >
          Bladder/Urology Dosages
        </button>
      </div>

      {tab === "physiology" && (
        <div className="space-y-4">
          <div className="bladder-card rounded-xl border-2 p-3">
            <p className="font-handwritten">
              <Doodle>Storage vs voiding — who squeezes, who relaxes,</Doodle>{" "}
              <UrineDoodle>and which nerve does what ★</UrineDoodle>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bladder-card bladder-card-store rounded-xl border-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                <h3 className="font-handwritten text-lg font-bold">
                  STORE (sympathetic)
                </h3>
              </div>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <UrineDoodle>Full bladder, storage phase →</UrineDoodle>{" "}
                  <strong>hypogastric nerve</strong> (T11–L2)
                </li>
                <li>
                  <strong>β-3 activation</strong> → relaxes the{" "}
                  <strong>detrusor</strong> (allows filling)
                </li>
                <li>
                  <strong>α-1 activation</strong> → contracts the{" "}
                  <strong>bladder neck</strong> (smooth muscle, keeps
                  continence)
                </li>
              </ul>
            </div>

            <div className="bladder-card bladder-card-void rounded-xl border-2 p-4">
              <div className="mb-2 flex items-center gap-2">
                <HeartPulse className="h-5 w-5" />
                <h3 className="font-handwritten text-lg font-bold">
                  VOID (parasympathetic)
                </h3>
              </div>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <Doodle>Emptying bladder →</Doodle>{" "}
                  <strong>pelvic nerves</strong> (S2–S4)
                </li>
                <li>
                  <strong>M3 activation</strong> → contracts the{" "}
                  <strong>detrusor</strong> (squeezes urine out)
                </li>
                <li>
                  <Doodle>Reduced sympathetic input →</Doodle> bladder neck{" "}
                  <strong>relaxes</strong>, allowing urine flow
                </li>
              </ul>
            </div>
          </div>

          <div className="bladder-card bladder-card-sphincter rounded-xl border-2 p-4">
            <h3 className="mb-2 font-handwritten text-lg font-bold">
              Voluntary control — external urethral sphincter
            </h3>
            <p className="text-sm">
              Somatic (voluntary) control of the{" "}
              <strong>external urethral sphincter</strong> is mediated by{" "}
              <strong>skeletal muscle</strong> through the{" "}
              <strong>pudendal nerve (S2–S4)</strong>.{" "}
              <Doodle>
                Pudendal "squeeze" beats detrusor "push" — until it doesn't,
                desu~ ★
              </Doodle>
            </p>
          </div>

          <div className="bladder-card rounded-xl border-2 p-4">
            <h3 className="mb-2 font-handwritten text-lg font-bold">
              Drug targets on the same map
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <strong>Antimuscarinics (oxybutynin)</strong> — block M3 in the
                storage phase → fewer detrusor overactivity contractions (urge,
                frequency)
              </li>
              <li>
                <strong>β-3 agonist (mirabegron)</strong> — boost storage :
                relaxes detrusor without the anticholinergic dry-mouth/brain-fog
                baggage
              </li>
              <li>
                <strong>α-1 blocker (tamsulosin)</strong> — relaxes bladder neck
                + prostatic smooth muscle → better emptying in BPH/LUTS
              </li>
              <li>
                <strong>Cholinergic (bethanechol)</strong> — muscarinic agonist
                → contracts detrusor, used (carefully!) in{" "}
                <em>non-obstructive</em> retention
              </li>
            </ul>
          </div>

          <div className="mx-auto max-w-lg space-y-4">
            <ZoomableImage
              src="/images/bladder-control.jpg"
              alt="Bladder control infographic: STORE panel (sympathetic, hypogastric T11-L2, beta-3 relaxes detrusor, alpha-1 contracts bladder neck) versus VOID panel (parasympathetic, pelvic S2-S4, M3 contracts detrusor); external urethral sphincter under somatic pudendal S2-S4 control"
              className="w-full rounded-xl border"
            />
            <p className="mt-2 text-center font-handwritten text-xs">
              Storage versus voiding phases — tap to zoom
            </p>
          </div>
        </div>
      )}

      {tab === "dosing" && (
        <div className="space-y-4">
          <div className="bladder-card rounded-xl border-2 p-3">
            <p className="flex items-start gap-2 font-handwritten">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                For adults, typical oral dosing is: mirabegron 25–50 mg once
                daily, oxybutynin 5 mg 2–3 times daily (IR) or 5–10 mg once
                daily (ER), bethanechol 10–50 mg 3–4 times daily for
                nonobstructive urinary retention, and tamsulosin 0.4 mg once
                daily for BPH. These are starting/reference doses; titrate to
                response and tolerability, and verify the indication —
                especially before using bethanechol.[1][2][3][4]
              </span>
            </p>
          </div>

          <div className="mx-auto max-w-lg space-y-4">
            <ZoomableImage
              src="/images/bladder-pharmacology.jpg"
              alt="Bladder pharmacology infographic: improve storage — mirabegron beta-3 agonist relaxes detrusor, oxybutynin muscarinic antagonist reduces detrusor contractions (overactive bladder); improve emptying — bethanechol muscarinic agonist contracts detrusor for nonobstructive urinary retention (contraindicated in mechanical obstruction), tamsulosin alpha-1 blocker relaxes bladder neck and prostate for BPH urinary symptoms"
              className="w-full rounded-xl border"
            />
            <p className="mt-2 text-center font-handwritten text-xs">
              Drug classes mapped to storage versus emptying — tap to zoom
            </p>
          </div>

          <div className="bladder-card rounded-xl border-2 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Pill className="h-5 w-5" />
              <h3 className="font-handwritten text-lg font-bold">
                Typical adult doses
              </h3>
            </div>
            <MedTable
              headers={["Drug", "Typical adult dose", "Chief indication"]}
              rows={[
                [
                  "Mirabegron",
                  "25–50 mg once daily",
                  "Overactive bladder (β-3 agonist)",
                ],
                [
                  "Oxybutynin (IR)",
                  "5 mg 2–3 times daily",
                  "Overactive bladder (antimuscarinic)",
                ],
                [
                  "Oxybutynin (ER)",
                  "5–10 mg once daily",
                  "Overactive bladder (antimuscarinic)",
                ],
                [
                  "Bethanechol",
                  "10–50 mg 3–4 times daily",
                  "Nonobstructive urinary retention",
                ],
                [
                  "Tamsulosin",
                  "0.4 mg once daily",
                  "BPH / LUTS (α-1 blocker)",
                ],
              ]}
            />
          </div>

          <div className="bladder-card rounded-xl border-2 p-4">
            <h3 className="mb-2 font-handwritten text-lg font-bold">
              Practical starting points
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <strong>Overactive bladder:</strong> Mirabegron 25 mg daily, or
                oxybutynin ER 5 mg daily; reassess at 4–8 weeks before
                escalating.[1][2]
              </li>
              <li>
                <strong>Oxybutynin IR:</strong> A conservative start in older or
                frail patients is 2.5 mg twice daily if available, then 5 mg
                twice daily if tolerated; the labelled adult regimen is 5 mg 2–3
                times daily.[6]
              </li>
              <li>
                <strong>Underactive bladder/retention:</strong> Confirm absence
                of obstruction and consider post-void residual measurement
                before bethanechol; it is not a substitute for catheterisation
                when retention is obstructive or complete.[3][8]
              </li>
              <li>
                <strong>BPH/LUTS:</strong> Tamsulosin 0.4 mg after a meal; do
                not increase to 0.8 mg until at least 2–4 weeks have
                elapsed.[4][9]
              </li>
            </ul>
          </div>

          <div className="bladder-card bladder-card-caution rounded-xl border-2 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-handwritten text-lg font-bold">
                Combination caution
              </h3>
            </div>
            <p className="text-sm">
              Mirabegron and oxybutynin may be combined for refractory
              overactive bladder, but the mirabegron label advises caution with
              muscarinic antagonists and clinically significant bladder outlet
              obstruction because of urinary-retention risk. If tamsulosin is
              being used with an anticholinergic or bethanechol, reassess the
              voiding pattern and post-void residual, particularly if there is
              suspected outlet obstruction.[3][5]
            </p>
          </div>

          <div className="bladder-card rounded-xl border-2 p-3">
            <p className="font-handwritten text-xs">
              <Doodle>
                Dosing summary compiled from the referenced labels/guidance;
                always titrate to response and tolerability, desu~ ★
              </Doodle>
            </p>
          </div>
        </div>
      )}

      <div className="bladder-card rounded-xl border-2 p-3 text-center">
        <Link
          to="/"
          className="font-handwritten text-sm underline decoration-dotted"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
}
