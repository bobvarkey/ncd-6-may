CREATE TYPE public.app_role AS ENUM ('user', 'developer', 'admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TABLE public.user_trials (
  user_id uuid PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_trials TO authenticated;
GRANT ALL ON public.user_trials TO service_role;
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own trial" ON public.user_trials FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.payment_order_bindings (
  order_id text PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  plan_amount_paise integer NOT NULL CHECK (plan_amount_paise > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_order_bindings TO authenticated;
GRANT ALL ON public.payment_order_bindings TO service_role;
ALTER TABLE public.payment_order_bindings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payment orders" ON public.payment_order_bindings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX payment_order_bindings_user_id_idx ON public.payment_order_bindings(user_id);

CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  payment_id text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id),
  UNIQUE (payment_id)
);
GRANT SELECT ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own entitlements" ON public.entitlements FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX entitlements_user_id_idx ON public.entitlements(user_id);

CREATE TABLE public.payment_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  payment_id text,
  order_id text,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER entitlements_touch_updated_at BEFORE UPDATE ON public.entitlements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();