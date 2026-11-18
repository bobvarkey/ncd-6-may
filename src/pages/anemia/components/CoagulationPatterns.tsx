import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import ZoomableImage from "@/components/ZoomableImage";
import coagulationPatternsImg from "@/assets/coagulation-patterns-pt-aptt.jpg";
import {
  COAGULATION_BANNER,
  COAGULATION_CONTEXT,
  COAGULATION_PANELS,
  COAGULATION_PATTERNS_ALT,
  COAGULATION_PATTERNS_HASH,
  COAGULATION_PATTERNS_HEADER,
  COAGULATION_PATTERNS_TITLE,
  COAGULATION_WARNING,
  LABORATORY_TRAPS,
  LABORATORY_TRAPS_HEADING,
} from "./coagulationPatterns";

const PANEL_BORDER = [
  "border-purple-500/30",
  "border-amber-500/30",
  "border-sky-500/30",
  "border-emerald-500/30",
] as const;

export default function CoagulationPatterns() {
  useEffect(() => {
    if (window.location.hash !== `#${COAGULATION_PATTERNS_HASH}`) return;
    document.getElementById(COAGULATION_PATTERNS_HASH)?.scrollIntoView({ block: "start" });
  }, []);

  return (
    <section
      id={COAGULATION_PATTERNS_HASH}
      aria-labelledby="coagulation-patterns-heading"
      className="scroll-mt-56 space-y-3"
    >
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 id="coagulation-patterns-heading" className="font-display text-base font-bold text-foreground">
          {COAGULATION_PATTERNS_TITLE}
        </h2>

        <ZoomableImage
          src={coagulationPatternsImg}
          alt={COAGULATION_PATTERNS_ALT}
          className="h-auto w-full rounded-lg border border-border object-contain"
          caption="Tap to enlarge"
        />

        <div className="space-y-3">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">{COAGULATION_PATTERNS_HEADER[0]}</h3>
            <p className="text-sm font-semibold text-foreground">{COAGULATION_PATTERNS_HEADER[1]}</p>
            <p className="text-sm font-semibold text-foreground">{COAGULATION_PATTERNS_HEADER[2]}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {COAGULATION_PANELS.map((panel, index) => (
              <article key={panel.title} className={`space-y-2 rounded-lg border bg-background p-3 ${PANEL_BORDER[index]}`}>
                <h4 className="text-sm font-bold text-foreground">{panel.title}</h4>
                {"think" in panel && <p className="text-sm leading-relaxed text-foreground">{panel.think}</p>}
                {"possibilitiesLabel" in panel && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{panel.possibilitiesLabel}</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
                      {panel.possibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {"remember" in panel && <p className="text-sm leading-relaxed text-foreground">{panel.remember}</p>}
                {"consider" in panel && <p className="text-sm leading-relaxed text-foreground">{panel.consider}</p>}
                {"pearl" in panel && <p className="text-sm leading-relaxed text-foreground">{panel.pearl}</p>}
              </article>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-sm font-bold text-foreground">{LABORATORY_TRAPS_HEADING}</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-foreground">
              {LABORATORY_TRAPS.map((trap) => (
                <li key={trap}>{trap}</li>
              ))}
            </ol>
          </div>

          <p className="rounded-md bg-amber-400 px-3 py-2 text-center text-sm font-bold text-black">
            {COAGULATION_BANNER}
          </p>
          <p className="text-center text-sm font-semibold text-foreground">{COAGULATION_CONTEXT}</p>

          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2" role="note">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">{COAGULATION_WARNING}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
