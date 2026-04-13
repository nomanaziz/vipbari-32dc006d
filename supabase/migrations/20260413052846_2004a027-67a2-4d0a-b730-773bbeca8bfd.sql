
CREATE TABLE public.booking_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'deposit',
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own booking_transactions"
ON public.booking_transactions FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Tenants can view own booking_transactions"
ON public.booking_transactions FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM tenants t
  WHERE t.id = booking_transactions.tenant_id
  AND t.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all booking_transactions"
ON public.booking_transactions FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_booking_transactions_tenant ON public.booking_transactions(tenant_id);
CREATE INDEX idx_booking_transactions_owner ON public.booking_transactions(owner_id);
