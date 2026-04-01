
-- Staff details table
CREATE TABLE public.staff_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_assignment_id uuid NOT NULL REFERENCES public.staff_assignments(id) ON DELETE CASCADE UNIQUE,
  permanent_address text NOT NULL DEFAULT '',
  present_address text NOT NULL DEFAULT '',
  nid_number text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'nid',
  date_of_birth date,
  photo_url text,
  salary numeric NOT NULL DEFAULT 0,
  joining_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all staff_details"
  ON public.staff_details FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can manage own staff_details"
  ON public.staff_details FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.id = staff_details.staff_assignment_id AND sa.assigned_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.staff_assignments sa
    WHERE sa.id = staff_details.staff_assignment_id AND sa.assigned_by = auth.uid()
  ));

CREATE TRIGGER update_staff_details_updated_at
  BEFORE UPDATE ON public.staff_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Salary payments table
CREATE TABLE public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_assignment_id uuid NOT NULL REFERENCES public.staff_assignments(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  month text NOT NULL DEFAULT '',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all salary_payments"
  ON public.salary_payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can manage own salary_payments"
  ON public.salary_payments FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Auto-create accounting entry on salary payment
CREATE OR REPLACE FUNCTION public.auto_accounting_on_salary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_name text;
BEGIN
  SELECT p.full_name INTO staff_name
  FROM staff_assignments sa
  JOIN profiles p ON p.user_id = sa.user_id
  WHERE sa.id = NEW.staff_assignment_id;

  INSERT INTO accounting_entries (owner_id, type, category, entry_date, description, amount)
  VALUES (
    NEW.owner_id,
    'expense',
    'staff_salary',
    NEW.payment_date,
    'Salary: ' || COALESCE(staff_name, 'Staff') || ' (' || NEW.month || ')',
    NEW.amount
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER salary_payment_accounting
  AFTER INSERT ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION auto_accounting_on_salary();
