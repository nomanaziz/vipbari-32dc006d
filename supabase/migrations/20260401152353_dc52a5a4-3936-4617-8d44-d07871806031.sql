
-- Seed default permission presets for landlord scope (only if they don't already exist)
INSERT INTO public.permission_presets (name, permissions, scope, created_by)
SELECT 'Manager', '["view_tenants","manage_tenants","view_bills","manage_bills","view_payments","manage_payments","manage_rent","view_properties","manage_properties","view_rooms","manage_rooms","view_meters","manage_meters","view_garages","manage_garages","view_guests","manage_guests","manage_complaints","manage_notices","view_accounting","manage_staff","delete_records"]'::jsonb, 'landlord', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.permission_presets WHERE name = 'Manager' AND scope = 'landlord' AND created_by IS NULL);

INSERT INTO public.permission_presets (name, permissions, scope, created_by)
SELECT 'Caretaker', '["view_tenants","manage_tenants","view_bills","view_payments","view_properties","view_rooms","view_meters","manage_meters","view_garages","manage_garages","view_guests","manage_guests","manage_complaints","manage_notices"]'::jsonb, 'landlord', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.permission_presets WHERE name = 'Caretaker' AND scope = 'landlord' AND created_by IS NULL);

INSERT INTO public.permission_presets (name, permissions, scope, created_by)
SELECT 'Guard/Security', '["view_tenants","view_guests","manage_guests","view_properties","view_rooms"]'::jsonb, 'landlord', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.permission_presets WHERE name = 'Guard/Security' AND scope = 'landlord' AND created_by IS NULL);

INSERT INTO public.permission_presets (name, permissions, scope, created_by)
SELECT 'Rent Collector', '["view_tenants","view_bills","manage_bills","view_payments","manage_payments","manage_rent","view_rooms"]'::jsonb, 'landlord', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.permission_presets WHERE name = 'Rent Collector' AND scope = 'landlord' AND created_by IS NULL);

INSERT INTO public.permission_presets (name, permissions, scope, created_by)
SELECT 'Viewer', '["view_tenants","view_bills","view_payments","view_properties","view_rooms","view_meters","view_garages","view_guests","view_accounting"]'::jsonb, 'landlord', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.permission_presets WHERE name = 'Viewer' AND scope = 'landlord' AND created_by IS NULL);
