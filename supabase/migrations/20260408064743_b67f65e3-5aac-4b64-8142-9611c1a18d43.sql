-- Add RLS policy so tenants can read their own assigned room
CREATE POLICY "Tenant can read own assigned room"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.room_id = rooms.id
      AND tenants.user_id = auth.uid()
  )
);