

# Fix: Approve/Reject Buttons Not Showing for Family Members

## Root Cause
The `tenant_members` table has `status text NOT NULL DEFAULT 'active'`. When a tenant or landlord adds a family member, no `status` is explicitly set, so the DB inserts it as `'active'`.

The FamilyMembersDialog code checks `m.status === "pending" || !m.status` to show the Approve/Reject buttons. Since status is always `'active'`, the buttons never appear.

## Fix (2 changes)

### 1. Migration: Change default status from 'active' to 'pending'
```sql
ALTER TABLE public.tenant_members ALTER COLUMN status SET DEFAULT 'pending';
-- Also update any existing 'active' members that were never verified to 'pending'
UPDATE public.tenant_members SET status = 'pending' WHERE status = 'active' AND verified_by IS NULL AND verified_at IS NULL;
```
This ensures all new family members start as "pending" and require landlord approval.

### 2. TenantFamily.tsx (tenant side): Explicitly set status to 'pending' on insert
In the `addMutation` payload, add `status: "pending"` to make intent explicit regardless of DB default.

### 3. FamilyMembersDialog.tsx (landlord side): Same — explicitly set status to 'pending' on insert
In the `addMutation` payload at line 71-77, add `status: "pending"`.

## Result
- New family members → status = "pending"
- Landlord opens Family Members dialog → sees Approve/Reject buttons below each pending member
- After approval → status changes to "approved", buttons disappear, green badge shows

