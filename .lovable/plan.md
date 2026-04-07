

# Fix Property Card Layout

## Problem
Property cards display all information (type badge, facilities, nearby services, sell button, etc.) stacked vertically in a single long column, making cards excessively tall and hard to scan.

## Solution
Restructure the property card to be more compact and horizontal:

1. **Move action buttons (edit, delete, history) to a compact row at the bottom** instead of top-right, freeing horizontal space
2. **Combine facility/service badges into a single compact row** with overflow hidden (show first few, rest hidden)
3. **Make the card layout more horizontal** — property info on left, key stats on right
4. **Limit badge rows** to max 2 lines with overflow, preventing cards from growing indefinitely
5. **Move the Sell button inline** with action buttons at the bottom

### Changes in `src/pages/Properties.tsx` (lines 864-996):
- Restructure card layout: header row with name + type badge + actions
- Address on second line (already compact)
- Single badges section with `max-h` and `overflow-hidden` for facilities
- Tin shed common facilities inline
- Bottom row: sell button + edit/delete/history actions aligned right
- Remove deeply nested div structure that causes the column look

| File | Change |
|------|--------|
| `src/pages/Properties.tsx` | Restructure property card layout (lines ~864-996) to be compact with horizontal grouping |

