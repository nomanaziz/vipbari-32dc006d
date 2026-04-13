

# সম্পদ (Assets) — ক্রয় তথ্য, ওয়ারেন্টি ও হিসাব সংযোগ

## কি হবে
Asset form-এ ক্রয়মূল্য, ওয়ারেন্টি, ভেন্ডর তথ্য এবং ক্রেতার নাম যোগ হবে। সম্পদ যোগ করলে স্বয়ংক্রিয়ভাবে accounting-এ expense entry তৈরি হবে। Asset list-এ ওয়ারেন্টি বাকি কতদিন আছে সেটাও দেখাবে।

## Database Migration

`assets` table-এ নতুন columns:

| Column | Type | Default | বর্ণনা |
|--------|------|---------|--------|
| `purchase_price` | numeric | 0 | ক্রয়মূল্য (৳) |
| `warranty_months` | integer | 0 | ওয়ারেন্টি (মাস) |
| `warranty_end_date` | date | null | ওয়ারেন্টি শেষের তারিখ |
| `vendor_name` | text | '' | ভেন্ডর/দোকানের নাম |
| `vendor_phone` | text | '' | ভেন্ডরের ফোন নম্বর |
| `purchased_by` | text | '' | কে কিনেছেন |
| `add_to_accounting` | boolean | false | হিসাবে যোগ করতে চায় কিনা |

## পরিবর্তন

### 1) `AssetFormDialog.tsx`
- নতুন fields যোগ: ক্রয়মূল্য, ওয়ারেন্টি (মাস), ভেন্ডরের নাম, ভেন্ডরের ফোন, কে কিনেছেন
- ক্রয়ের তারিখ ও ওয়ারেন্টি মাস দিলে warranty_end_date auto-calculate
- "হিসাবে যোগ করুন" checkbox — checked থাকলে save করার সময় `accounting_entries`-তে `asset_purchase` category-তে expense entry insert হবে
- Edit mode-এ accounting entry আবার তৈরি হবে না (শুধু নতুন asset-এ)

### 2) `Assets.tsx` (list page)
- Table-এ নতুন column: "ওয়ারেন্টি" — বাকি দিন/মাস দেখাবে
  - সবুজ badge: ওয়ারেন্টি আছে
  - লাল badge: ওয়ারেন্টি শেষ
  - হলুদ badge: ৩০ দিনের মধ্যে শেষ হবে
- ক্রয়মূল্য column যোগ (৳ সহ)

### 3) `AccountingEntryDialog.tsx`
- EXPENSE_CATEGORIES-এ `asset_purchase` (সম্পদ ক্রয়) category যোগ

### 4) `types.ts`
- Auto-updated after migration

## পরিবর্তিত files
- `supabase/migrations/` — নতুন columns
- `src/components/assets/AssetFormDialog.tsx` — vendor, warranty, price fields + accounting integration
- `src/pages/Assets.tsx` — warranty status ও price column
- `src/components/accounting/AccountingEntryDialog.tsx` — asset_purchase category
- `src/integrations/supabase/types.ts` — auto-updated

