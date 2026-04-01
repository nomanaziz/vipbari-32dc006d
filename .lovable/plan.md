

# "Different Units" Mode — Redesign

## Current Problem
The "Different units per floor" mode currently shows separate accordion per floor, implying each floor can have completely different units. But the user's actual need is different: **units differ by position (A, B, C, D), NOT by floor**. All "A" units across all floors are identical, all "B" units are identical, etc.

## New Logic
"Different units" means: define unit **types** (A, B, C, D) where each type has its own configuration, then apply ALL types to every floor. This is essentially the "Same" mode's symmetry feature but as the default behavior.

**Example**: 4 units per floor → Unit A (2-bed flat), Unit B (3-bed flat), Unit C (shop), Unit D (2-bed flat). Every floor gets all 4, with A identical across floors, B identical across floors, etc.

## Changes to `BulkRoomAddDialog.tsx`

### Different Mode UI Rebuild
1. **Remove** the per-floor accordion UI in different mode
2. **Add** "প্রতি তলায় ইউনিট সংখ্যা" (Units per floor) input — same as in Same mode
3. Show unit template cards (Unit A, Unit B, Unit C, Unit D) — each independently configurable
4. Wrap in `ScrollArea` with `max-h-[45vh]`
5. Each unit type is applied to ALL floors — the room number generated as `{floor}{label}` (e.g., 1A, 2A, 3A...)

### Same Mode Stays As-Is
Same mode already works: one template repeated across all floors. Keep it.

### Remove Redundant Different Mode State
- `floorUnits` state and per-floor helpers (`addFloorUnit`, `removeFloorUnit`, `updateFloorUnit`, `copyFromFloor`) become unused in the new different mode
- Different mode now uses the same `units` array but WITHOUT symmetry grouping — each unit is independently editable

### Key Difference Between Modes
- **Same**: All units share identical config (one template × N units × M floors)
- **Different**: Each unit position (A, B, C, D) has its own config, applied to every floor

### Submit Logic
Both modes generate the same way: for each floor, for each unit template → create room. The `buildRow` function remains unchanged.

## UI Flow (Different Mode)

```text
┌─ Different units per position ──────────────┐
│ প্রতি তলায় ইউনিট সংখ্যা: [4]              │
│                                              │
│ ┌─ ScrollArea ─────────────────────────────┐ │
│ │ ইউনিট A: [flat, ৳8000, 2-bed, 1-bath]  │ │
│ │ ইউনিট B: [flat, ৳10000, 3-bed, 2-bath] │ │
│ │ ইউনিট C: [shop, ৳15000, 0-bed, 1-bath] │ │
│ │ ইউনিট D: [flat, ৳8000, 2-bed, 1-bath]  │ │
│ └──────────────────────────────────────────┘ │
│ [+ ইউনিট যোগ করুন]                          │
│                                              │
│ প্রতিটি ইউনিট টাইপ সকল তলায় প্রযোজ্য হবে  │
└──────────────────────────────────────────────┘
```

### Label Update
- Radio label: "Different units per floor" → "আলাদা আলাদা ইউনিট / Different unit types" (to clarify it's per-position, not per-floor)

No database changes needed.

