

# Room Type Auto-Selection by Property Type

## Summary
Remove "Apartment" from property types. Auto-set room type based on property type when adding rooms:
- **Building** → default "flat", options: flat, shop
- **House** → default "room", options: room
- **Shop (দোকান)** → default "shop", options: shop
- **Tin Shed** → forced "room" (already handled)

## Changes

### 1. `src/pages/Properties.tsx` — Remove Apartment
- Remove `apartment` from the property type `<Select>` dropdown (line 477)
- Remove `apartment` from `typeLabels` (line 445)

### 2. `src/components/rooms/RoomFormDialog.tsx` — Smart Room Type
- Accept `propertyType` prop (already passed from Rooms.tsx)
- Replace the current logic (which only checks `isTinShed`) with a mapping:

| Property Type | Available Room Types | Default |
|--------------|---------------------|---------|
| `building` | flat, shop | flat |
| `house` | room | room |
| `shop` | shop | shop |
| `tin_shed` | room (hidden selector) | room |

- When property changes in the form, auto-set `room_type` to the default for that property type
- Show/hide the room type selector based on available options (hide if only 1 option)
- Update `useEffect` to set correct default `room_type` when `propertyType` changes

### 3. `src/pages/Rooms.tsx` — Pass Property Type
- Already passes `propertyType` to RoomFormDialog — no change needed
- Verify the `propertyType` resolves correctly when a property is selected

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Properties.tsx` | Remove apartment option |
| `src/components/rooms/RoomFormDialog.tsx` | Smart room type selection based on property type |

