
-- Update RLS policy for guests to also allow landlords linked via tolet_requests
DROP POLICY IF EXISTS "Owners can manage guests" ON public.guests;

CREATE POLICY "Owners can manage guests"
ON public.guests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id = guests.tenant_id
    AND (
      tenants.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tolet_requests tr
        WHERE tr.tenant_user_id = tenants.user_id
        AND tr.landlord_user_id = auth.uid()
        AND tr.status = 'accepted'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id = guests.tenant_id
    AND (
      tenants.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tolet_requests tr
        WHERE tr.tenant_user_id = tenants.user_id
        AND tr.landlord_user_id = auth.uid()
        AND tr.status = 'accepted'
      )
    )
  )
);
