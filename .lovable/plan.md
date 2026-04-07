

# Invitation-Based Tenant Linking System

## Problem
Currently, when a landlord searches a tenant by phone and clicks "Link", the tenant is instantly added — even if the landlord has no properties/rooms. There's no consent from the tenant. This is a security and UX problem.

## Solution
Replace instant linking with an **invitation flow**:
1. Landlord searches tenant by phone → sends **invitation** (not instant link)
2. Tenant sees pending invitations in their dashboard → can **Accept** or **Reject**
3. Only on Accept does the actual linking happen (owner_id updated)
4. If Rejected, landlord cannot re-send to the same tenant (blocked)

## Database Changes

### New table: `tenant_invitations`
```sql
CREATE TABLE public.tenant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL,        -- who sent the invite
  tenant_id uuid NOT NULL,          -- tenants table id
  tenant_user_id uuid NOT NULL,     -- auth user id of tenant
  room_id uuid,                     -- optional room assignment
  status text NOT NULL DEFAULT 'pending',  -- pending | accepted | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(landlord_id, tenant_id)    -- one active invite per landlord-tenant pair
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
```

### RLS Policies
- Landlords can INSERT invitations (where landlord_id = auth.uid())
- Landlords can SELECT own invitations (landlord_id = auth.uid())
- Tenants can SELECT invitations sent to them (tenant_user_id = auth.uid())
- Tenants can UPDATE status on their invitations (tenant_user_id = auth.uid())
- Admins full access

## Edge Function Changes

### Update `link-tenant/index.ts`
- **action: "search"** — unchanged (search still works)
- **action: "link"** → renamed to **action: "invite"** — instead of updating `tenants.owner_id`, inserts a row into `tenant_invitations` with status `pending`
- Validate: block invite if a `rejected` or `pending` invitation already exists for this landlord+tenant pair
- **action: "respond"** (new) — tenant accepts/rejects. On accept: update `tenants.owner_id` to landlord_id, optionally assign room. On reject: mark as rejected.

## Frontend Changes

### 1. `LinkTenantDialog.tsx`
- Change button text from "Link" to "Send Invitation" / "ইনভিটেশন পাঠান"
- On success, show "Invitation sent! Waiting for tenant to accept." / "ইনভিটেশন পাঠানো হয়েছে! ভাড়াটিয়ার গ্রহণের জন্য অপেক্ষা করুন।"
- Show existing pending/rejected status if landlord searches same tenant again

### 2. `PendingRequestsSection.tsx`
- Add a new section showing **pending tenant invitations** (sent by this landlord) so landlord can see invitation status

### 3. New: Tenant invitation UI in `TenantLandlord.tsx`
- Query `tenant_invitations` where `tenant_user_id = auth.uid()` and `status = 'pending'`
- Show landlord name, phone with Accept/Reject buttons
- On Accept: call edge function with action "respond", response "accepted"
- On Reject: call edge function with action "respond", response "rejected"

## Flow Diagram
```text
Landlord                          Tenant
   |                                 |
   |-- Search by phone ------------->|
   |<-- Results ---------------------|
   |                                 |
   |-- Send Invitation ------------->|
   |   (tenant_invitations: pending) |
   |                                 |
   |                    Sees invite --|
   |                    Accept/Reject |
   |                                 |
   |<-- If Accepted: link happens ---|
   |   (tenants.owner_id updated)    |
   |                                 |
   |<-- If Rejected: blocked --------|
   |   (cannot re-invite)            |
```

## Files to Change

| File | Action |
|------|--------|
| Migration SQL | New `tenant_invitations` table + RLS |
| `supabase/functions/link-tenant/index.ts` | Add invite + respond actions, remove direct link |
| `src/components/tenants/LinkTenantDialog.tsx` | Change "Link" to "Send Invitation" |
| `src/components/tenants/PendingRequestsSection.tsx` | Show sent invitation statuses |
| `src/pages/tenant/TenantLandlord.tsx` | Show pending invitations with Accept/Reject |

