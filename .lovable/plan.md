

# Tin Shed / Common Rental System Module

## Summary
Add a new property type "tin_shed" that represents shared-facility rental properties common in Bangladesh. When selected, the system simplifies room creation (no flat/unit options), stores common facility counts on the property, and auto-includes utilities in billing.

## Database Changes (1 migration)

**Add columns to `properties` table:**
```sql
ALTER TABLE properties
  ADD COLUMN common_bathrooms integer NOT NULL DEFAULT 0,
  ADD COLUMN common_washrooms integer NOT NULL DEFAULT 0,
  ADD COLUMN common_kitchens integer NOT NULL DEFAULT 0,
  ADD COLUMN common_stoves integer NOT NULL DEFAULT 0,
  ADD COLUMN utilities_included boolean NOT NULL DEFAULT false;
```

No new tables needed. The existing `properties` and `rooms` tables handle everything. The `common_facilities` data lives as columns on `properties` (simpler than JSON for queries/display).

## Frontend Changes

### 1. `src/pages/Properties.tsx`
- Add `"tin_shed"` to property type dropdown with label "টিনশেড / কমন" / "Tin Shed / Common"
- Add `typeLabels.tin_shed`
- When `property_type === "tin_shed"`:
  - Show **Common Facilities section** with number inputs: bathrooms, washrooms, kitchens, stoves
  - Show **Utilities Included** toggle (default: on)
  - Hide irrelevant facilities (lift, generator, CCTV, etc.) — keep only gas, water, electricity
- Update `defaultForm` to include new fields: `common_bathrooms: 0`, `common_washrooms: 0`, `common_kitchens: 0`, `common_stoves: 0`, `utilities_included: false`
- Save/update these fields in create/update mutations
- On property cards: show "🏠 টিনশেড" badge and common facility summary when type is tin_shed
- Show occupancy rate badge (e.g., "10/15 ভাড়া দেওয়া")

### 2. `src/components/rooms/RoomFormDialog.tsx`
- Accept a new prop: `propertyType?: string`
- When `propertyType === "tin_shed"`:
  - Force `room_type = "room"` (hide type selector, no flat/shop)
  - Hide bedrooms, bathrooms, drawing room, dining room, kitchen, balconies, area_sqft fields
  - Show only: Room Number, Floor, Rent Amount, Description
  - Show read-only info: "সব ইউটিলিটি ভাড়ায় অন্তর্ভুক্ত" (Utilities included in rent)

### 3. `src/pages/Rooms.tsx`
- Pass `propertyType` to `RoomFormDialog` based on selected property
- On room cards for tin_shed properties:
  - Show "কমন সুবিধা" badge
  - Display shared facility counts from property data
  - Show "ইউটিলিটি অন্তর্ভুক্ত" badge

### 4. `src/components/rooms/BulkRoomAddDialog.tsx`
- When property is tin_shed type, simplify the bulk form (only room number prefix + count + rent)

### 5. Bills Logic (`src/pages/Bills.tsx` / bill generation)
- When generating bills for tin_shed property rooms:
  - Auto-set electricity, gas, water charges to 0
  - Only charge rent_amount + optional other_charges
  - Show "ইউটিলিটি অন্তর্ভুক্ত" label on bill

### 6. To-Let Listing Display
- When listing tin_shed rooms on to-let, show common facilities and "utilities included" badge

## Files to Modify

| File | Change |
|------|--------|
| DB migration | Add 5 columns to `properties` |
| `src/pages/Properties.tsx` | Add tin_shed type, common facilities form section, badges |
| `src/components/rooms/RoomFormDialog.tsx` | Simplified form when tin_shed |
| `src/pages/Rooms.tsx` | Pass propertyType, show facility badges |
| `src/components/rooms/BulkRoomAddDialog.tsx` | Simplified bulk add for tin_shed |
| `src/pages/Bills.tsx` | Zero utility charges for tin_shed |
| `src/contexts/LanguageContext.tsx` | Add translation keys for tin_shed labels |

## Not Changing
- Tenant management — already links tenant → room → property, works as-is
- No new tables or RLS policies needed
- Existing property_type is a text column, so adding "tin_shed" needs no enum change

