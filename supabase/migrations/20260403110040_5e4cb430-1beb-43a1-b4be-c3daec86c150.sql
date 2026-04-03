CREATE POLICY "Staff can view all tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'landlord_staff'::app_role)
);