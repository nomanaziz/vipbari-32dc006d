

## Plan: Lease Management Feature + Scroll-to-Top Button

Two features: (1) A full Lease management page similar to To-Let, and (2) a global scroll-to-top button.

---

### 1. Database Migration — `leases` table

Create a new `leases` table:

```sql
CREATE TABLE public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  unit_flat TEXT,
  monthly_rent NUMERIC DEFAULT 0,
  security_deposit NUMERIC DEFAULT 0,
  advance_amount NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  notice_period TEXT DEFAULT '2 Months',
  status TEXT DEFAULT 'active',  -- active, expired, terminated
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own leases" ON public.leases
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

### 2. New Page — `src/pages/Leases.tsx`

Full page with:
- Header: "লিজ চুক্তি / Leases" with subtitle "Manage lease agreements and contractual timelines"
- **Stats cards** at top: Total Leases, Active, Expiring Soon (within 30 days), Expired
- **Property filter dropdown** (like To-Let filters)
- **Table view** showing: Tenant Name, Property, Unit/Flat, Monthly Rent, Start Date, End Date, Status, Actions
- **"+ New Lease" button** opening a dialog

### 3. New Dialog — `src/components/leases/LeaseFormDialog.tsx`

Form fields matching the reference image:
- Tenant Name (text input, placeholder "e.g. Rahim Uddin")
- Property (select from owner's properties) + Unit/Flat (text input)
- Monthly Rent (৳) + Security Deposit (৳)
- Start Date + End Date (date inputs)
- Notice Period (select: 1 Month, 2 Months, 3 Months)
- Cancel + "Create Lease" buttons

Supports both create and edit modes.

### 4. Routing & Navigation

- Add route `/leases` in `App.tsx` as a protected lazy route
- Add "লিজ / Leases" to sidebar under **Tenant Management** group (with `FileText` icon) in `AppSidebar.tsx`
- Add to `MobileBottomNav.tsx` more items

### 5. Scroll-to-Top Button — `src/components/ScrollToTop.tsx`

A floating button (bottom-right, above mobile nav) that appears when user scrolls down 300px+. Clicking smoothly scrolls to top. Uses `ArrowUp` icon with a subtle animation.

Add this component to `AppLayout.tsx` so it appears on all authenticated pages.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/create_leases_table.sql` | New — DB migration |
| `src/pages/Leases.tsx` | New — Main lease page with table, stats, filters |
| `src/components/leases/LeaseFormDialog.tsx` | New — Create/edit lease dialog |
| `src/components/ScrollToTop.tsx` | New — Scroll-to-top floating button |
| `src/App.tsx` | Add `/leases` route |
| `src/components/AppSidebar.tsx` | Add Leases nav item |
| `src/components/MobileBottomNav.tsx` | Add Leases to more menu |
| `src/components/AppLayout.tsx` | Include ScrollToTop component |
| `src/integrations/supabase/types.ts` | Will auto-update after migration |

