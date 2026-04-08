
-- Create tenant_edit_requests table
CREATE TABLE public.tenant_edit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  approve_by uuid NOT NULL,
  field_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE public.tenant_edit_requests ENABLE ROW LEVEL SECURITY;

-- Requestor and approver can read their own requests
CREATE POLICY "Users can view own edit requests"
ON public.tenant_edit_requests
FOR SELECT TO authenticated
USING (auth.uid() = requested_by OR auth.uid() = approve_by);

-- Only the requesting user can insert
CREATE POLICY "Users can insert edit requests"
ON public.tenant_edit_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requested_by);

-- Approver can update (approve/reject)
CREATE POLICY "Approver can update edit requests"
ON public.tenant_edit_requests
FOR UPDATE TO authenticated
USING (auth.uid() = approve_by);

-- Admins full access
CREATE POLICY "Admins can manage all edit requests"
ON public.tenant_edit_requests
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to create notification when a new edit request is created
CREATE OR REPLACE FUNCTION public.notify_tenant_edit_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tenant_name text;
  requester_name text;
BEGIN
  SELECT full_name INTO tenant_name FROM tenants WHERE id = NEW.tenant_id;
  SELECT full_name INTO requester_name FROM profiles WHERE user_id = NEW.requested_by;
  
  INSERT INTO notifications (user_id, title, body, type, reference_id)
  VALUES (
    NEW.approve_by,
    'তথ্য পরিবর্তনের অনুরোধ',
    COALESCE(requester_name, '') || ' ভাড়াটিয়া ' || COALESCE(tenant_name, '') || ' এর তথ্য পরিবর্তন করতে চাইছেন। অনুগ্রহ করে অনুমোদন করুন।',
    'edit_request',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_tenant_edit_request_created
AFTER INSERT ON public.tenant_edit_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_tenant_edit_request();
