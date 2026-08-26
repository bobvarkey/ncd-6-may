import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { GLOSSARY } from "@/data/glossary";
import { GlossaryTerm } from "@/components/GlossaryTerm";

export default function GlossaryPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) document.getElementById(`glossary-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/home" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <header className="mb-8 flex items-center gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3"><BookOpen className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-serif font-semibold">Clinical Glossary</h1>
            <p className="text-muted-foreground">Definitions and synonyms for terms used across the clinical sections.</p>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(GLOSSARY).map((entry) => (
            <article id={`glossary-${entry.term}`} key={entry.term} className="scroll-mt-16 rounded-lg border bg-card p-4">
              <h2 className="text-sm font-semibold"><GlossaryTerm term={entry.term}>{entry.term}</GlossaryTerm></h2>
              <p className="mt-1 text-sm">{entry.full}</p>
              {entry.description && <p className="mt-2 text-xs text-muted-foreground">{entry.description}</p>}
              {entry.synonyms?.length ? <p className="mt-2 text-xs text-muted-foreground">Also known as: {entry.synonyms.join(", ")}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
