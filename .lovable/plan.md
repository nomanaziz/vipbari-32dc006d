

# Fix Dark Mode Brightness & Tenants Mobile Layout

## Issue 1: Dark mode too dark — add brightness

The dark mode background is `270 20% 6%` (very dark). Cards are `270 20% 8%`. These need lightening for better readability.

**Fix in `src/index.css`** — Increase lightness values in `.dark` block:
- `--background`: `270 20% 6%` → `270 15% 12%`
- `--card`: `270 20% 8%` → `270 15% 15%`
- `--popover`: same as card → `270 15% 15%`
- `--secondary`: `270 15% 15%` → `270 12% 20%`
- `--muted`: `270 15% 15%` → `270 12% 20%`
- `--accent`: `270 30% 20%` → `270 20% 24%`
- `--border`: `270 15% 18%` → `270 12% 22%`
- `--input`: same → `270 12% 22%`
- `--sidebar-background`: `270 40% 11%` → `270 25% 16%`
- `--sidebar-accent`: `270 40% 16%` → `270 25% 22%`
- `--sidebar-border`: `270 40% 18%` → `270 20% 24%`

Also update dark variants in green/blue/yellow presets similarly.

## Issue 2: Tenants page not fitting mobile (390px)

From the screenshot, the header buttons overflow and the "ভাড়াটিয়া যোগ করুন" button text gets cut off. Filter dropdowns also overflow.

**Fix in `src/pages/Tenants.tsx`**:
- Header buttons: On mobile, stack them or use icon-only buttons. Change `<div className="flex gap-2">` to `<div className="flex gap-2 flex-wrap">`
- Shorten button text on mobile or use `text-xs` and smaller padding
- Filter row: Change fixed widths `w-[160px]` and `w-[180px]` to responsive `w-full sm:w-[160px]` etc., and make the row stack on mobile
- Search input: Remove `max-w-sm` on mobile

**Fix in `src/components/tenants/TenantStatsCards.tsx`**:
- The stats cards gradient backgrounds use hardcoded light colors (`from-pink-50`) that don't adapt to dark mode. Add dark mode variants.

## Files to Change

1. **`src/index.css`** — Lighten all dark mode CSS variables
2. **`src/pages/Tenants.tsx`** — Make header buttons, filters responsive for 390px
3. **`src/components/tenants/TenantStatsCards.tsx`** — Add dark mode gradient support

