

# Fix: Admin-Added Balance Not Showing in Landlord Subscription Page

## Problem
When admin adds Room/Flat balance for a landlord, a new `user_subscriptions` row is created. But the Subscription page uses `.find()` which only picks the **first** matching subscription. The admin-added balance (second row) is ignored in the display.

## Root Cause
In `Subscription.tsx` line 181:
```js
const activeRoom = allSubs.find(s => s.product_type === "room_management" && ...);
```
This returns only ONE subscription. But the landlord may have multiple active room subscriptions (trial + admin-added).

The "Active Balance" card then shows `activeRoomSub.room_count` from just that one row.

## Solution
Change the Subscription page to **aggregate all active subscriptions** of each product type, matching how `Rooms.tsx` already does it correctly (line 169: `.reduce()`).

### Changes in `src/pages/Subscription.tsx`

1. **Replace `.find()` with aggregation** — compute total room_count, tolet_count, sale_listing_count across all active subs of each type
2. **Calculate days remaining** from the subscription with the latest `expires_at` (not just the first found)
3. **Display total counts** in the Active Balance card instead of single-sub counts

```
Before: activeRoomSub.room_count → shows 20 (trial only)
After:  totalRoomCount → shows 30 (20 trial + 10 admin-added)
```

| File | Change |
|------|--------|
| `src/pages/Subscription.tsx` | Aggregate all active subs per product_type for display. Show total room_count/tolet_count/sale_listing_count. Use latest expires_at for days remaining. |

This is a display-only fix — the actual room limit logic in `Rooms.tsx` already sums correctly.

