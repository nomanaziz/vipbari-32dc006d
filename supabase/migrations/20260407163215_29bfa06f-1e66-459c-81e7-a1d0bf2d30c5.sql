
DROP POLICY IF EXISTS "Owners can manage tenant_members" ON public.tenant_members;

CREATE POLICY "Owners can manage tenant_members" ON public.tenant_members
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id = tenant_members.tenant_id
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
    WHERE tenants.id = tenant_members.tenant_id
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
