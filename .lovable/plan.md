

# Re-invite After Rejection + Block/Blacklist System

## Problems
1. After a tenant rejects an invitation, landlord cannot re-send — permanently blocked
2. No block/blacklist feature exists — anyone can spam invitations or messages

## Solution

### Part 1: Allow Re-invite After Rejection
- **Edge function (`link-tenant`)**: When a rejected invitation exists, delete the old one and create a new one instead of refusing
- **UI (`LinkTenantDialog`)**: Show "Re-send" button for rejected tenants instead of disabling them

### Part 2: Block/Blacklist System
- **New `user_blocks` table**: `blocker_id`, `blocked_id`, `reason`, `created_at`
- Anyone can block anyone (tenant blocks landlord, landlord blocks tenant, etc.)
- Blocked users cannot send invitations, messages, or requests to each other
- **Admin portal**: Admin can view all blocks, add/remove blocks for any user

### Database Migration

```sql
-- user_blocks table
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own blocks" ON public.user_blocks
  FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
CREATE POLICY "Users can insert own blocks" ON public.user_blocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete own blocks" ON public.user_blocks
  FOR DELETE TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Admins manage all blocks" ON public.user_blocks
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Files to Change

| File | Change |
|------|--------|
| Migration SQL | New `user_blocks` table with RLS |
| `supabase/functions/link-tenant/index.ts` | (1) On rejected invite, delete old + create new. (2) Check `user_blocks` before searching/inviting — skip blocked users |
| `src/components/tenants/LinkTenantDialog.tsx` | Show "Re-send invitation" for rejected status instead of disabling. Show "Blocked" badge for blocked users |
| `src/pages/Tenants.tsx` | Add "Block" option in tenant action menu |
| `src/pages/tenant/TenantLandlord.tsx` | Add "Block Landlord" option |
| New: `src/pages/admin/AdminBlocks.tsx` | Admin page to view/manage all blocks |
| `src/components/AdminSidebar.tsx` | Add Blocks menu item |
| `src/App.tsx` | Add route for admin blocks page |

### Flow

```text
Landlord searches tenant → check blocks → show results
  ├─ No prior invite → "Send Invitation" 
  ├─ Pending → "Already sent" (disabled)
  ├─ Rejected → "Re-send Invitation" (deletes old, creates new)
  ├─ Accepted → "Already linked" (disabled)
  └─ Blocked → "Blocked" badge (no action)

Block flow:
  Landlord → tenant card → "Block" → user_blocks insert
  Tenant → landlord page → "Block Landlord" → user_blocks insert
  Admin → Admin Blocks page → view all, add/remove any block
```

