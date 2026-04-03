

# Add-to-Cart Shopping System for Subscription Page

## Summary

Replace the current "buy each item separately" flow with a unified cart system. Users configure items (Room, To-Let, Sale Listing, Boosting, SMS) → add to cart → review cart → single checkout → one payment for everything.

## Current State

- `Subscription.tsx` (1330 lines) has 4 tabs: Room/Flat, To-Let, Sale Listing, Boosting
- Each tab has its own "Buy Now" and "Manual Payment" buttons → separate payment per item
- Payment goes through `create-subscription-payment` or `create-boost-payment` edge functions
- Verification via `verify-subscription-payment` edge function
- No SMS feature exists yet

## Database Changes

1. **New table: `sms_balances`** — Track SMS credits per user
   - `id`, `user_id`, `total_count`, `used_count`, `created_at`
   - RLS: owner can read own, admin can manage all

2. **No other schema changes needed** — Cart is client-side state (localStorage). The existing `subscription_payments` table already supports `metadata` JSONB for storing multi-item order details. The edge function will process the combined order.

## New Edge Function

**`create-cart-payment`** — Accepts an array of cart items, calculates server-side total, creates one payment request, inserts one `subscription_payments` row with all items in `metadata`.

Request body:
```json
{
  "items": [
    { "type": "room_management", "count": 5, "duration_months": 6 },
    { "type": "tolet", "count": 2, "duration_months": 6 },
    { "type": "boost_3_day", "count": 3 },
    { "type": "sms", "count": 200 }
  ],
  "coupon_code": null,
  "success_url": "...",
  "cancel_url": "..."
}
```

## Updated Edge Function

**`verify-subscription-payment`** — After payment verified, loop through `metadata.items` array and activate each item type (create subscriptions, add boost balances, add SMS credits).

## Frontend Components

### 1. Cart Context (`src/contexts/CartContext.tsx`)
- React context with `useCart()` hook
- State: `items[]`, each with `type`, `count`, `duration`, `unitPrice`, `total`
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- Persisted in `localStorage`

### 2. Cart Icon in Sidebar (`AppSidebar.tsx`)
- Shopping cart icon with badge count next to Subscription menu item
- Or floating cart button on subscription page

### 3. Redesigned Subscription Page (`Subscription.tsx`)
- Keep the same tabs (Room, To-Let, Sale, Boosting) + add new **SMS** tab
- Replace "Buy Now" buttons with **"Add to Cart"** buttons
- Each tab still has configurator (count, duration sliders)
- After adding, show toast "Added to cart"
- "Manual Payment" buttons remain per-item (unchanged)

### 4. New SMS Tab
- SMS packages: 100, 200, 500, 1000 SMS
- Price: ৳0.50/SMS (configurable)
- Minimum 100 SMS purchase
- Show current SMS balance

### 5. Cart Drawer/Page (`src/components/subscription/CartDrawer.tsx`)
- Slide-out drawer or section at bottom of subscription page
- Shows all cart items: name, qty, unit price, line total
- Edit quantity / remove items
- Subtotal + Grand Total
- "Checkout — ৳X" button → calls `create-cart-payment`
- "Manual Payment" option for the whole cart

## Flow

```text
[Tab: Room] → Configure → "Add to Cart" →
[Tab: To-Let] → Configure → "Add to Cart" →
[Tab: Boost] → Configure → "Add to Cart" →
[Tab: SMS] → Select package → "Add to Cart" →
                    ↓
         [Cart Drawer opens]
     Item list + quantities + totals
                    ↓
          [Checkout ৳Total]
                    ↓
       → create-cart-payment edge fn
       → Recharge Server payment URL
       → User pays once
                    ↓
       → Redirect back with txn ID
       → verify-subscription-payment
       → Activate all items at once
```

## Files to Create/Modify

1. **Create** `src/contexts/CartContext.tsx` — Cart state management
2. **Create** `src/components/subscription/CartDrawer.tsx` — Cart UI component
3. **Create** `supabase/functions/create-cart-payment/index.ts` — Combined payment edge function
4. **Modify** `src/pages/Subscription.tsx` — Replace "Buy Now" with "Add to Cart", add SMS tab, add cart drawer trigger
5. **Modify** `supabase/functions/verify-subscription-payment/index.ts` — Handle multi-item activation from cart metadata
6. **Modify** `src/components/subscription/ManualPaymentDialog.tsx` — Support cart-based manual payment
7. **Modify** `src/App.tsx` — Wrap with CartProvider
8. **DB Migration** — Create `sms_balances` table with RLS

## SMS Pricing

- ৳0.50 per SMS (PRICE_PER_SMS = 0.5)
- Packages: 100 (৳50), 200 (৳100), 500 (৳250), 1000 (৳500)
- Minimum: 100 SMS
- No duration — SMS credits don't expire

