import { supabase } from "@/integrations/supabase/client";

export type AiProvider = "openai" | "gemini" | "anthropic" | "compatible";
export type AiMessage = { role: "system" | "user" | "assistant"; content: string };
export type AiSettings = { provider: AiProvider; apiKey: string; model: string; baseUrl: string };

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  anthropic: "Anthropic Claude",
  compatible: "OpenAI-compatible",
};

export const MODEL_PLACEHOLDERS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  anthropic: "claude-3-5-haiku-latest",
  compatible: "e.g. llama-3.1-70b",
};

// The key stays on this device only; it is sent per request and never saved on our servers.
const STORAGE_KEY = "clinical-tools-ai-byok";
export const AI_SETTINGS_EVENT = "ai-settings-changed";

export const CLINICAL_SYSTEM_PROMPT =
  "You are a clinical reference assistant for qualified healthcare professionals using the Clinical Tools app. " +
  "Answer concisely with guideline-based information and name the guideline where relevant. " +
  "You do not diagnose or replace clinical judgement; remind the user to verify doses and decisions locally. " +
  "Never ask for or repeat patient-identifying information.";

export function loadAiSettings(): AiSettings | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AiSettings>;
    if (!value.provider || !value.apiKey) return null;
    return { provider: value.provider, apiKey: value.apiKey, model: value.model ?? "", baseUrl: value.baseUrl ?? "" };
  } catch {
    return null;
  }
}

export function saveAiSettings(settings: AiSettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(AI_SETTINGS_EVENT));
}

export function clearAiSettings() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AI_SETTINGS_EVENT));
}

export async function askAi(messages: AiMessage[], settings = loadAiSettings()): Promise<string> {
  if (!settings) throw new Error("Add your AI key in Settings first.");
  const { data, error } = await supabase.functions.invoke("ai-proxy", {
    body: { ...settings, baseUrl: settings.baseUrl || undefined, messages: [{ role: "system", content: CLINICAL_SYSTEM_PROMPT }, ...messages] },
  });
  if (error) {
    let message = "The AI request failed.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error && typeof body.error === "string") message = body.error;
    } catch {
      /* keep generic message */
    }
    if (message === "Sign in required" || message === "Invalid or expired session") message = "Sign in to use the AI assistant.";
    throw new Error(message);
  }
  if (!data?.reply) throw new Error("The AI provider returned an empty reply.");
  return data.reply as string;
}
