import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const USG_VISCERAL_FAT_ID = "usg-visceral-fat";
export const USG_VISCERAL_FAT_BMI_ID = "usg-visceral-fat-bmi";
export const USG_VISCERAL_FAT_TITLE = "USG visceral fat";

/** In-app search entry for the Body weight issues tab. */
export const USG_VISCERAL_FAT_SEARCH = {
  id: USG_VISCERAL_FAT_ID,
  label: USG_VISCERAL_FAT_TITLE,
  path: `/obesity/bmi-calculator#${USG_VISCERAL_FAT_ID}`,
  keywords: [
    "usg visceral fat",
    "ultrasound visceral fat",
    "vft",
    "visceral fat thickness",
    "intra-abdominal thickness",
    "vft to spine",
  ],
} as const;

const COLUMNS = ["Measurement on Report", "What It Measures", "Elevated Risk Threshold"] as const;

const ROWS: { measurement: string; measures: string; threshold: readonly string[] }[] = [
  {
    measurement: "Visceral Fat Thickness (VFT) / Intra-abdominal Thickness",
    measures:
      "Distance from the inner abdominal muscle wall (linea alba) to the front wall of the abdominal aorta.",
    threshold: ["Men: ≥ 47 mm (4.7 cm)", "Women: ≥ 35.5 mm (3.55 cm)"],
  },
  {
    measurement: "VFT to spine (back of aorta)",
    measures: "Distance to the spine (back of aorta).",
    threshold: ["> 10 cm indicates very high metabolic risk"],
  },
];

const cellClass =
  "block min-w-0 py-1.5 align-top break-normal hyphens-none text-foreground sm:table-cell sm:px-3 sm:py-2.5";

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <td data-label={label} className={cellClass}>
      <span className="mb-0.5 block text-xs font-semibold text-muted-foreground sm:hidden">{label}</span>
      {children}
    </td>
  );
}

function VisceralFatTable() {
  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
      <table className="w-full border-collapse text-left text-sm sm:table-fixed">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b border-border">
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="min-w-0 px-3 py-2 text-left align-bottom font-semibold break-normal hyphens-none text-foreground"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr
              key={row.measurement}
              className="block border-b border-border py-2 last:border-b-0 sm:table-row sm:py-0"
            >
              <Cell label={COLUMNS[0]}>{row.measurement}</Cell>
              <Cell label={COLUMNS[1]}>{row.measures}</Cell>
              <Cell label={COLUMNS[2]}>
                {row.threshold.map((line) => (
                  <span key={line} className="block whitespace-normal break-normal hyphens-none">
                    {line}
                  </span>
                ))}
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type UsgVisceralFatProps = {
  id?: string;
  /** Sit in the BMI result column, using the same panel as the other result cards. */
  embedded?: boolean;
};

export default function UsgVisceralFat({
  id = USG_VISCERAL_FAT_ID,
  embedded = false,
}: UsgVisceralFatProps) {
  const headingId = `${id}-title`;
  const title = (
    <h3 id={headingId} className="text-base font-semibold tracking-tight text-foreground">
      {USG_VISCERAL_FAT_TITLE}
    </h3>
  );

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-28 min-w-0">
      {embedded ? (
        <div className="rounded-lg border border-border bg-card/50 p-4">
          {title}
          <div className="mt-3">
            <VisceralFatTable />
          </div>
        </div>
      ) : (
        <Card className="border-border bg-card text-card-foreground shadow-none">
          <CardHeader className="pb-2">{title}</CardHeader>
          <CardContent className="px-4 pb-4 sm:px-2 sm:pb-3">
            <VisceralFatTable />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
