CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  razorpay_plan_id text NOT NULL,
  razorpay_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'created',
  is_trial boolean NOT NULL DEFAULT false,
  current_start timestamptz,
  current_end timestamptz,
  charge_at timestamptz,
  short_url text,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON public.subscriptions(user_id, created_at DESC);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS subscriptions_touch_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_touch_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TABLE IF NOT EXISTS public.webhook_events (
  dedupe_key text PRIMARY KEY,
  razorpay_event_id text,
  event_type text,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  signature_present boolean NOT NULL DEFAULT false,
  signature_valid boolean NOT NULL DEFAULT false,
  outcome text NOT NULL DEFAULT 'no_change',
  detail text,
  http_status integer,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;