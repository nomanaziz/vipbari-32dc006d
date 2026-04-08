

# Auto-populate Fields + Tenant Self-Release Feature

## What the user wants

1. **Auto-populate current address**: When a tenant is under a landlord, the property address should auto-fill as the tenant's current address (বর্তমান ঠিকানা)
2. **Auto-populate landlord info**: Current landlord name and phone should come from the property owner's profile automatically
3. **"Reason for leaving" (বাড়ি ছাড়ার কারণ)**: Already exists as `prev_leave_reason` — needs to be saved when a tenant is released, so the release reason populates this field
4. **Tenant self-release**: Tenant can request release from their profile. Landlord approves → tenant gets archived with reason saved

## Changes

### 1. TenantProfile.tsx — Auto-populate from property/landlord data

**Current**: Tenant query uses `select("*")` — no joins to rooms/properties/profiles.

**Change**: 
- Update tenant query to join: `tenants → rooms → properties` and also fetch landlord profile via `owner_id`
- When form loads, auto-fill:
  - `current_landlord_name` from landlord's profile `full_name`
  - `current_landlord_phone` from landlord's profile `phone`
  - Present address fields from the property's `division`, `district`, `thana`, `area`, `house_number`, `road_number`
- These auto-filled fields show as read-only (disabled inputs) since they come from the property/landlord data
- Only auto-fill when tenant has `owner_id != user_id` (linked to a landlord)

### 2. TenantProfile.tsx — Tenant self-release button

- Add a "বাড়ি ছাড়তে চাই" (I want to leave) button on the tenant profile page
- Opens a dialog (reuse `TenantReleaseDialog` style) where tenant selects reason + notes
- Instead of directly updating status, create a `tenant_edit_requests` entry with `field_changes: { _action: "release", release_reason: "...", release_notes: "..." }` and `approve_by: owner_id`
- Landlord sees this in the EditApprovalSection as a release request
- On landlord approval: update tenant status to `inactive`, set `released_at`, `release_reason`, `release_notes`, also save reason to `prev_leave_reason`

### 3. EditApprovalSection.tsx — Handle release requests

- Detect `field_changes._action === "release"` type requests
- Show differently: "ভাড়াটিয়া বাড়ি ছাড়তে চাইছেন" with reason displayed
- On approve: execute the release logic (update tenant status, clear room, save prev_leave_reason)

### 4. Tenants.tsx — Release mutation update

- When landlord releases a tenant (existing flow), also save the release reason into `prev_leave_reason` field so it persists on the registration form

### 5. TenantRegistrationPrint.tsx — Ensure auto fields render

- Pass property data and landlord profile to the print component so current address and landlord info show correctly on the printed form

## Technical Details

- **No new DB migration needed** — all columns exist (`prev_leave_reason`, `release_reason`, `release_notes`, `current_landlord_name`, `current_landlord_phone`). The `tenant_edit_requests` table already supports the release request via `field_changes` jsonb.
- Tenant query in TenantProfile needs to be expanded: `select("*, rooms(room_number, property_id, properties(name, division, district, thana, area, house_number, road_number, postal_code, owner_id))")`
- Separate query to fetch landlord profile: `profiles.select("full_name, phone").eq("user_id", tenant.owner_id)`
- Auto-populated fields rendered as disabled/read-only with a small note "স্বয়ংক্রিয়ভাবে আসা তথ্য"

## Files to modify

1. `src/pages/tenant/TenantProfile.tsx` — Expand query, auto-fill, add self-release button
2. `src/components/tenants/EditApprovalSection.tsx` — Handle release-type requests
3. `src/pages/Tenants.tsx` — Save `prev_leave_reason` on release
4. `src/components/tenants/TenantRegistrationPrint.tsx` — Accept and display auto-populated data

