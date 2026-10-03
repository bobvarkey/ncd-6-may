import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";
import { preflight, errRes, jsonRes } from "../_shared/payment-helpers.ts";
import {
  createSubscription, verifySubscription, cancelSubscription, billingStatus,
} from "../_shared/subscription-logic.ts";
import { handlePaymentApi, type PaymentApiDeps } from "../_shared/payment-api-logic.ts";

const BodySchema = z.object({
  action: z.enum([
    "access-status", "create-subscription", "verify-subscription",
    "cancel-subscription", "billing-status", "grant-developer",
  ]),
  planId: z.string().max(80).optional(),
  trial: z.boolean().optional(),
  razorpay_payment_id: z.string().max(120).optional(),
  razorpay_subscription_id: z.string().max(120).optional(),
  razorpay_signature: z.string().max(256).optional(),
  userId: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== "POST") return errRes(405, "POST only");

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return errRes(401, "Sign in required");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return errRes(401, "Invalid or expired session");
  const userId = userData.user.id;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return jsonRes({ error: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;
  const admin = createClient(supabaseUrl, serviceKey);

  const deps: PaymentApiDeps = {
    readRoles: async (id) => {
      const { data } = await admin.from("user_roles").select("role").eq("user_id", id);
      return (data || []).map((r) => r.role as string);
    },
    readAccess: async (id) => {
      const [{ data: trial }, { data: entitlements }] = await Promise.all([
        admin.from("user_trials").select("started_at,ends_at").eq("user_id", id).maybeSingle(),
        admin.from("entitlements").select("plan_id,status,valid_until").eq("user_id", id).eq("status", "active").order("valid_until", { ascending: false }).limit(1),
      ]);
      return { trial: trial ?? null, entitlement: entitlements?.[0] ?? null };
    },
    upsertProfile: async (id) => { await admin.from("profiles").upsert({ id }); },
    grantDeveloperRole: async (id) =>
      admin.from("user_roles").upsert({ user_id: id, role: "developer" }, { onConflict: "user_id,role" }),
    createSubscription,
    verifySubscription,
    cancelSubscription,
    billingStatus,
  };

  return handlePaymentApi(body, userId, req, deps);
});
