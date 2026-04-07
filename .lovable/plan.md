

# Fix: Dynamic Room Type Based on Selected Property

## Problem
When adding a room, if `selectedProperty` filter is "all", `propertyType` is `undefined` — so the fallback shows all options (room, flat, shop) regardless of property type. Even when the user picks a tin_shed or house property inside the dialog, "flat" still appears.

## Fix

### `src/components/rooms/RoomFormDialog.tsx`
- Change `properties` prop type from `{ id: string; name: string }[]` to `{ id: string; name: string; property_type?: string }[]`
- Derive `effectivePropertyType` from the form's `property_id` by looking up the property type from the `properties` array: `properties.find(p => p.id === form.property_id)?.property_type`
- Use `effectivePropertyType` (falling back to `propertyType` prop) for the room type config lookup
- When user changes `property_id` in the form, auto-update `room_type` to the new property's default

### `src/pages/Rooms.tsx`
- Pass `property_type` in the `properties` array to `RoomFormDialog` (currently only passes `id` and `name`)

### `src/pages/admin/AdminRooms.tsx`
- No change needed (admin doesn't use RoomFormDialog)

