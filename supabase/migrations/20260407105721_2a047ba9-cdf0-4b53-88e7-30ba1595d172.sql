
-- Create tenant_invitations table
CREATE TABLE public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  tenant_user_id uuid NOT NULL,
  room_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(landlord_id, tenant_id)
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage all tenant_invitations"
ON public.tenant_invitations FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Landlords can insert and view own invitations
CREATE POLICY "Landlords can manage own invitations"
ON public.tenant_invitations FOR ALL TO authenticated
USING (auth.uid() = landlord_id)
WITH CHECK (auth.uid() = landlord_id);

-- Tenants can view invitations sent to them
CREATE POLICY "Tenants can view own invitations"
ON public.tenant_invitations FOR SELECT TO authenticated
USING (auth.uid() = tenant_user_id);

-- Tenants can update status on their invitations
CREATE POLICY "Tenants can respond to invitations"
ON public.tenant_invitations FOR UPDATE TO authenticated
USING (auth.uid() = tenant_user_id)
WITH CHECK (auth.uid() = tenant_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_tenant_invitations_updated_at
  BEFORE UPDATE ON public.tenant_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
