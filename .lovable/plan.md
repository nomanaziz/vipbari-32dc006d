

# Fix 4 Issues: Mobile Design, Unit Scroll, Email Verify 404, Sidebar Scroll

## Issue 1: `common.saving` still showing as raw key in Bulk Room dialog
The button at line 669 of `BulkRoomAddDialog.tsx` uses `t("common.saving")`. The translation was added previously but may not have been saved correctly, or the dialog was cached. Will verify the translation exists and ensure it renders plain text.

**Fix**: Check `LanguageContext.tsx` for `common.saving` key. If missing, add it. The screenshot shows it still displaying raw — likely needs the exact key added.

## Issue 2: Adding second unit doesn't auto-scroll and copies first unit values
When clicking "+ ইউনিট যোগ করুন" in different mode, `addDiffUnit()` creates a new unit with `defaultUnit(nextLabel)` which has default values (not copied from first). The issue is the `ScrollArea` doesn't auto-scroll to the newly added unit.

**Fix**: After adding a unit, scroll the ScrollArea to the bottom. Use a `ref` on the last unit and call `scrollIntoView` after state update.

## Issue 3: `/verify-email` page shows 404 on published site
The route `/verify-email` exists in `App.tsx` (line 125). The 404 shown is from Supabase/hosting, not React Router — the URL in screenshot shows `vipbari.com/verify-email` which is the published custom domain. This is a SPA routing issue on the custom domain. However per Lovable docs, SPA routing is handled automatically. The real issue may be that after email confirmation, the hash callback isn't redirecting properly.

**Fix**: The `OAuthCallbackHandler` handles `type=signup` hash redirects. But if the user lands on `/verify-email` and reloads after confirmation, they should be redirected to dashboard/login. Add logic in `VerifyEmail.tsx` to check if user is already authenticated and redirect to dashboard.

## Issue 4: Mobile side menu (PublicNavbar Sheet) not scrollable
The `SheetContent` in `PublicNavbar.tsx` (line 171) has no scroll mechanism. When feature links fill the menu, it overflows without scrolling.

**Fix**: Wrap the sheet content body in a `ScrollArea` or add `overflow-y-auto` to make the content scrollable on mobile.

## File Changes

1. **`src/contexts/LanguageContext.tsx`** — Verify/fix `common.saving` translation key
2. **`src/components/rooms/BulkRoomAddDialog.tsx`** — Add auto-scroll to new unit after adding; ensure new units get fresh defaults (not copies)
3. **`src/pages/VerifyEmail.tsx`** — Add auth check: if user is logged in, redirect to `/dashboard`
4. **`src/components/PublicNavbar.tsx`** — Add `overflow-y-auto` and proper height constraint to SheetContent body for mobile scrollability

