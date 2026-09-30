import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";
import { createOrder } from "../_shared/create-order-logic.ts";
import { verifyPayment } from "../_shared/verify-payment-logic.ts";

const BodySchema = z.object({
  action: z.enum(["access-status", "start-trial", "create-order", "verify-payment"]),
  planId: z.string().max(80).optional(),
  razorpay_order_id: z.string().max(120).optional(),
  razorpay_payment_id: z.string().max(120).optional(),
  razorpay_signature: z.string().max(256).optional(),
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid or expired session" }, 401);
  const userId = userData.user.id;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;
  const admin = createClient(supabaseUrl, serviceKey);

  if (body.action === "access-status" || body.action === "start-trial") {
    if (body.action === "start-trial") {
      const endsAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
      const { error } = await admin.from("user_trials").insert({ user_id: userId, ends_at: endsAt });
      if (error && error.code !== "23505") return json({ error: "Unable to start trial" }, 500);
    }
    const [{ data: trial }, { data: entitlements }, { data: roles }] = await Promise.all([
      admin.from("user_trials").select("started_at,ends_at").eq("user_id", userId).maybeSingle(),
      admin.from("entitlements").select("plan_id,status,valid_until").eq("user_id", userId).order("valid_until", { ascending: false }).limit(1),
      admin.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const roleNames = (roles || []).map((entry) => entry.role);
    const role = roleNames.includes("admin") ? "admin" : roleNames.includes("developer") ? "developer" : "user";
    const entitlement = entitlements?.[0] || null;
    const trialActive = Boolean(trial?.ends_at && new Date(trial.ends_at).getTime() > Date.now());
    const paidActive = Boolean(entitlement?.status === "active" && new Date(entitlement.valid_until).getTime() > Date.now());
    return json({
      access: role !== "user" || trialActive || paidActive,
      role,
      trialStartedAt: trial?.started_at || null,
      trialEndsAt: trial?.ends_at || null,
      planId: entitlement?.plan_id || null,
      status: entitlement?.status || null,
      validUntil: entitlement?.valid_until || null,
    });
  }

  const forwarded = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ ...body, userId }),
  });
  if (body.action === "create-order") return createOrder(forwarded, userId);
  return verifyPayment(forwarded, userId);
});