import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { askAi, loadAiSettings, AI_SETTINGS_EVENT, PROVIDER_LABELS, type AiMessage } from "@/lib/ai/byok";

export const OPEN_AI_ASSISTANT_EVENT = "open-ai-assistant";

/** Opens the assistant; with `prompt`, sends it immediately (used by "Explain with AI"). */
export function openAiAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_AI_ASSISTANT_EVENT, { detail: { prompt } }));
}

export function explainResultsPrompt(label: string, text: string) {
  return `Explain these "${label}" results from a clinical calculator in plain clinical language: what they mean, key thresholds, and suggested next steps to consider.\n\n${text.slice(0, 12000)}`;
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(loadAiSettings);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next: AiMessage[] = [...messagesRef.current, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setError(null);
    setBusy(true);
    try {
      const reply = await askAi(next.slice(-20));
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The AI request failed.");
    } finally {
      setBusy(false);
    }
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    const onOpen = (event: Event) => {
      setOpen(true);
      const current = loadAiSettings();
      setSettings(current);
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt && current) void sendRef.current(prompt);
    };
    const onSettings = () => setSettings(loadAiSettings());
    window.addEventListener(OPEN_AI_ASSISTANT_EVENT, onOpen);
    window.addEventListener(AI_SETTINGS_EVENT, onSettings);
    return () => {
      window.removeEventListener(OPEN_AI_ASSISTANT_EVENT, onOpen);
      window.removeEventListener(AI_SETTINGS_EVENT, onSettings);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label="Open AI assistant"
        title="AI assistant"
        onClick={() => openAiAssistant()}
      >
        <Bot className="h-4 w-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> AI assistant</SheetTitle>
            <SheetDescription>
              {settings
                ? `Using your ${PROVIDER_LABELS[settings.provider]} key. For reference only — verify every answer.`
                : "Add your own AI key to start."}
            </SheetDescription>
          </SheetHeader>

          {!settings ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>The assistant uses your own OpenAI, Gemini, Claude or compatible key. It stays on this device.</p>
              <Button asChild onClick={() => setOpen(false)}>
                <Link to="/settings#ai-key">Add your AI key</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Ask a clinical question, or use "Explain with AI" under any calculator result. Don't include patient names or identifiers.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user"
                        ? "ml-8 rounded-lg bg-primary p-3 text-sm text-primary-foreground whitespace-pre-wrap"
                        : "mr-4 rounded-lg border border-border bg-muted p-3 text-sm text-foreground whitespace-pre-wrap"
                    }
                  >
                    {m.content}
                  </div>
                ))}
                {busy && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                  </p>
                )}
                {error && (
                  <p role="alert" className="rounded-md border border-destructive bg-muted p-3 text-sm text-foreground">
                    {error}
                  </p>
                )}
                <div ref={endRef} />
              </div>
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(draft);
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask a question…"
                  aria-label="Message"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(draft);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={busy || !draft.trim()}>
                    <Send className="h-4 w-4" /> Send
                  </Button>
                  <Button type="button" variant="outline" disabled={busy || messages.length === 0} onClick={() => { setMessages([]); setError(null); }}>
                    <Trash2 className="h-4 w-4" /> Clear
                  </Button>
                </div>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
