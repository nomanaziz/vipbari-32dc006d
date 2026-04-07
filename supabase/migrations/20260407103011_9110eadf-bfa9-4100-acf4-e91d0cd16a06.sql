
-- Fix user role from landlord to tenant
UPDATE public.user_roles 
SET role = 'tenant' 
WHERE user_id = 'cead14cf-8a54-45e1-bdda-46630bc2ab81' AND role = 'landlord';

-- Create tenant record if not exists
INSERT INTO public.tenants (user_id, owner_id, full_name, phone, status)
SELECT 'cead14cf-8a54-45e1-bdda-46630bc2ab81', 'cead14cf-8a54-45e1-bdda-46630bc2ab81', p.full_name, p.phone, 'active'
FROM profiles p WHERE p.user_id = 'cead14cf-8a54-45e1-bdda-46630bc2ab81'
ON CONFLICT DO NOTHING;
