INSERT INTO public.subscription_plans (name_bn, name_en, description_bn, description_en, price, duration_days, features, is_active, sort_order)
VALUES
('বেসিক প্ল্যান', 'Basic Plan', 'বেসিক রুম ম্যানেজমেন্ট প্ল্যান', 'Basic room management plan', 10, 30, '["room_management", "billing", "payment"]'::jsonb, true, 1);