
-- 1. Fix tenant-documents bucket: make private
UPDATE storage.buckets SET public = false WHERE id = 'tenant-documents';

-- 2. Drop the overly permissive public SELECT policy on tenant-documents
DROP POLICY IF EXISTS "Public read tenant-documents" ON storage.objects;

-- 3. Replace with scoped SELECT policy: owner (landlord) or tenant can read their own docs
CREATE POLICY "Owner and tenant read tenant-documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (
    -- The file path convention is: owner_id/tenant_id/filename
    -- Allow if the user is the owner (first path segment)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Allow if the user is the tenant (has a tenant record linked to them)
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.user_id = auth.uid()
      AND t.id::text = (storage.foldername(name))[2]
    )
  )
);

-- 4. Fix auth upload policy to scope to owner
DROP POLICY IF EXISTS "Auth upload tenant-documents" ON storage.objects;
CREATE POLICY "Auth upload tenant-documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Fix auth delete policy to scope to owner
DROP POLICY IF EXISTS "Auth delete tenant-documents" ON storage.objects;
CREATE POLICY "Auth delete tenant-documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Fix overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert own notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 7. Add RLS policies for user_roles (currently has RLS enabled but no policies)
CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 8. Fix mutable search_path on email queue functions
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name); RETURN pgmq.send(queue_name, payload);
END; $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN RETURN FALSE;
END; $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id); RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN PERFORM pgmq.create(queue_name); RETURN;
END; $$;
