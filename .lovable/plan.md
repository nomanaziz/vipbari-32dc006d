

## Problem

Currently, Google OAuth on both Login and Register pages auto-creates a user with the default "landlord" role (via `handle_new_user` trigger) without asking the user to choose a role. There is no way to register as a tenant via Google. Also, the Login page should not allow Google sign-in for unregistered users — it should only work on the Register page.

## Plan

### 1. Remove Google Sign-In from Login page

Remove the Google OAuth button from `src/pages/Login.tsx`. Google sign-in should only be available during registration, where the user picks a role.

### 2. Update Google OAuth on Register page with role context

In `src/pages/Register.tsx`, modify the Google sign-in button to pass the selected role (landlord/tenant) via the OAuth state. Use Supabase's `queryParams` or store the selected role in `localStorage` before initiating OAuth, since Supabase OAuth does not support passing custom metadata during the redirect.

- Before calling `signInWithOAuth`, save `localStorage.setItem("oauth_pending_role", activeTab)` (either "landlord" or "tenant").
- The redirect URL remains `/dashboard`.

### 3. Create an OAuth completion page/handler

Update `OAuthCallbackHandler.tsx` to detect first-time Google OAuth users (no profile/role yet) and:

1. After session is established, check if `user_roles` has any entry for the user.
2. If no role exists (new user via Google), read `localStorage.getItem("oauth_pending_role")`.
3. If no pending role found in localStorage, sign the user out and redirect to `/register` with an error toast: "Please register first by choosing your account type."
4. If pending role exists, call a new edge function `complete-oauth-registration` that:
   - Creates the profile row (using Google's `user_metadata` for name/email)
   - Inserts the correct role into `user_roles`
   - If tenant, creates the tenant record
   - Clears localStorage item
5. Then redirect to `/dashboard`.

### 4. New edge function: `complete-oauth-registration`

Creates `supabase/functions/complete-oauth-registration/index.ts`:

- Accepts: `{ role: "landlord" | "tenant" }` 
- Authenticates via the user's JWT
- Checks if profile already exists (idempotent)
- Inserts into `profiles` (full_name from user metadata, email from auth)
- Inserts into `user_roles` with the chosen role
- If tenant, inserts into `tenants` table
- Uses service role key for writes

### 5. Update `handle_new_user` trigger

The existing trigger auto-creates profile + role for ALL new users. For Google OAuth users, the `raw_user_meta_data` won't have a `role` field, so it defaults to "landlord". We need to modify the trigger to skip profile/role creation when no explicit role is provided (i.e., when `role` metadata is null), letting the edge function handle it instead.

**Migration SQL:**
```sql
-- Update handle_new_user to skip when role is not explicitly set (OAuth users)
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
```

### 6. Files to modify

| File | Change |
|------|--------|
| `src/pages/Login.tsx` | Remove Google sign-in button and related code |
| `src/pages/Register.tsx` | Save role to localStorage before Google OAuth, keep role tabs |
| `src/components/OAuthCallbackHandler.tsx` | Detect new OAuth users, call edge function or sign out |
| `supabase/functions/complete-oauth-registration/index.ts` | New edge function for profile+role setup |
| DB migration | Update `handle_new_user` trigger to skip OAuth users |

### Flow summary

```text
Register Page
  ├─ User selects Landlord/Tenant tab
  ├─ Clicks "Sign in with Google"
  ├─ Role saved to localStorage
  ├─ Google OAuth flow completes
  └─ OAuthCallbackHandler detects new user
       ├─ Reads role from localStorage
       ├─ Calls complete-oauth-registration edge function
       ├─ Profile + role + tenant record created
       └─ Redirects to /dashboard

Login Page
  ├─ No Google button
  ├─ Email/phone + PIN only
  └─ Existing users only
```

