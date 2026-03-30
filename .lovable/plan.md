

## Plan: Match Comparison Table Icons to Reference Image

Based on the reference image, the icon pattern should be:

| Row | Feature | VIP Bari | Manual | Excel |
|-----|---------|----------|--------|-------|
| 0 | Auto Bill Generation | ✓ circle (pink outline) | ✗ circle (pink outline) | ✗ circle (orange) |
| 1 | Send Bills via Mobile | ✓ circle (pink outline) | ✗ circle (pink outline) | ✗ circle (orange) |
| 2 | Payment Tracking | ✓ circle (pink outline) | ✗ circle (pink outline) | ✓ checkmark (dark, no circle) |
| 3 | Real-time Reports | ✓ circle (pink outline) | ✗ circle (pink outline) | ✓ checkmark (dark, no circle) |
| 4 | Data Backup | ✓ circle (pink outline) | ✗ circle (pink outline) | ✓ checkmark (dark, no circle) |
| 5 | To-Let Management | ✓ circle (pink outline) | ✗ circle (pink outline) | ✗ scissors/cross (dark, no circle) |

### Changes to `src/pages/LandingPage.tsx`

**Import `Check` and `X` from lucide-react** (plain icons without circles) for the Excel column's handwritten-style marks.

**Update the Excel column logic (lines 296-300)**:
- Rows 0-1: `XCircle` in `text-orange-500` (circled X)
- Rows 2-4: `Check` in `text-gray-800` with `strokeWidth={3}` (bold checkmark, no circle)
- Row 5: `X` in `text-gray-800` with `strokeWidth={3}` (bold X, no circle)

**Update VIP Bari column**: Use `CheckCircle2` with `text-pink-500` to match the pink outlined style in the image.

**Update Manual column**: Use `XCircle` with `text-pink-500`.

### File Modified
| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Update icon styles and logic for all 3 columns to match reference |

