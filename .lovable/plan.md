

## Plan: Fix Comparison Icons, Add Scroll-to-Top on Landing, Make All Content Editable

### 1. Fix Comparison Table Icons (same style for all rows)

**Problem**: The comparison table uses different icons per column/row — `CheckCircle2` (pink), `XCircle` (pink/orange), `Check`, `X` with different colors. User wants consistent icons.

**Fix** in `LandingPage.tsx` (lines 301-316):
- VIP Bari column: `CheckCircle2` green for all rows (✓ supported)
- Manual column: `XCircle` red for all rows (✗ not supported)  
- Excel column: Use a consistent partial icon — `CheckCircle2` orange for partial, `XCircle` red for no. Keep simple: rows 3-5 get orange check (partial), rest get red X.

### 2. Add Scroll-to-Top Button on Landing Page

**Problem**: `ScrollToTop` component exists but only used in `AppLayout` (authenticated pages). Landing page scrolls `window`, not `<main>`.

**Fix**:
- Update `ScrollToTop` component to also listen to `window` scroll (fallback when no `<main>` element or when `<main>` scrollTop is 0)
- Add `<ScrollToTop />` to `LandingPage.tsx` before `<LandingFooter />`

### 3. Make ALL Home Page Sections Editable from Admin

**Problem**: Several sections use hardcoded `t()` translation keys instead of `lc()` (database-backed content): `WhySection`, `WhoUsesSection`, `BenefitsSection`, `PaymentMethodsSection`, `InstallSection`, `ToLetHighlight`, `HeroSection`.

**Approach**: Convert these sections to use `useLandingContent()` hook with `lc(dbKey, fallbackTranslationKey)` pattern, so they keep working with existing translations but can be overridden from admin.

**Changes**:

**a) Add new admin groups** in `AdminLanding.tsx` GROUPS array:
- `{ key: "hero", label: "Hero" }` — already exists
- `{ key: "why", label: "Why VIP Bari" }`
- `{ key: "tolet_hl", label: "To-Let Highlight" }`
- `{ key: "who", label: "Who Uses" }`
- `{ key: "benefits", label: "Benefits" }`
- `{ key: "payment", label: "Payment Methods" }`
- `{ key: "install", label: "Install" }`

**b) Update each section component** to import and use `useLandingContent`:

- **WhySection.tsx**: Replace `t("landing.why_badge")` → `lc("why_badge", "landing.why_badge")`, etc. for all 4 items
- **WhoUsesSection.tsx**: Same pattern for badge, title, 4 items
- **BenefitsSection.tsx**: Same pattern for badge, title, 4 items  
- **PaymentMethodsSection.tsx**: Same pattern for title, subtitle, 3 methods
- **InstallSection.tsx**: Same pattern for badge, title, subtitle, step descriptions
- **ToLetHighlight.tsx**: Same pattern for badge, title, desc, bullets, button labels
- **HeroSection.tsx**: Same pattern for hero_title, hero_sub, badges

Each section keeps its current text as fallback via the translation key, so nothing breaks if no DB entry exists.

### Files Modified
1. `src/pages/LandingPage.tsx` — fix comparison icons, add ScrollToTop
2. `src/components/ScrollToTop.tsx` — support window scroll (for landing page)
3. `src/components/landing/WhySection.tsx` — use `lc()` 
4. `src/components/landing/WhoUsesSection.tsx` — use `lc()`
5. `src/components/landing/BenefitsSection.tsx` — use `lc()`
6. `src/components/landing/PaymentMethodsSection.tsx` — use `lc()`
7. `src/components/landing/InstallSection.tsx` — use `lc()`
8. `src/components/landing/ToLetHighlight.tsx` — use `lc()`
9. `src/components/landing/HeroSection.tsx` — use `lc()`
10. `src/pages/admin/AdminLanding.tsx` — add new section groups

