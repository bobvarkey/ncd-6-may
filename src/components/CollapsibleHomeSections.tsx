import type { ComponentType, ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useOpenSections } from "@/hooks/useOpenSections";
import { ENTRY_TONES, type EntryTone } from "@/lib/entry-tones";
import { cn } from "@/lib/utils";

export type CollapsibleHomeSection = {
  id: string;
  label: string;
  tone: EntryTone;
  icon?: ComponentType<{ className?: string }>;
};

export function CollapsibleHomeSections<T extends CollapsibleHomeSection>({
  storageKey,
  sections,
  renderItems,
  className,
}: {
  storageKey: string;
  sections: readonly T[];
  renderItems: (section: T) => ReactNode;
  className?: string;
}) {
  const { value, onValueChange } = useOpenSections(
    storageKey,
    sections.map((section) => section.id),
  );

  return (
    <Accordion
      type="multiple"
      value={value}
      onValueChange={onValueChange}
      className={cn("space-y-6", className)}
    >
      {sections.map((section) => {
        const tone = ENTRY_TONES[section.tone];
        const Icon = section.icon;
        return (
          <AccordionItem key={section.id} value={section.id} className="border-none">
            <AccordionTrigger
              className={cn(
                "group/section min-h-11 min-w-0 gap-2 justify-start rounded-lg py-2.5 px-1",
                "hover:no-underline hover:bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "[&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-muted-foreground",
              )}
            >
              <span
                className={cn("w-1.5 self-stretch min-h-5 rounded-full shrink-0", tone.bar)}
                aria-hidden
              />
              {Icon ? (
                <span
                  className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                    tone.iconWrap,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <span className="min-w-0 text-sm font-semibold text-foreground/80 uppercase tracking-wider text-left">
                {section.label}
              </span>
              <span className="flex-1 h-px bg-border/60" aria-hidden />
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-1">
              {renderItems(section)}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
