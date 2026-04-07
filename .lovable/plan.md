

# Flexiplan-Style Single-Page Subscription Configurator

## Concept

Replace the current 5-tab system with a **single-page configurator** inspired by Grameenphone Flexiplan / Robi Easy Plan. All product categories (Room, To-Let, Sale, Boost, SMS) appear as sections on one page. Each section has **pill/chip selectors** for quantities. A sticky **Purchase Summary** sidebar (or bottom bar on mobile) shows the running total and Buy button.

## Layout

```text
┌─────────────────────────────────────┬──────────────────────┐
│  🏠 রুম/ফ্ল্যাট                     │  Purchase Summary    │
│  [0] [5] [10] [15] [20] [30] [50]   │                      │
│                                     │  ✓ 10 রুম × 6 মাস   │
│  📢 টু-লেট                          │  ✓ 2 টু-লেট × 1 মাস │
│  [0] [1] [2] [3] [5] [10]          │  ✓ 100 SMS           │
│                                     │                      │
│  🛒 বিক্রয় লিস্টিং                  │  মোট: ৳1,150        │
│  [0] [1] [2] [3] [5]               │                      │
│                                     │  [কিনুন]             │
│  ⏱ মেয়াদ                           │                      │
│  [1] [3] [6] [12] [24] [36] মাস    │  ── Payment History  │
│                                     │  ── Manual Payment   │
│  🔥 বুস্ট                           │                      │
│  3 দিন: [0] [1] [3] [5] [10]       │                      │
│  7 দিন: [0] [1] [3] [5] [10]       │                      │
│                                     │                      │
│  💬 SMS                              │                      │
│  [0] [100] [200] [500] [1000]       │                      │
│                                     │                      │
│  🎟 কুপন কোড                        │                      │
│  [____________] [প্রয়োগ]            │                      │
└─────────────────────────────────────┴──────────────────────┘
```

**Mobile**: Summary becomes a sticky bottom bar showing total price + "কিনুন" button. Tap to expand full summary.

## Key Design Decisions

1. **Pill/Chip Selectors** (like GP Flexiplan): Predefined value chips in a flex-wrap grid. Selected chip is highlighted (primary color). User taps to select quantity.
2. **Duration is shared**: One duration selector applies to Room, To-Let, and Sale (since they all use monthly billing). Boost and SMS have no duration.
3. **Zero means "not selected"**: Each category starts at 0. Only non-zero items appear in the summary.
4. **Sticky Summary Panel**: Right side on desktop (like GP/Robi), bottom sticky bar on mobile.
5. **Discount auto-calculated**: Duration discount (6+ months) shown in summary with strikethrough.

## Files to Modify

### 1. `src/pages/Subscription.tsx` — Complete rewrite
- Remove Tabs, replace with single-page vertical layout
- Each product section: label + chip grid
- Duration section with chips: 1, 3, 6, 12, 24, 36
- Sticky summary panel (desktop: right column, mobile: bottom bar)
- Keep existing: payment verification, history dialog, active subscriptions card, manual payment
- Remove: slider+buttons UI, per-tab coupon inputs, per-tab buy buttons
- Single "Buy" button in summary that adds all selected items to cart or goes to checkout

### 2. No backend changes needed
- Cart system already supports multi-item checkout
- Edge functions already handle cart payments

## Chip Values Per Section

| Section | Chips |
|---------|-------|
| Room/Flat | 0, 5, 10, 15, 20, 30, 50 |
| To-Let | 0, 1, 2, 3, 5, 10 |
| Sale Listing | 0, 1, 2, 3, 5 |
| Duration (months) | 1, 3, 6, 12, 24, 36 |
| 3-Day Boost | 0, 1, 3, 5, 10 |
| 7-Day Boost | 0, 1, 3, 5, 10 |
| SMS | 0, 100, 200, 500, 1000 |

## Summary Panel Contents
- Line items for each non-zero selection with price
- Duration discount badge (if applicable)
- Special landlord discount (if applicable)
- Total price (bold, large)
- "কার্টে যোগ করুন" button
- "ম্যানুয়াল পেমেন্ট" link
- Links: Payment Status, Purchase History

## Active Subscriptions
- Keep the existing active subscription display at the top (compact)
- Show remaining balance for boost and SMS

