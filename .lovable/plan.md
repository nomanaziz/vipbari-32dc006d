

# Tenant Release/Archive System (No Direct Delete)

## Summary
Replace direct tenant deletion with a **Release → Archive** system. Landlords cannot delete tenants who have billing history (1+ bill). New tenants with no bills can still be deleted. Released tenants go to an archive with full history view and can be reactivated.

## Current State
- Tenants page has a Delete option for all tenants (via `DeleteConfirmDialog`)
- A basic Release mutation exists (sets `owner_id = user_id`, `status = inactive`, clears `room_id`) — but only for linked-account tenants
- No archive view, no release reason tracking, no bill-based delete protection

## Changes

### 1. Database Migration — Add release tracking columns to `tenants`
```sql
ALTER TABLE tenants
  ADD COLUMN released_at timestamptz,
  ADD COLUMN release_reason text DEFAULT '',
  ADD COLUMN release_notes text DEFAULT '';
```
No new table needed — existing `status` column (`active` / `inactive`) already handles the state. `released_at` tracks when they were released.

### 2. `src/pages/Tenants.tsx` — Core Logic Changes

**Delete protection:**
- Before allowing delete, check if tenant has any bills: `SELECT count(*) FROM bills WHERE tenant_id = ?`
- If bills exist → block delete, show toast: "এই ভাড়াটিয়ার বিল আছে। মুছে ফেলা যাবে না, রিলিজ করুন।"
- If no bills → allow normal delete (for mistakenly created entries)

**Release flow (replaces current simple release):**
- Remove the `confirm()` prompt, replace with a proper **Release Dialog**
- Release works for ALL landlord-added tenants (not just linked-account ones)
- On release: set `status = 'inactive'`, `room_id = null`, `released_at = now()`, `release_reason`, `release_notes`
- Free the room (`status = vacant`)

**Status filter update:**
- Add "released" as a filterable view (tenants where `status = 'inactive'` and `released_at IS NOT NULL`)
- Rename filter options: Active / Released (Archive)

**Reactivate option:**
- For released/archived tenants, show "Reactivate" menu item
- Reactivate sets `status = 'active'`, clears `released_at`, allows re-assigning a room

**Hide Delete for billed tenants:**
- In dropdown menu, conditionally show Delete only if tenant has no bills

### 3. New Component: `src/components/tenants/TenantReleaseDialog.tsx`

A dialog with:
- Tenant name display
- Release reason selector (radio/select):
  - "সব বিল পরিশোধ করে চলে গেছে" / "Left — all bills paid"
  - "বিল বাকি রেখে চলে গেছে" / "Left — bills unpaid"
  - "অন্যান্য" / "Other"
- Optional notes textarea
- Confirm button

### 4. Archive/History View Enhancement

In the tenant card (when `status = inactive` and `released_at` exists):
- Show "Released" badge with date
- Show release reason badge
- Show summary stats: total months stayed, total rent paid, total due
- These stats come from a query on the `bills` table for that tenant

### 5. Translation Keys (`LanguageContext.tsx`)

Add keys for:
- Release dialog title, reasons, confirm button
- "Cannot delete — has billing history"
- "Reactivate" button
- Archive-related labels

## Files to Modify

| File | Change |
|------|--------|
| DB migration | Add `released_at`, `release_reason`, `release_notes` to `tenants` |
| `src/pages/Tenants.tsx` | Bill-check before delete, release dialog integration, reactivate option, archive filter |
| New: `src/components/tenants/TenantReleaseDialog.tsx` | Release reason dialog |
| `src/contexts/LanguageContext.tsx` | New translation keys |

## Not Changing
- Admin tenant management (AdminTenants.tsx) — admin retains full delete power
- Tenant form dialog — no changes needed
- Database triggers or RLS — existing policies cover status updates

