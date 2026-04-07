

# Tin Shed: Hide Room-Level Amenities, Show Only Property Facilities

## Problem
Tin Shed properties have shared/common amenities — no individual room amenities like Drawing Room, Dining Room, Kitchen, Balcony, Roof Access, Bedrooms, Bathrooms, or Area. Currently these still appear in both the room form and the amenity badges display.

## Changes

### 1. `src/components/rooms/RoomFormDialog.tsx`
Already partially done — the form hides bedrooms/bathrooms, amenity checkboxes, balconies, and area for tin_shed. Verify `isTinShed` is derived from `effectivePropertyType` (it is). **No changes needed** — form already handles this correctly.

### 2. `src/components/rooms/RoomAmenityBadges.tsx`
- Accept `propertyType` prop (or derive from `property?.property_type`)
- When `property_type === "tin_shed"`, skip all room-level amenities (bedrooms, bathrooms, kitchen, drawing room, dining room, balconies, roof access, area_sqft)
- Only show property-level facilities (garage, internet, CCTV, lift, etc.)

### Files to Modify
| File | Change |
|------|--------|
| `src/components/rooms/RoomAmenityBadges.tsx` | Skip room-level amenities for tin_shed, only show property facilities |

