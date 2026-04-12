

# Asset Management + Service Management + Reports যোগ করা

## বিশ্লেষণ
FlatManage সাইট থেকে যা দেখলাম:

**Asset Management** (৩টি sub-page):
- **Assets**: Name, Category (Electrical Equipment etc.), Condition (Good/Fair/Poor), Property/Tower, Floor, Room, Location, Purchase Date, Document upload
- **Maintenance Schedule**: Asset-wise schedule (monthly/half-year/yearly), Date, Status (Pending/Done), Amount
- **Issue Report**: Issue Title, Asset Name, Status (Pending/Resolved), Priority (Low/Medium/High)

**Service Management** (২টি sub-page):
- **Services**: Service Type categories (Maid, Cook, Driver, School Bus, Doctor, Gardener, Nanny, Milkman, Newspaper, Laundry, Car Cleaner, Tuition Teacher, Gym Instructor, Yoga Instructor, Pet Walker, Sports Teacher, House Keeper, Electrician, Plumber, Carpenter, Pest Control, AC Service, Blood Test, Scrap Dealer, Internet Repair, Cable/TV, Maid Pickup, Staff, Other) + Contact Person, Contact Number, Property/Floor/Room link, Daily Help checkbox, Payment Frequency, Price, Status, Photo
- **Clock-in/Clock-out**: Service Person tracking with date filter, clock-in/out times

**Reports** (আপনার request অনুযায়ী):
- Maintenance Report: কোন asset কতবার repair হয়েছে
- Financial Report: maintenance cost summary

## Implementation Plan

### 1) Database Migration — 5 নতুন table

```sql
-- assets: building/property-level assets
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  property_id uuid REFERENCES properties(id),
  room_id uuid REFERENCES rooms(id),
  name text NOT NULL,
  category text NOT NULL, -- electrical_equipment, plumbing, furniture, etc.
  condition text DEFAULT 'good', -- good, fair, poor, damaged
  location text,
  purchase_date date,
  document_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- asset_maintenance: scheduled maintenance
CREATE TABLE asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  maintenance_date date NOT NULL,
  schedule_type text DEFAULT 'one_time', -- monthly, quarterly, half_year, yearly, one_time
  status text DEFAULT 'pending', -- pending, completed, overdue
  amount numeric DEFAULT 0,
  description text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- asset_issues: issue reports against assets
CREATE TABLE asset_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  status text DEFAULT 'pending', -- pending, in_progress, resolved
  reported_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- services: service providers (maid, plumber, etc.)
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  property_id uuid REFERENCES properties(id),
  room_id uuid REFERENCES rooms(id),
  service_type text NOT NULL,
  is_daily_help boolean DEFAULT false,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  company_name text,
  website_link text,
  payment_frequency text DEFAULT 'per_visit', -- per_visit, daily, weekly, monthly
  price numeric DEFAULT 0,
  description text,
  status text DEFAULT 'available', -- available, unavailable, on_leave
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- service_clock_entries: clock-in/out tracking
CREATE TABLE service_clock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

RLS policies: owner_id = auth.uid() for all CRUD. Tenant read access for services linked to their property.

### 2) নতুন Pages তৈরি

| Route | Page | বিষয়বস্তু |
|-------|------|-----------|
| `/assets` | Assets.tsx | Asset list + Add/Edit dialog, search, filter by property/category/condition |
| `/asset-maintenance` | AssetMaintenance.tsx | Maintenance schedule list, Add/Edit, status update |
| `/asset-issues` | AssetIssues.tsx | Issue report list, Add/Edit, priority filter |
| `/services` | Services.tsx | Service type icon grid (30+ categories) + list, Add/Edit dialog |
| `/service-clock` | ServiceClock.tsx | Clock-in/out log, date range filter |
| `/reports` | Reports.tsx | Tabs: Maintenance Report + Financial Report |

### 3) Components তৈরি

- `AssetFormDialog.tsx` — Add/Edit asset form (name, category, condition, property, room, location, purchase date, document upload)
- `MaintenanceFormDialog.tsx` — Add/Edit maintenance schedule
- `IssueFormDialog.tsx` — Add/Edit issue report
- `ServiceFormDialog.tsx` — Add/Edit service provider with type selection grid
- `ClockEntryDialog.tsx` — Add clock-in/out entry
- `ServiceTypeGrid.tsx` — Icon-based service category selector (Maid, Cook, Driver, etc.)

### 4) Sidebar এ নতুন menu group যোগ

AppSidebar-এ দুটি নতুন group:
- **সম্পদ (Assets)**: Assets, Maintenance Schedule, Issue Report
- **সেবা (Services)**: Services, Clock-in/Clock-out

### 5) Reports Page

**Maintenance Report tab:**
- Property-wise asset maintenance history
- কোন asset কতবার repair হয়েছে (count)
- Total cost per asset
- Date range filter

**Financial Report tab:**
- Monthly/yearly maintenance expense summary
- Service provider payment summary
- Chart visualization (bar/pie)

### 6) Permission Integration

`permissionGroups.ts`-এ নতুন permission যোগ:
- `assets` — Asset management access
- `services` — Service management access

## যেসব file তৈরি/পরিবর্তন হবে

**নতুন files (~12):**
- `src/pages/Assets.tsx`
- `src/pages/AssetMaintenance.tsx`
- `src/pages/AssetIssues.tsx`
- `src/pages/Services.tsx`
- `src/pages/ServiceClock.tsx`
- `src/pages/Reports.tsx`
- `src/components/assets/AssetFormDialog.tsx`
- `src/components/assets/MaintenanceFormDialog.tsx`
- `src/components/assets/IssueFormDialog.tsx`
- `src/components/services/ServiceFormDialog.tsx`
- `src/components/services/ClockEntryDialog.tsx`
- `src/components/services/ServiceTypeGrid.tsx`

**পরিবর্তন (~4):**
- `src/App.tsx` — নতুন routes
- `src/components/AppSidebar.tsx` / `src/hooks/useSidebarOrder.ts` — sidebar items
- `src/lib/permissionGroups.ts` — permissions
- `supabase/migrations/` — DB tables + RLS

## এটা বড় কাজ
এই feature set অনেক বড়। আমি **ধাপে ধাপে** করব — প্রথমে DB + Asset Management, তারপর Service Management, তারপর Reports।

