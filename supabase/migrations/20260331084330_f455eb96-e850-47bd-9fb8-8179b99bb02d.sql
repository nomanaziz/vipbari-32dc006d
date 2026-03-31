
-- Remove user-facing SELECT on password_reset_tokens (tokens should only be accessed by service_role/admin)
DROP POLICY IF EXISTS "Users can view own tokens" ON public.password_reset_tokens;
