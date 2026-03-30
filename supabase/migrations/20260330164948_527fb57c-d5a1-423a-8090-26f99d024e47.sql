CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Skip auto-creation for OAuth users (no role in metadata)
  -- They will be handled by complete-oauth-registration edge function
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
  RETURN NEW;
END;
$$;