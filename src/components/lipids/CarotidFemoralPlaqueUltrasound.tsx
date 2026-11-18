import { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

export const CAROTID_FEMORAL_PLAQUE_ULTRASOUND_ID = "carotid-femoral-plaque-ultrasound";
export const CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SCREENING_ID =
  "carotid-femoral-plaque-ultrasound-screening";

export const CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE = "Carotid & femoral plaque ultrasound";

/** In-app search entry for the expanded copy on the Lipid Management Mini-App. */
export const CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SEARCH = {
  id: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_ID,
  label: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE,
  path: `/lipids#${CAROTID_FEMORAL_PLAQUE_ULTRASOUND_ID}`,
  keywords: [
    "mannheim consensus",
    "carotid plaque",
    "femoral plaque",
    "plaque ultrasound",
    "carotid ultrasound",
    "femoral ultrasound",
    "segmental plaque score",
    "subclinical atherosclerosis",
    "imt",
    "react",
  ],
} as const;

const CLOSING_SENTENCE =
  "Extended to include femoral segments. Scores of 0 (none), 1 (mild), and ≥2–3 (moderate/higher burden) have been linked to cardiovascular events in studies such as Rotterdam. This is semi-quantitative and easy to report";

function PlaqueUltrasoundBody() {
  return (
    <div className="mt-2 min-w-0 space-y-3 break-words text-sm leading-relaxed text-foreground">
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Scanning protocol:
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Carotids (bilateral): Longitudinal and transverse views covering the common carotid artery (CCA) from low in the neck through the bulb/bifurcation and the proximal internal carotid artery (ICA). Far-wall imaging is preferred for clarity.
            </li>
            <li>
              Femorals (bilateral): Common femoral artery from the inguinal region through the bifurcation into the superficial and deep femoral arteries, and the proximal segments.
            </li>
          </ul>
        </li>
        <li>
          Optimize gain so the lumen is black and wall interfaces (lumen-intima and media-adventitia) are sharp. Color and spectral Doppler are added if stenosis is present or to map flow around plaques. The exam is non-invasive, relatively quick, and well tolerated.
        </li>
      </ul>

      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">Plaque Definition (Mannheim Consensus)</h4>
        <p>A plaque is a focal structure that:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Protrudes into the lumen by ≥0.5 mm, or</li>
          <li>Exceeds 50% of the surrounding intima-media thickness (IMT), or</li>
          <li>
            Has a thickness ≥1.5 mm measured from the media-adventitia interface to the intima-lumen interface.
          </li>
        </ul>
        <p>
          This is the definition used in REACT and many other studies. Diffuse thickening without a focal protrusion is generally classified separately (or as elevated IMT if ≥1.5 mm).
        </p>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-foreground">Scoring and Quantification Approaches</h4>
        <p>Several methods are used, ranging from simple to quantitative:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Presence/absence (binary) Any plaque in the carotid or femoral territories counts as peripheral atherosclerosis. This was the primary definition of silent atherosclerosis in REACT (combined with coronary imaging). Carotid imaging has the highest single-territory yield, but adding the femoral arteries detects additional cases (roughly 18% of people with atherosclerosis have femoral-only disease).
          </li>
          <li>
            Segmental plaque score Count the number of arterial segments containing plaque. Common examples:
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Carotids only: 0–6 (right and left CCA, bulb, and ICA).</li>
              <li>{CLOSING_SENTENCE}</li>
            </ul>
          </li>
        </ol>
      </div>
    </div>
  );
}

type Props = {
  id: string;
  /** Second, adjacent copy: heading stays visible and the body starts closed. */
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export default function CarotidFemoralPlaqueUltrasound({
  id,
  collapsible = false,
  defaultOpen = false,
}: Props) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [id]);

  const headingId = `${id}-title`;
  const heading = (
    <h3 id={headingId} className="min-w-0 flex-1 text-sm font-semibold text-foreground">
      {CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE}
    </h3>
  );

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-28 w-full min-w-0 rounded-lg border border-border bg-muted/20 p-3"
    >
      {collapsible ? (
        <CollapsiblePrimitive.Root defaultOpen={defaultOpen}>
          <CollapsiblePrimitive.Trigger className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180">
            {heading}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform" aria-hidden="true" />
          </CollapsiblePrimitive.Trigger>
          <CollapsiblePrimitive.Content>
            <PlaqueUltrasoundBody />
          </CollapsiblePrimitive.Content>
        </CollapsiblePrimitive.Root>
      ) : (
        <>
          {heading}
          <PlaqueUltrasoundBody />
        </>
      )}
    </section>
  );
}
