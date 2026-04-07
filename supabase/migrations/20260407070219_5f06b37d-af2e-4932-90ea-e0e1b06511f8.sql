
-- Update handle_new_user to add trial subscription for landlords
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_plan_id uuid;
BEGIN
  -- Skip auto-creation for OAuth users (no role in metadata)
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, phone, email, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')),
    COALESCE(NEW.raw_user_meta_data->>'email', ''),
    CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'date_of_birth')::date ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);

  IF NEW.raw_user_meta_data->>'role' = 'tenant' THEN
    INSERT INTO public.tenants (user_id, owner_id, full_name, phone, status)
    VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), 'active');
  END IF;

  -- Add 1-month trial subscription for landlords (20 rooms + 5 tolet)
  IF NEW.raw_user_meta_data->>'role' = 'landlord' THEN
    SELECT id INTO default_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY sort_order LIMIT 1;
    IF default_plan_id IS NOT NULL THEN
      -- Trial: 20 room slots
      INSERT INTO public.user_subscriptions (user_id, plan_id, product_type, room_count, tolet_count, duration_months, starts_at, expires_at, status, discount_percent)
      VALUES (NEW.id, default_plan_id, 'room_management', 20, 0, 1, now(), now() + interval '30 days', 'active', 100);
      -- Trial: 5 tolet slots
      INSERT INTO public.user_subscriptions (user_id, plan_id, product_type, room_count, tolet_count, duration_months, starts_at, expires_at, status, discount_percent, tolet_price_per_unit)
      VALUES (NEW.id, default_plan_id, 'tolet', 0, 5, 1, now(), now() + interval '30 days', 'active', 100, 0);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
