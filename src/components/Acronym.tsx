import { GlossaryTerm } from "@/components/GlossaryTerm";

interface AcronymProps {
  term: string;
  children?: React.ReactNode;
}

/**
 * Inline acronym with hover tooltip pulling from the shared glossary.
 * Falls back to plain text when the term isn't indexed.
 */
export function Acronym({ term, children }: AcronymProps) {
  return <GlossaryTerm term={term}>{children}</GlossaryTerm>;
}
