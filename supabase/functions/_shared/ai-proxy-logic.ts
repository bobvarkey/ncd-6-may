// Pure request/response mapping for the bring-your-own-key AI proxy.
// No I/O here so it can be unit-tested; the user's key is never logged or stored.

export type AiProvider = "openai" | "gemini" | "anthropic" | "compatible";
export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export type ProviderRequest = { url: string; init: { method: "POST"; headers: Record<string, string>; body: string } };

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash",
  anthropic: "claude-3-5-haiku-latest",
  compatible: "",
};

export const MAX_OUTPUT_TOKENS = 1200;

/** Only public https endpoints may be called, so the proxy cannot reach internal hosts. */
export function validateBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Base URL is not a valid URL");
  }
  if (url.protocol !== "https:") throw new Error("Base URL must use https");
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(":") ||
    host.startsWith("[");
  if (blocked) throw new Error("Base URL must be a public hostname");
  return url.toString().replace(/\/+$/, "");
}

export function buildProviderRequest(
  provider: AiProvider,
  apiKey: string,
  model: string,
  messages: AiMessage[],
  baseUrl?: string,
): ProviderRequest {
  const chosen = model.trim() || DEFAULT_MODELS[provider];
  if (!chosen) throw new Error("A model name is required");
  const json = { "Content-Type": "application/json" };

  if (provider === "anthropic") {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    return {
      url: "https://api.anthropic.com/v1/messages",
      init: {
        method: "POST",
        headers: { ...json, "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: chosen,
          max_tokens: MAX_OUTPUT_TOKENS,
          ...(system ? { system } : {}),
          messages: messages.filter((m) => m.role !== "system"),
        }),
      },
    };
  }

  if (provider === "gemini") {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosen)}:generateContent`,
      init: {
        method: "POST",
        headers: { ...json, "x-goog-api-key": apiKey },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents: messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
        }),
      },
    };
  }

  const root = provider === "openai" ? "https://api.openai.com/v1" : validateBaseUrl(baseUrl ?? "");
  return {
    url: `${root}/chat/completions`,
    init: {
      method: "POST",
      headers: { ...json, Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: chosen, messages, max_tokens: MAX_OUTPUT_TOKENS }),
    },
  };
}

// deno-lint-ignore no-explicit-any
export function extractReply(provider: AiProvider, data: any): string {
  let text: unknown;
  if (provider === "anthropic") {
    text = Array.isArray(data?.content)
      ? data.content.filter((c: { type?: string }) => c?.type === "text").map((c: { text?: string }) => c.text ?? "").join("")
      : undefined;
  } else if (provider === "gemini") {
    text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  } else {
    text = data?.choices?.[0]?.message?.content;
  }
  if (typeof text !== "string" || !text.trim()) throw new Error("The AI provider returned an empty reply");
  return text;
}

/** Provider error text without echoing anything that could contain the key. */
// deno-lint-ignore no-explicit-any
export function providerErrorMessage(status: number, data: any): string {
  if (status === 401 || status === 403) return "The AI provider rejected your API key. Check it in Settings.";
  if (status === 429) return "The AI provider's rate limit or quota was reached. Try again later.";
  if (status === 404) return "The model was not found. Check the model name in Settings.";
  const msg = data?.error?.message ?? data?.error?.status ?? data?.message;
  return typeof msg === "string" ? `AI provider error (${status}): ${msg.slice(0, 200)}` : `AI provider error (${status})`;
}
