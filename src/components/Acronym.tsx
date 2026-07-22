import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { lookupGlossary } from "@/data/glossary";

interface AcronymProps {
  term: string;
  children?: React.ReactNode;
}

/**
 * Inline acronym with hover tooltip pulling from the shared glossary.
 * Falls back to plain text when the term isn't indexed.
 */
export function Acronym({ term, children }: AcronymProps) {
  const entry = lookupGlossary(term);
  if (!entry) return <>{children ?? term}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <abbr
          title={entry.full}
          className="cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-2 no-underline-hover"
          aria-label={`${entry.term}: ${entry.full}`}
        >
          {children ?? entry.term}
        </abbr>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        <div className="font-medium">{entry.full}</div>
        {entry.description && (
          <div className="mt-1 text-xs text-muted-foreground">{entry.description}</div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
