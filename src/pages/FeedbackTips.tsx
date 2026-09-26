import { useState } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FeedbackEntry {
  id: string;
  template: string;
  message: string;
  timestamp: string;
}

const FeedbackTips = () => {
  const [template, setTemplate] = useState<string>("");
  const [freeText, setFreeText] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const templates = {
    bug: {
      label: "Bug report",
      seed: "Bug: [describe the issue]\nSteps to reproduce:\nExpected:\nActual:"
    },
    clinical: {
      label: "Clinical suggestion",
      seed: "Clinical Suggestion: [your suggestion]\nRationale:\nReference (optional):"
    },
    insulin: {
      label: "Insulin tip",
      seed: "Insulin Tip:\n[Type 1 / Type 2]\n[clinical tip or pitfall to share]:"
    }
  };

  const handleTemplateClick = (key: string) => {
    const seed = templates[key as keyof typeof templates].seed;
    setTemplate(key);
    setFreeText(seed);
  };

  const handleSubmit = () => {
    if (!freeText.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    const entry: FeedbackEntry = {
      id: Date.now().toString(),
      template: template || "general",
      message: freeText,
      timestamp: new Date().toISOString()
    };

    const existing = localStorage.getItem("dmo_feedback");
    const feedbackList: FeedbackEntry[] = existing ? JSON.parse(existing) : [];
    feedbackList.push(entry);
    localStorage.setItem("dmo_feedback", JSON.stringify(feedbackList));

    setSubmitted(true);
    toast.success("Thank you for your feedback!");

    setTimeout(() => {
      setTemplate("");
      setFreeText("");
      setSubmitted(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="space-y-6 animate-slide-in max-w-2xl mx-auto">
        <div className="rounded-xl p-8 text-center bg-success/10 border border-success/20">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-success mb-2">Thank You!</h2>
          <p className="text-sm text-muted-foreground mb-6">Your feedback helps us improve the clinical tools in Diabetes Med Optimizer.</p>
          <Button onClick={() => { setTemplate(""); setFreeText(""); setSubmitted(false); }}>
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in max-w-2xl mx-auto">
      {/* Hero Header */}
      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-center gap-3 mb-3">
          <MessageSquare className="w-6 h-6" />
          <h1 className="text-3xl font-heading font-bold">Feedback & Tips</h1>
        </div>
        <p className="text-sm text-primary-foreground/80">Anonymous. Share a bug, clinical suggestion, or insulin tip to help improve these tools.</p>
      </div>

      {/* Template Selection */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Choose a template (optional):</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {Object.entries(templates).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => handleTemplateClick(key)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-all border ${
                template === key
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-md"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Form */}
      <div className="clinical-card border border-border">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Your Feedback ({freeText.length} / 1000 characters)
            </label>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value.slice(0, 1000))}
              placeholder="Share a bug, clinical suggestion, or insulin tip..."
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {freeText.length > 0 ? "✓ Ready to submit" : "Enter your feedback above"}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!freeText.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-lg bg-info/10 border border-info/20">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-info">💡 Tip:</span> Common insulin pitfalls and Type 2 transition guidance are available in the T1D Pitfalls and T2D Transition pages. Share additional insights here!
        </p>
      </div>
    </div>
  );
};

export default FeedbackTips;
