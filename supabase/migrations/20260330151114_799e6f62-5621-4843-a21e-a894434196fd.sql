
-- Seed email_send_state
INSERT INTO public.email_send_state (id, batch_size, send_delay_ms) VALUES (1, 10, 200) ON CONFLICT (id) DO NOTHING;

-- Seed permission_presets
INSERT INTO public.permission_presets (name, permissions, scope) VALUES
('Admin Full Access', '["dashboard","properties","rooms","tenants","bills","payments","accounting","notices","complaints","guests","meters","garages","settings","staff","users","subscriptions","cms","ads","tutorials","reports"]', 'admin'),
('Landlord Full Access', '["dashboard","properties","rooms","tenants","bills","payments","accounting","notices","complaints","guests","meters","garages","settings","staff","reports"]', 'landlord')
ON CONFLICT DO NOTHING;
