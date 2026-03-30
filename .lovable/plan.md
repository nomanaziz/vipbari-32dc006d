

## Plan: Fix Email Verification Flow

### Problem Analysis

The verification email link pointed to an **old Supabase project** (`uaddsxwrwxigualtdqqw`) instead of the current one (`djspxvtoxysjivhzrnuo`). This confirms the issue is in **Supabase Dashboard settings**, not code — but we also need code fixes to make the flow more robust.

**Database check**: User `fileserverbd@gmail.com` exists on the current project with `email_confirmed_at = NULL` (unverified). The auth logs confirm the email was sent from the correct project. So either:
1. The **Site URL** in Supabase Dashboard is still set to the old project URL, causing bad redirect links
2. The user clicked an old email from a previous project

### Fixes

#### 1. Manual: Update Supabase Dashboard Settings
Go to [Authentication → URL Configuration](https://supabase.com/dashboard/project/djspxvtoxysjivhzrnuo/auth/url-configuration):

- **Site URL**: Set to `https://2eb1e69c-66d3-4783-b04c-cac5c79b84a4.lovableproject.com`
- Verify these **Redirect URLs** exist:
  - `https://2eb1e69c-66d3-4783-b04c-cac5c79b84a4.lovableproject.com/**`
  - `https://id-preview--2eb1e69c-66d3-4783-b04c-cac5c79b84a4.lovable.app/**`
  - `https://vipbari.com/**`

#### 2. Code: Add explicit `emailRedirectTo` in Register
**File**: `src/pages/Register.tsx`

In the `signUp` call, add `emailRedirectTo` so verification emails always redirect to the correct app URL:

```typescript
const { error } = await supabase.auth.signUp({
  email,
  password: pin,
  options: {
    emailRedirectTo: window.location.origin + "/dashboard",
    data: { ... },
  },
});
```

#### 3. Code: Handle email verification callback
**File**: `src/App.tsx` (in `OAuthCallbackHandler` or a new handler)

When user clicks the verification link, Supabase redirects to the app with `#type=signup&access_token=...` in the URL hash. Currently the `OAuthCallbackHandler` only handles OAuth tokens. We need to also detect `type=signup` verification callbacks and show a success toast + redirect to login/dashboard.

**File**: `src/components/OAuthCallbackHandler.tsx`

Add detection for `type=signup` in the hash — when found, show "Email verified successfully!" toast and redirect to `/dashboard`.

#### 4. Code: Add "Resend Verification Email" button
**File**: `src/pages/VerifyEmail.tsx`

Add a button that calls `supabase.auth.resend({ type: 'signup', email })` so users can resend if the original email was lost or pointed to the wrong project. Store the email in localStorage during registration to pre-fill.

### Files Modified

| File | Change |
|------|--------|
| `src/pages/Register.tsx` | Add `emailRedirectTo` to signUp options, store email in localStorage |
| `src/components/OAuthCallbackHandler.tsx` | Handle `type=signup` verification callback |
| `src/pages/VerifyEmail.tsx` | Add resend verification email button |

