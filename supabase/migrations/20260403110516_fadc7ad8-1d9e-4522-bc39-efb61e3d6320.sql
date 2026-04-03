
CREATE TABLE public.sms_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_count integer NOT NULL DEFAULT 0,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sms_balances"
ON public.sms_balances FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sms_balances"
ON public.sms_balances FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
