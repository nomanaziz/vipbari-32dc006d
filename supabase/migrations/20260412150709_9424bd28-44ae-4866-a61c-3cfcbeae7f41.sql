
-- =============================================
-- 1) assets table
-- =============================================
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  condition text NOT NULL DEFAULT 'good',
  location text DEFAULT '',
  floor integer DEFAULT 0,
  purchase_date date,
  document_url text,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own assets" ON public.assets FOR ALL
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all assets" ON public.assets FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2) asset_maintenance table
-- =============================================
CREATE TABLE public.asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  schedule_type text NOT NULL DEFAULT 'one_time',
  status text NOT NULL DEFAULT 'pending',
  amount numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own asset_maintenance" ON public.asset_maintenance FOR ALL
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all asset_maintenance" ON public.asset_maintenance FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 3) asset_issues table
-- =============================================
CREATE TABLE public.asset_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  reported_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own asset_issues" ON public.asset_issues FOR ALL
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all asset_issues" ON public.asset_issues FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenants can report issues" ON public.asset_issues FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Tenants can view own reported issues" ON public.asset_issues FOR SELECT
  TO authenticated USING (auth.uid() = reported_by);

-- =============================================
-- 4) services table
-- =============================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  service_type text NOT NULL DEFAULT 'other',
  is_daily_help boolean NOT NULL DEFAULT false,
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  company_name text DEFAULT '',
  website_link text DEFAULT '',
  payment_frequency text NOT NULL DEFAULT 'per_visit',
  price numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'available',
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own services" ON public.services FOR ALL
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all services" ON public.services FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tenants can view property services" ON public.services FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      JOIN public.rooms r ON r.tenant_id = t.id
      WHERE t.user_id = auth.uid()
        AND r.property_id = services.property_id
    )
  );

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5) service_clock_entries table
-- =============================================
CREATE TABLE public.service_clock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_clock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own clock_entries" ON public.service_clock_entries FOR ALL
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all clock_entries" ON public.service_clock_entries FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
