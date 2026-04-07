

# Fix: Landlord Can't See/Approve Pending Family Members + Show Member Count

## Problems
1. **RLS blocks access**: The `tenant_members` RLS policy only checks `tenants.owner_id = auth.uid()`. Self-registered tenants linked via `tolet_requests` have `owner_id = their own user_id`, so the landlord can't read or update their family members at all.
2. **PendingRequestsSection query** also filters by `tenants.owner_id = user.id` — same gap for linked tenants.
3. **No family member count** shown on tenant cards.

## Solution

### Step 1: Update RLS policy for `tenant_members`
Drop the existing "Owners can manage tenant_members" policy and create a new one that also checks `tolet_requests`:

```sql
DROP POLICY "Owners can manage tenant_members" ON public.tenant_members;
CREATE POLICY "Owners can manage tenant_members" ON public.tenant_members
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id = tenant_members.tenant_id
    AND (
      tenants.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tolet_requests tr
        WHERE tr.tenant_user_id = tenants.user_id
        AND tr.landlord_user_id = auth.uid()
        AND tr.status = 'accepted'
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenants
    WHERE tenants.id = tenant_members.tenant_id
    AND (
      tenants.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tolet_requests tr
        WHERE tr.tenant_user_id = tenants.user_id
        AND tr.landlord_user_id = auth.uid()
        AND tr.status = 'accepted'
      )
    )
  )
);
```

### Step 2: Update `PendingRequestsSection.tsx` query
Expand the pending members query to also fetch members from tenants linked via `tolet_requests` (same pattern used in Guests fix — fetch linked tenant IDs, then query their members).

### Step 3: Show family member count on tenant cards in `Tenants.tsx`
- Add a query to fetch member counts per tenant: `SELECT tenant_id, count(*) FROM tenant_members WHERE status='approved' GROUP BY tenant_id`
- Display a `Users` icon badge on each tenant card showing "Family: 3" / "পরিবার: ৩"

### Files Changed
| File | Change |
|------|--------|
| Migration SQL | Update RLS on `tenant_members` |
| `src/components/tenants/PendingRequestsSection.tsx` | Query linked tenants via `tolet_requests` for pending members |
| `src/pages/Tenants.tsx` | Add member count query + display on tenant cards |

