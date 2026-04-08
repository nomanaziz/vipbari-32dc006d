

# Landlord Panel: Family Member Approve/Reject Buttons Fix

## Problem
Screenshot shows the Family Members dialog from the landlord panel has "Pending Approval" badge and trash icon, but the Approve/Reject buttons are not visible — likely hidden due to the narrow dialog width (`max-w-md`) causing the button group to overflow.

## Solution

### Update `src/components/tenants/FamilyMembersDialog.tsx`
1. **Restructure member card layout** — move Approve/Reject buttons below the member info instead of beside it, so they're always visible regardless of dialog width
2. **Make buttons full-width on the action row** — clearer, more tappable, mobile-friendly
3. **Add landlord context check** — only show approve/reject if the current user is the landlord (not the tenant themselves viewing their own members)
4. **Widen dialog** — change `max-w-md` to `max-w-lg` to give more space

### Layout change (per member card):
```
┌─────────────────────────────────┐
│ nafisa  ⏳ Pending Approval   🗑 │
│ Daughter                        │
│ [✅ Approve] [❌ Reject]        │
└─────────────────────────────────┘
```

After approval:
```
┌─────────────────────────────────┐
│ nafisa  ✅ Approved            🗑 │
│ Daughter                        │
└─────────────────────────────────┘
```

This ensures approve/reject buttons are always visible and not clipped by container width.

