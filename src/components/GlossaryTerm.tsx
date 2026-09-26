import { useState } from "react";
import { lookupGlossary } from "@/data/glossary";

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
  className?: string;
}

export function GlossaryTerm({ term, children, className = "" }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const entry = lookupGlossary(term);

  if (!entry) return <>{children ?? term}</>;

  return (
    <span className={`relative inline ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="text-primary underline decoration-dotted underline-offset-2 hover:text-primary/80"
        aria-expanded={open}
        aria-label={`Show definition for ${entry.term}`}
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-20 mt-1 block w-64 rounded-md border border-border bg-popover p-3 text-left text-xs text-popover-foreground shadow-lg">
          <span className="block font-semibold">{entry.full}</span>
          {entry.description && <span className="mt-1 block text-muted-foreground">{entry.description}</span>}
          {entry.synonyms?.length ? (
            <span className="mt-1 block text-muted-foreground">Also known as: {entry.synonyms.join(", ")}</span>
          ) : null}
        </span>
      )}
    </span>
  );
}
