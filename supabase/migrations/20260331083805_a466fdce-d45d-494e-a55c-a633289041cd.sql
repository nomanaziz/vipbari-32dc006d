
-- FIX storage DELETE policies
DROP POLICY IF EXISTS "Auth delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete property-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete sale-listing-images" ON storage.objects;

CREATE POLICY "Users delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners delete own property-images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Owners delete own sale-listing-images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sale-listing-images' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.sale_listings sl
      WHERE sl.id::text = (storage.foldername(name))[1]
      AND sl.owner_id = auth.uid()
    )
  )
);

-- FIX storage INSERT policies
DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload property-images" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload sale-listing-images" ON storage.objects;

CREATE POLICY "Users upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own property-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Users upload own sale-listing-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'sale-listing-images' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.sale_listings sl
      WHERE sl.id::text = (storage.foldername(name))[1]
      AND sl.owner_id = auth.uid()
    )
  )
);
