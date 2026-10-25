import { useState } from "react";
import { Bot, KeyRound, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  askAi, clearAiSettings, loadAiSettings, saveAiSettings,
  MODEL_PLACEHOLDERS, PROVIDER_LABELS, type AiProvider, type AiSettings,
} from "@/lib/ai/byok";

const PROVIDERS = Object.keys(PROVIDER_LABELS) as AiProvider[];

export default function AiKeySettings() {
  const saved = loadAiSettings();
  const [provider, setProvider] = useState<AiProvider>(saved?.provider ?? "openai");
  const [apiKey, setApiKey] = useState(saved?.apiKey ?? "");
  const [model, setModel] = useState(saved?.model ?? "");
  const [baseUrl, setBaseUrl] = useState(saved?.baseUrl ?? "");
  const [hasSaved, setHasSaved] = useState(Boolean(saved));
  const [testing, setTesting] = useState(false);

  const current = (): AiSettings | null => {
    if (apiKey.trim().length < 8) {
      toast.error("Enter your API key");
      return null;
    }
    if (provider === "compatible" && !baseUrl.trim().startsWith("https://")) {
      toast.error("Enter an https base URL, e.g. https://api.groq.com/openai/v1");
      return null;
    }
    if (provider === "compatible" && !model.trim()) {
      toast.error("Enter a model name");
      return null;
    }
    return { provider, apiKey: apiKey.trim(), model: model.trim(), baseUrl: provider === "compatible" ? baseUrl.trim() : "" };
  };

  return (
    <Card id="ai-key">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5" aria-hidden /> AI assistant — your own key
        </CardTitle>
        <CardDescription>
          Use your own OpenAI, Gemini, Claude or OpenAI-compatible key for the AI assistant and "Explain with AI".
          Your key is saved only on this device and sent securely with each request; we never store it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-provider">Provider</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as AiProvider)}>
            <SelectTrigger id="ai-provider"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-key-input">API key</Label>
          <Input id="ai-key-input" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste your key" />
        </div>
        {provider === "compatible" && (
          <div className="space-y-2">
            <Label htmlFor="ai-base-url">Base URL</Label>
            <Input id="ai-base-url" type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.groq.com/openai/v1" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="ai-model">Model {provider !== "compatible" && <span className="text-muted-foreground">(optional)</span>}</Label>
          <Input id="ai-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={MODEL_PLACEHOLDERS[provider]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => {
            const s = current();
            if (!s) return;
            saveAiSettings(s);
            setHasSaved(true);
            toast.success("AI key saved on this device");
          }}>
            <KeyRound className="h-4 w-4" /> Save key
          </Button>
          <Button type="button" variant="outline" disabled={testing} onClick={async () => {
            const s = current();
            if (!s) return;
            setTesting(true);
            try {
              await askAi([{ role: "user", content: "Reply with the single word: ready" }], s);
              toast.success("Connection works");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Connection failed");
            } finally {
              setTesting(false);
            }
          }}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} Test connection
          </Button>
          {hasSaved && (
            <Button type="button" variant="ghost" onClick={() => {
              clearAiSettings();
              setApiKey("");
              setHasSaved(false);
              toast.success("AI key removed from this device");
            }}>
              <Trash2 className="h-4 w-4" /> Remove key
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
