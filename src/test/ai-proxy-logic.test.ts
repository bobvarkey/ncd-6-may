import { describe, expect, it } from "vitest";
import { buildProviderRequest, extractReply, providerErrorMessage, validateBaseUrl } from "../../supabase/functions/_shared/ai-proxy-logic";

const msgs = [
  { role: "system" as const, content: "sys" },
  { role: "user" as const, content: "hi" },
];

describe("BYOK AI proxy", () => {
  it("sends the OpenAI key as a bearer token to OpenAI", () => {
    const r = buildProviderRequest("openai", "sk-test-123", "", msgs);
    expect(r.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(r.init.headers.Authorization).toBe("Bearer sk-test-123");
    expect(JSON.parse(r.init.body).model).toBe("gpt-4o-mini");
  });

  it("moves the system prompt to Anthropic's system field", () => {
    const r = buildProviderRequest("anthropic", "key-12345", "", msgs);
    const body = JSON.parse(r.init.body);
    expect(r.init.headers["x-api-key"]).toBe("key-12345");
    expect(body.system).toBe("sys");
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("sends Gemini keys in a header, not the URL", () => {
    const r = buildProviderRequest("gemini", "AIza-secret", "", msgs);
    expect(r.url).not.toContain("AIza-secret");
    expect(r.init.headers["x-goog-api-key"]).toBe("AIza-secret");
  });

  it("rejects non-https and internal compatible endpoints", () => {
    expect(() => validateBaseUrl("http://api.example.com/v1")).toThrow();
    expect(() => validateBaseUrl("https://localhost/v1")).toThrow();
    expect(() => validateBaseUrl("https://169.254.169.254/v1")).toThrow();
    expect(validateBaseUrl("https://api.groq.com/openai/v1/")).toBe("https://api.groq.com/openai/v1");
  });

  it("requires a model for OpenAI-compatible providers", () => {
    expect(() => buildProviderRequest("compatible", "k-123456", "", msgs, "https://api.groq.com/openai/v1")).toThrow();
  });

  it("reads replies from each provider shape", () => {
    expect(extractReply("openai", { choices: [{ message: { content: "a" } }] })).toBe("a");
    expect(extractReply("anthropic", { content: [{ type: "text", text: "b" }] })).toBe("b");
    expect(extractReply("gemini", { candidates: [{ content: { parts: [{ text: "c" }] } }] })).toBe("c");
  });

  it("explains a rejected key plainly", () => {
    expect(providerErrorMessage(401, {})).toMatch(/rejected your API key/);
  });
});
