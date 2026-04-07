

# Bulk Room Add: Property Type Awareness (Tin Shed Simplified Mode)

## Problem
The current Bulk Add dialog is designed for buildings — it asks for floor ranges, bedrooms, bathrooms, amenities, etc. For **Tin Shed** properties (and similar simple types like House/Shop), this is unnecessarily complex. A landlord with a Tin Shed just needs to say "add 15 rooms at ৳X rent each" and be done.

## Approach
Make `BulkRoomAddDialog` property-type-aware. When the selected property is a **tin_shed** (or house/shop), show a **simplified mode**: just room count + rent. For buildings, keep the existing floor-based system.

## Changes

### 1. `src/pages/Rooms.tsx` — Pass `property_type` to BulkRoomAddDialog
- Update the `properties` array passed to include `property_type` (same pattern used for RoomFormDialog)

### 2. `src/components/rooms/BulkRoomAddDialog.tsx` — Simplified Mode for Tin Shed
- Update `Props` to accept `properties` with `property_type`
- Derive `effectivePropertyType` from selected `propertyId`
- When property type is `tin_shed` or `house`:
  - Hide floor range inputs — default floor to 0
  - Show a single "Number of rooms" input (e.g. 1–50)
  - Show a single "Rent per room" input
  - Hide unit templates (bedrooms, bathrooms, amenities, area, drawing/dining/kitchen/roof)
  - Hide Same/Different mode toggle
  - Auto-set `room_type` to "room"
  - Generate room numbers as sequential: Room 1, Room 2, ... Room N
- When property type is `shop`:
  - Similar simplified mode, auto-set `room_type` to "shop"
  - Label as "দোকান" instead of "Room"
- When property type is `building`:
  - Keep existing full floor-based UI with unit templates
  - Filter room_type options to flat/shop only (no "room")

### Room Number Generation (Tin Shed/House/Shop)
- Simple sequential: `1`, `2`, `3` ... or `Room 1`, `Room 2` etc.
- All rooms get same rent, floor=0, no amenities

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Rooms.tsx` | Pass `property_type` in properties array to BulkRoomAddDialog |
| `src/components/rooms/BulkRoomAddDialog.tsx` | Add simplified bulk mode for tin_shed/house/shop; keep full mode for building |

