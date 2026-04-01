

## Plan: Add Feature Pages, Update Nav & Footer, Add Install Pop Notification

### 1. Add New Feature Detail Pages (To-Let, Buy-Sell, Lease Management)

The existing `FeatureDetailPage.tsx` uses slug-based routing (`/features/:slug`). Currently it supports 7 slugs. We need to add 3 new slugs with full page data:

- `/features/tolet` — About the To-Let feature
- `/features/buy-sell` — About Buy & Sell feature  
- `/features/lease-management` — About Lease Management feature

**Files:** `src/pages/FeatureDetailPage.tsx` — add entries to `featureIcons`, `featureColors`, and the main `featureData` map for the 3 new slugs with Bangla/English content.

### 2. Add New Features to Nav Dropdown

Add the 3 new feature links to the Features dropdown menu in the navbar (both desktop and mobile).

**Files:** 
- `src/components/PublicNavbar.tsx` — add to `featureLinks` array:
  - `{ slug: "tolet", icon: Home, titleKey: ... }`
  - `{ slug: "buy-sell", icon: ShoppingBag, titleKey: ... }`
  - `{ slug: "lease-management", icon: FileText, titleKey: ... }`
- `src/components/LandingFooter.tsx` — add same 3 links to footer `featureLinks` array

### 3. Remove "কিভাবে কাজ করে" from Nav, Add to Footer

- **PublicNavbar.tsx**: Remove the `scrollToSection("how")` button from both desktop nav (line 113-116) and mobile menu (line 190-193)
- **LandingFooter.tsx**: Add a "কিভাবে কাজ করে / How It Works" link to the Quick Links section pointing to `/#how`

### 4. Add Small Pop-up Install Notification

Replace the current full-width bottom banner (`PWAInstallBanner`) with a small, compact pop-up notification style (toast-like, bottom-right corner on desktop, bottom-center on mobile). Small card with app icon, "Install App" text, Install button, and dismiss X. Auto-dismisses after 10 seconds. Shows once per session.

**Files:** `src/components/PWAInstallBanner.tsx` — redesign to a small floating pop notification instead of full-width banner.

### Technical Details

- All new feature page content will use plain readable Bangla/English text (per memory preference), not translation keys
- The `FeatureDetailPage` already handles unknown slugs with a "not found" state, so the 3 new slugs just need data entries
- For the install pop notification, use `fixed bottom-4 right-4` positioning with `max-w-[280px]`, rounded card with shadow, animate-in from bottom

