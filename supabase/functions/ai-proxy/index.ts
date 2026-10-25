import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { buildProviderRequest, extractReply, providerErrorMessage } from "../_shared/ai-proxy-logic.ts";

const BodySchema = z.object({
  provider: z.enum(["openai", "gemini", "anthropic", "compatible"]),
  apiKey: z.string().min(8).max(512),
  model: z.string().max(120).default(""),
  baseUrl: z.string().max(300).optional(),
  messages: z
    .array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(20000) }))
    .min(1)
    .max(40),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);
  const authClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid or expired session" }, 401);

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request", fields: parsed.error.flatten().fieldErrors }, 400);
  const { provider, apiKey, model, baseUrl, messages } = parsed.data;

  let request;
  try {
    request = buildProviderRequest(provider, apiKey, model, messages, baseUrl);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Invalid AI settings" }, 400);
  }

  try {
    const res = await fetch(request.url, { ...request.init, redirect: "error", signal: AbortSignal.timeout(60000) });
    const data = await res.json().catch(() => null);
    if (!res.ok) return json({ error: providerErrorMessage(res.status, data) }, 502);
    return json({ reply: extractReply(provider, data) });
  } catch (e) {
    // Never include request details: the key lives in the headers.
    console.error("ai-proxy provider call failed", provider, e instanceof Error ? e.name : "error");
    return json({ error: "Could not reach the AI provider. Try again." }, 502);
  }
});
