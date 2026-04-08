

# Tenant Profile Edit Approval System

## Problem
Currently, both landlords and tenants can freely edit tenant data. Two new rules are needed:
1. **Name changes require mutual approval** — if a self-registered tenant changes their name, the landlord must approve. If the landlord edits a self-registered tenant's name, the tenant must approve.
2. **Registration form data** edited by the tenant also requires landlord approval before it takes effect.

## Design

### New Table: `tenant_edit_requests`

Stores pending edit requests that need approval from the other party.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid | FK to tenants |
| requested_by | uuid | user_id of who made the edit |
| approve_by | uuid | user_id of who needs to approve |
| field_changes | jsonb | `{"full_name": "New Name", "father_name": "..."}` |
| status | text | `pending` / `approved` / `rejected` |
| created_at | timestamptz | |
| resolved_at | timestamptz | nullable |

RLS: requestor and approver can both read; approver can update status.

### Logic Flow

**Tenant edits their own profile:**
- If tenant has a landlord (`owner_id != user_id`), name change and registration form changes create a `tenant_edit_request` instead of directly updating. Other fields (phone, address, documents) update directly.
- Toast: "পরিবর্তনের অনুরোধ পাঠানো হয়েছে, বাড়িওয়ালার অনুমোদন প্রয়োজন"

**Landlord edits a self-registered tenant:**
- A tenant is "self-registered" if `user_id IS NOT NULL` and `owner_id != user_id` (or tenant registered themselves).
- Name and registration form field changes create a `tenant_edit_request` with `approve_by = tenant.user_id`.
- Toast: "পরিবর্তনের অনুরোধ পাঠানো হয়েছে, ভাড়াটিয়ার অনুমোদন প্রয়োজন"

**On approval:**
- The approved field_changes are applied to the `tenants` table.
- A notification is created for the requestor.

**On rejection:**
- Status set to `rejected`, notification sent to requestor.

### Protected Fields (require approval)
`full_name`, `father_name`, `marital_status`, `religion`, `education`, `workplace_address`, `passport_number`, `emergency_*`, `domestic_worker_*`, `driver_*`, `prev_landlord_*`, `prev_leave_reason`, `current_landlord_*`, `living_since`

### File Changes

1. **Migration** — Create `tenant_edit_requests` table with RLS policies.

2. **`src/pages/tenant/TenantProfile.tsx`** — Split save logic:
   - Direct-save fields (phone, address, documents, avatar) update immediately.
   - Protected fields → if tenant is linked to a landlord, insert into `tenant_edit_requests` instead.
   - Show pending edit requests banner with current pending changes.

3. **`src/components/tenants/TenantFormDialog.tsx`** — When editing a self-registered tenant:
   - Protected field changes → insert into `tenant_edit_requests` with `approve_by = tenant.user_id`.
   - Non-protected fields save directly.

4. **New component: `src/components/tenants/EditApprovalSection.tsx`** — Shows pending edit requests:
   - For **landlord** (on Tenants page): list of pending requests from tenants with Approve/Reject buttons.
   - For **tenant** (on Profile page): list of pending requests from landlord with Approve/Reject buttons.
   - On approve → apply `field_changes` to tenants table via update, set status = `approved`.
   - On reject → set status = `rejected`.

5. **`src/pages/Tenants.tsx`** — Add a badge/indicator on tenant cards showing pending edit requests count. Add the approval UI in tenant detail or as a small dialog.

6. **Notification** — On insert into `tenant_edit_requests`, create a notification row for the `approve_by` user.

### Technical Notes
- The `field_changes` jsonb approach is flexible — no schema changes needed per field.
- Approval applies changes atomically by updating the tenants row with the stored jsonb values.
- Self-registered tenant detection: `tenant.user_id IS NOT NULL AND tenant.user_id != tenant.owner_id`.
- Landlord-created tenants (no user_id or user_id = owner_id) have no approval requirement — landlord edits directly.

