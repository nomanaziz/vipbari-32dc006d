

# নোটিশ পিন করার ফিচার — বাড়িওয়ালা নিজে পিন করবে

## সমস্যা
এখন প্রথম নোটিশটা (সবচেয়ে নতুন) অটো "pinned" হিসেবে দেখায়। বাড়িওয়ালার পিন/আনপিন করার কোনো option নেই।

## সমাধান

### 1) Database Migration
`notices` table-এ একটি `is_pinned` boolean column যোগ:
```sql
ALTER TABLE notices ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;
```

### 2) Landlord Page (`Notices.tsx`) পরিবর্তন
- **Pin/Unpin button** প্রতিটি নোটিশ কার্ডে (Pin icon toggle)
- **Pin mutation** — `is_pinned` toggle করবে
- **Sorting**: pinned notices আগে, তারপর বাকিগুলো `created_at` অনুযায়ী
- প্রথম নোটিশ অটো-পিন আর হবে না — শুধু `is_pinned=true` যেগুলো সেগুলোই "পিন করা" section-এ থাকবে
- পিন করা নোটিশ না থাকলে "পিন করা" section দেখাবে না

### 3) Tenant Page (`TenantNotices.tsx`) পরিবর্তন
- একই logic: `is_pinned=true` নোটিশগুলো "পিন করা" section-এ, বাকিগুলো grid-এ
- অটো-পিন logic সরিয়ে দেওয়া হবে

### 4) Form Dialog
নোটিশ তৈরি/সম্পাদনা করার সময় একটি checkbox: "পিন করুন (স্টিকি)"

### পরিবর্তিত files
- `supabase/migrations/` — নতুন migration
- `src/pages/Notices.tsx` — pin toggle + sorting + form checkbox
- `src/pages/tenant/TenantNotices.tsx` — pinned section logic
- `src/integrations/supabase/types.ts` — auto-updated

