

# ভাড়াটিয়া নিবন্ধন ফরম (Police Registration Form) Feature

## Overview
ঢাকা মেট্রোপলিটন পুলিশের ভাড়াটিয়া নিবন্ধন ফরমের সব ফিল্ড tenant profile-এ যোগ করা হবে। টেনান্ট ও বাড়িওয়ালা দুজনেই edit করতে পারবে। Print করলে পুলিশ ফরমের মতো output আসবে।

## Step 1: Database Migration — New columns on `tenants` table

Currently missing fields (mapped from the police form):

| Form Field | New Column | Type |
|---|---|---|
| ২. পিতার নাম | `father_name` | text |
| ৩. বৈবাহিক অবস্থা | `marital_status` | text |
| ৬. ধর্ম | `religion` | text |
| ৬. শিক্ষাগত যোগ্যতা | `education` | text |
| ৫. কর্মস্থলের ঠিকানা | `workplace_address` | text |
| ৯. পাসপোর্ট নম্বর | `passport_number` | text |
| ১০. জরুরী যোগাযোগ (নাম) | `emergency_name` | text |
| ১০. জরুরী যোগাযোগ (সম্পর্ক) | `emergency_relation` | text |
| ১০. জরুরী যোগাযোগ (ঠিকানা) | `emergency_address` | text |
| ১০. জরুরী যোগাযোগ (মোবাইল) | `emergency_phone` | text |
| ১২. গৃহকর্মী নাম | `domestic_worker_name` | text |
| ১২. গৃহকর্মী NID | `domestic_worker_nid` | text |
| ১২. গৃহকর্মী মোবাইল | `domestic_worker_phone` | text |
| ১২. গৃহকর্মী ঠিকানা | `domestic_worker_address` | text |
| ১৩. ড্রাইভার নাম | `driver_name` | text |
| ১৩. ড্রাইভার NID | `driver_nid` | text |
| ১৩. ড্রাইভার মোবাইল | `driver_phone` | text |
| ১৩. ড্রাইভার ঠিকানা | `driver_address` | text |
| ১৪. পূর্ববর্তী বাড়িওয়ালার নাম | `prev_landlord_name` | text |
| ১৪. পূর্ববর্তী বাড়িওয়ালার মোবাইল | `prev_landlord_phone` | text |
| ১৪. পূর্ববর্তী বাড়িওয়ালার ঠিকানা | `prev_landlord_address` | text |
| ১৫. পূর্ববর্তী বাসা ছাড়ার কারণ | `prev_leave_reason` | text |

All nullable, default empty.

## Step 2: Update Tenant Profile Page (tenant side)
**File:** `src/pages/tenant/TenantProfile.tsx`

Add new card sections for:
- পিতার নাম, বৈবাহিক অবস্থা, ধর্ম, শিক্ষাগত যোগ্যতা, কর্মস্থলের ঠিকানা, পাসপোর্ট নম্বর
- জরুরী যোগাযোগ (expanded: নাম, সম্পর্ক, ঠিকানা, মোবাইল)
- গৃহকর্মী তথ্য
- ড্রাইভার তথ্য
- পূর্ববর্তী বাড়িওয়ালা তথ্য

Update the `saveMutation` to include all new fields.

## Step 3: Update Landlord Tenant Form (landlord side)
**File:** `src/components/tenants/TenantFormDialog.tsx`

Add the same new fields in collapsible/tabbed sections so the form doesn't become overwhelming. The landlord can fill these from their panel too.

Update `emptyForm`, `buildPayload`, and the edit `useEffect`.

## Step 4: Print Registration Form Component
**New file:** `src/components/tenants/TenantRegistrationPrint.tsx`

A print-optimized component that renders the police form layout:
- Header with "ঢাকা মেট্রোপলিটন পুলিশ" logo area, বিভাগ, থানা
- All 17 fields in the exact order of the police form
- Family members table (from `tenant_members`)
- Footer with তারিখ and ভাড়াটিয়ার স্বাক্ষর
- Uses `@media print` CSS for clean A4 output
- Triggered from both landlord (single or bulk) and tenant profile

## Step 5: Print Buttons
- **Landlord side** (`src/pages/Tenants.tsx`): Add "Print Form" option in tenant card dropdown menu. Also add a bulk "Print All Forms" button in the header area.
- **Tenant side** (`src/pages/tenant/TenantProfile.tsx`): Add a "Print Registration Form" button.

Both open a print dialog with the formatted police form.

## Technical Notes
- All new columns are nullable text — no breaking changes to existing inserts
- The print component uses `window.print()` with print-specific CSS
- Family members data comes from the existing `tenant_members` table query
- Property/room info for the form header comes from existing tenant joins

