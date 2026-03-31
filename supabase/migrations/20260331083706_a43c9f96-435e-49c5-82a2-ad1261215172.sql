
-- =============================================================
-- FIX 3: Profiles – scope landlord reads to related users only
-- =============================================================

DROP POLICY IF EXISTS "Landlords can view all profiles" ON public.profiles;

CREATE POLICY "Landlords can view related profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'landlord'::app_role)
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      AND t.user_id = profiles.user_id
      AND t.owner_id IS DISTINCT FROM t.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.property_staff ps
      WHERE ps.owner_id = auth.uid()
      AND ps.staff_user_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.tolet_requests tr
      WHERE tr.landlord_user_id = auth.uid()
      AND tr.tenant_user_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.landlord_id = auth.uid()
      AND c.tenant_user_id = profiles.user_id
    )
  )
);

-- =============================================================
-- FIX 4: Permission presets – scope to own or system presets
-- =============================================================

DROP POLICY IF EXISTS "Authenticated can read permission_presets" ON public.permission_presets;

CREATE POLICY "Users read own or system presets"
ON public.permission_presets FOR SELECT TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL);

-- =============================================================
-- FIX 5: Tenant documents – allow owner to read tenant docs
-- =============================================================

DROP POLICY IF EXISTS "Owner and tenant read tenant-documents" ON storage.objects;

CREATE POLICY "Owner and tenant read tenant-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[2]
    )
    OR EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.owner_id = auth.uid()
      AND t.owner_id IS DISTINCT FROM t.user_id
      AND (
        t.user_id::text = (storage.foldername(name))[1]
        OR t.id::text = (storage.foldername(name))[2]
      )
    )
  )
);
