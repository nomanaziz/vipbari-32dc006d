

# Remove 4 Free Rooms & Add 1-Month Full Trial on Registration

## Current State
- Landlords get **4 free room slots** hardcoded in `Rooms.tsx` (lines 172, 326) and `BulkRoomAddDialog.tsx` (line 369)
- First-time tolet buyers get **2 free tolet slots** in `verify-subscription-payment` and `approve-manual-payment`
- No trial subscription is created on user registration
- `handle_new_user` trigger only creates profile + role

## What Changes

### 1. Remove all "4 free rooms" logic
- **`src/pages/Rooms.tsx`** — Change `freeSlots = 4` → `0` and `freeRoomSlots = 4` → `0` (lines 172, 326)
- **`src/components/rooms/BulkRoomAddDialog.tsx`** — Change `freeSlots = 4` → `0` (line 369)
- Update display text that shows "(4+paid)" breakdown

### 2. Remove "2 free tolet on first purchase" logic
- **`supabase/functions/verify-subscription-payment/index.ts`** — Remove `handleFreeTolet()` function and its call
- **`supabase/functions/approve-manual-payment/index.ts`** — Remove the similar free tolet insertion block

### 3. Add 1-Month Full Trial on Landlord Registration
Create a **database trigger** (or modify `handle_new_user`) that automatically inserts a trial subscription when a **landlord** registers:

**Trial includes:**
- 1 property (max)
- 20 rooms
- 5 to-let slots
- All features unlocked
- Duration: 30 days from registration
- Product type: `trial` (new) or insert multiple `user_subscriptions` rows

**Approach**: Modify the `handle_new_user` trigger to insert a trial `user_subscriptions` row for landlords:
```sql
IF NEW.raw_user_meta_data->>'role' = 'landlord' THEN
  INSERT INTO user_subscriptions (user_id, plan_id, starts_at, expires_at, status,
    product_type, room_count, tolet_count, duration_months)
  VALUES (NEW.id, <default_plan_id>, now(), now() + interval '30 days', 'active',
    'room_management', 20, 0, 1);
  -- Plus tolet trial row
  INSERT INTO user_subscriptions (...)
  VALUES (NEW.id, ..., 'tolet', 0, 5, 1);
END IF;
```

### 4. Property limit enforcement (max 1 during trial)
- **`src/pages/Properties.tsx`** — Add a check: if user only has trial subscription, limit to 1 property. After trial expires or they buy a plan, no property limit (property count is not a subscription item currently — it's unlimited for paid users).

### 5. Update Landing Page text
- **`src/contexts/LanguageContext.tsx`** — Update `landing.free_1` from "৫টি রুম" to "২০টি রুম", `landing.free_2` keep "সব ফিচার", add "৫টি টু-লেট", update FAQ answer

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Rooms.tsx` | `freeSlots = 0`, `freeRoomSlots = 0` |
| `src/components/rooms/BulkRoomAddDialog.tsx` | `freeSlots = 0` |
| `supabase/functions/verify-subscription-payment/index.ts` | Remove `handleFreeTolet` |
| `supabase/functions/approve-manual-payment/index.ts` | Remove free tolet block |
| DB migration | Update `handle_new_user` to insert trial subscriptions for landlords |
| `src/contexts/LanguageContext.tsx` | Update trial-related landing text |
| `src/pages/Properties.tsx` | Add max-1-property check during trial |

