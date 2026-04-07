

# Default Images for All Property Types

## Problem
Currently the app references `/images/default-room.png` and `/images/default-garage.png` which don't exist in the `public` folder. This causes broken/missing images on To-Let, Buy-Sell, Listing Detail, and My Listings pages when users haven't uploaded photos.

## Solution
Generate beautiful SVG default images for each property type and create a central helper, then update all references.

### Step 1: Create Default Image SVGs
Generate 5 attractive SVG images in `public/images/`:
- `default-room.svg` — bedroom/flat illustration (bed, window, warm colors)
- `default-apartment.svg` — apartment building illustration
- `default-garage.svg` — parking/garage illustration (car, gate)
- `default-shop.svg` — shop/store front illustration
- `default-property.svg` — generic building/house illustration (fallback)

Each SVG will be a clean, modern illustration with soft gradients — professional-looking placeholders that make the site look polished even without user photos.

### Step 2: Create Helper Utility
New file `src/lib/defaultImages.ts`:
```typescript
export function getDefaultImage(type?: string): string {
  switch (type) {
    case "garage": return "/images/default-garage.svg";
    case "shop": return "/images/default-shop.svg";
    case "apartment": return "/images/default-apartment.svg";
    case "flat":
    case "room":
    case "tin_shed":
      return "/images/default-room.svg";
    default:
      return "/images/default-property.svg";
  }
}
```

### Step 3: Update All References

| File | Current | Change |
|------|---------|--------|
| `src/pages/ToLet.tsx` | `/images/default-room.png`, `/images/default-garage.png` | Use `getDefaultImage()` based on room type |
| `src/pages/tenant/TenantToLet.tsx` | Same broken paths | Use `getDefaultImage()` |
| `src/pages/ListingDetail.tsx` | Same broken paths | Use `getDefaultImage()` |
| `src/pages/MyListings.tsx` | `/images/default-room.png` | Use `getDefaultImage(property_type)` |
| `src/components/sale/SaleListingCard.tsx` | `/placeholder.svg` | Use `getDefaultImage(property_type)` |
| `src/pages/SaleListingDetail.tsx` | `/placeholder.svg` | Use `getDefaultImage(property_type)` |
| `src/pages/BuySell.tsx` | No change needed (uses SaleListingCard) | — |

All 6 files with broken or generic fallback images will be updated to show type-appropriate default images.

