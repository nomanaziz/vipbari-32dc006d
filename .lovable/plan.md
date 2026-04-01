

# Staff Full Details & Salary Management

## Summary
Enhance the staff system with detailed personal info (addresses, NID, DOB, photo, salary) and a salary payment feature that auto-records to accounting. Merge the separate "Position" and "Role/Preset" fields into one since they serve the same purpose.

## Database Changes

### 1. New table: `staff_details`
Stores extended staff info linked to `staff_assignments`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| staff_assignment_id | uuid FK → staff_assignments | unique |
| permanent_address | text | |
| present_address | text | |
| nid_number | text | NID / Birth cert number |
| doc_type | text | 'nid' / 'birth_certificate' / 'passport' |
| date_of_birth | date | |
| photo_url | text | Avatar/photo |
| salary | numeric | Monthly salary amount |
| joining_date | date | |
| created_at / updated_at | timestamptz | |

RLS: owner can manage (via staff_assignments.assigned_by), admin full access.

### 2. New table: `salary_payments`
Tracks paid salaries per staff per month.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| staff_assignment_id | uuid FK | |
| owner_id | uuid | Landlord who pays |
| amount | numeric | |
| month | text | e.g. "2026-04" |
| payment_date | date | |
| notes | text | |
| created_at | timestamptz | |

RLS: owner manages own records. On insert, auto-create an accounting_entry (type: expense, category: staff_salary).

### 3. Remove `staff_type` from `staff_assignments`
Merge Position into Role — the preset already serves as the role/position. Remove `staff_type` column usage from UI. The preset name (Manager, Caretaker, Guard, etc.) IS the position.

## UI Changes

### StaffInviteDialog — Enhanced Form
- Remove separate "Position" dropdown (staff_type)
- Keep Role/Preset as the single combined "Position / Role" selector
- Add new fields: Permanent Address, Present Address, NID/Birth Cert number, Doc Type selector, Date of Birth, Salary (monthly), Photo upload
- Scrollable dialog with sections

### StaffEditDialog — Enhanced Form
- Same additional fields as invite
- Load/save from `staff_details` table

### StaffCard — Show More Info
- Show salary amount, DOB/age, photo (in Avatar)
- Add "Pay Salary" button

### New: SalaryPayDialog
- Select month, enter amount (pre-filled from salary), notes
- On submit: insert into `salary_payments` + insert into `accounting_entries` as expense
- Show salary payment history

### Staff Page
- Add salary payment history section or tab
- Show total salary expense stats

## Edge Function Update
- `invite-staff`: accept new fields (addresses, nid, dob, salary, doc_type) and insert into `staff_details` after creating the user

## File Changes
1. **Migration SQL** — create `staff_details`, `salary_payments` tables with RLS
2. **`supabase/functions/invite-staff/index.ts`** — insert staff_details row
3. **`src/components/staff/StaffInviteDialog.tsx`** — add full detail fields, merge position/role
4. **`src/components/staff/StaffEditDialog.tsx`** — add full detail fields, load staff_details
5. **`src/components/staff/StaffCard.tsx`** — show photo, salary, age, pay salary button
6. **`src/components/staff/SalaryPayDialog.tsx`** — new dialog for paying salary
7. **`src/pages/Staff.tsx`** — fetch staff_details, salary_payments; wire new dialogs
8. **`src/contexts/LanguageContext.tsx`** — add translation keys for new fields

