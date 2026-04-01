

# Bulk Room/Unit Add — Enhanced Features

The existing `BulkRoomAddDialog.tsx` already has "Same units" and "Different units" modes with unit templates, copy-from-floor, and preview. The request adds three enhancements:

## What Changes

### 1. "Number of units per floor" input in Same Mode
- Add a numeric input field labeled "প্রতি তলায় ইউনিট সংখ্যা / Number of units per floor" in Same mode
- When user types a number (e.g. 4), auto-generate that many unit cards (Unit 1, Unit 2, etc.) with sequential labels (A, B, C, D)
- Replace the current manual "Add Unit" as the primary way to set count, but keep "Add Unit" button for adding more beyond the initial count
- Units appear sequentially with a `ScrollArea` (max-height ~50vh) for easy scrolling

### 2. Hide "Number of units per floor" in Different Mode
- Already works this way — Different mode shows per-floor accordion with individual add buttons. No change needed here except ensuring the new input is only in Same mode.

### 3. Advanced Configuration — Symmetry/Cloning
Add a collapsible "Advanced" section inside Same mode (below the units-per-floor input):

- **Checkbox**: "সিমেট্রিক্যাল ইউনিট / Symmetrical units" — when enabled, shows grouping UI
- **Group assignment**: Each unit card gets a "Group" dropdown (Group A, Group B, etc.)
- Units in the same group share identical config — editing one auto-updates all others in that group
- Example: 4 units → assign Unit 1 & Unit 2 to Group A, Unit 3 & Unit 4 to Group B → editing Unit 1 updates Unit 2 automatically
- A small badge on each unit card shows its group color
- **"Clone to all floors"** is already handled by the Same mode logic (same template applied to every floor)

## File Changes

**`src/components/rooms/BulkRoomAddDialog.tsx`** — single file edit:

1. Add state: `unitsPerFloor` (string), `symmetryEnabled` (boolean), `unitGroups` (Record<string, string> mapping unit id → group letter)
2. Same mode section: Add "Units per floor" Input above unit cards. On change, auto-set `units` array to that count
3. Wrap unit cards in a `ScrollArea` with `max-h-[45vh]`
4. Add collapsible "Advanced" section with symmetry toggle
5. When symmetry enabled: add Group selector (A/B/C/D) dropdown to each `UnitCard`
6. On unit field update: if symmetry enabled, propagate changes to all units in the same group
7. Labels in Bangla/English with fallbacks (no raw keys)

## UI Flow

```text
┌─ Same units for all floors ─────────────────┐
│ প্রতি তলায় ইউনিট সংখ্যা: [4]              │
│                                              │
│ ┌─ ScrollArea ─────────────────────────────┐ │
│ │ Unit 1 (Group A) [form fields...]        │ │
│ │ Unit 2 (Group A) [form fields...]        │ │
│ │ Unit 3 (Group B) [form fields...]        │ │
│ │ Unit 4 (Group B) [form fields...]        │ │
│ └──────────────────────────────────────────┘ │
│ [+ Add Unit]                                 │
│                                              │
│ ▸ Advanced Configuration                     │
│   ☑ Symmetrical units                        │
│   Group A: Unit 1, Unit 2                    │
│   Group B: Unit 3, Unit 4                    │
└──────────────────────────────────────────────┘
```

No database changes needed — all logic is UI-side template generation before the existing insert.

