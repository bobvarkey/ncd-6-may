-- Razorpay Subscriptions: subscription state, webhook dedup/ledger, admin seed.
-- Builds on 0000 (account-scoped) — never on migrations/0001_entitlements.sql,
-- which is the superseded device-keyed definition.

-- ---------------------------------------------------------------- subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Internal catalog id ('pro-monthly'), not the Razorpay plan id. The Razorpay
  -- id is stored alongside so the webhook can map back without a secrets read.
  plan_id text NOT NULL,
  razorpay_plan_id text NOT NULL,
  razorpay_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN (
    'created','authenticated','active','pending','halted','cancelled','completed','expired'
  )),
  is_trial boolean NOT NULL DEFAULT false,
  current_start timestamptz,
  current_end timestamptz,
  charge_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  short_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One live subscription per user per plan. Cancelled/completed/expired rows are
-- excluded, so a user may resubscribe after a lapse without a uniqueness clash.
CREATE UNIQUE INDEX subscriptions_one_live_per_plan
  ON public.subscriptions (user_id, plan_id)
  WHERE status IN ('created','authenticated','active','pending');

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions (user_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- --------------------------------------------------------------- webhook_events
-- Dedup key is derived from SIGNED body content only. The X-Razorpay-Event-Id
-- header is NOT covered by the signature, so it is stored for correlation and
-- deliberately not made unique.
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  razorpay_event_id text,
  event_type text,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  signature_present boolean NOT NULL DEFAULT false,
  signature_valid boolean NOT NULL DEFAULT false,
  outcome text NOT NULL CHECK (outcome IN (
    'granted','renewed','no_change','duplicate','rejected_signature',
    'secret_missing','invalid_json','unhandled_event','unknown_subscription','error'
  )),
  detail text,
  http_status integer,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX webhook_events_received_at_idx ON public.webhook_events (received_at DESC);

-- Deny-all, same posture as payment_events: service role only.
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to webhook events" ON public.webhook_events
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- ------------------------------------------------------------------- admin seed
-- The bootstrap administrator. Grants exactly one auth user id the admin role, so
-- the admin-only developer-grant action has a legitimate first caller. This is not
-- an email allowlist and cannot be self-served from the browser.
INSERT INTO public.user_roles (user_id, role)
VALUES ('5ebbd491-44d9-4836-9c13-be922c1ffbfc'::uuid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
