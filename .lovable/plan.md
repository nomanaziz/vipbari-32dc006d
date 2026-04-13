

# সম্পত্তি Draft/Active স্ট্যাটাস ফিচার

## সমস্যা
Trial period-এ শুধু ১টি সম্পত্তি add করা যায়। ব্যবহারকারী আরো add করতে চাইলে block হয়ে যায়।

## সমাধান
সম্পত্তি add-এর limit তুলে দেওয়া হবে। Trial user-রা যতখুশি সম্পত্তি add করতে পারবে, কিন্তু trial-এ সেগুলো **draft** হিসেবে save হবে। Subscription কেনার পর draft গুলো **active** করা যাবে।

## পরিবর্তন

### 1) Database Migration
`properties` table-এ `status` column যোগ:
```sql
ALTER TABLE public.properties ADD COLUMN status text NOT NULL DEFAULT 'active';
```

### 2) Properties.tsx পরিবর্তন
- **Trial limit সরানো** — `canAddProperty` check আর block করবে না
- **Create mutation**: Trial user হলে `status: 'draft'` দিয়ে insert, paid user হলে `status: 'active'`
- **Property card-এ Draft badge** — draft সম্পত্তিতে "ড্রাফট" / "Draft" badge দেখাবে
- **"সক্রিয় করুন" / "Activate" button** — draft সম্পত্তিতে, paid user হলে click করে active করা যাবে। Trial user হলে "সাবস্ক্রিপশন কিনুন" message দেখাবে
- **Form-এ "ড্রাফট হিসেবে সংরক্ষণ করুন" option** — trial user হলে save button-এ automatically draft হিসেবে save হবে, সাথে info message দেখাবে
- **Draft property sorting** — Active properties আগে, drafts পরে দেখাবে

### 3) অন্যান্য pages
- Rooms, Bills ইত্যাদি page-এ draft property-র রুম/বিল তৈরি করা যাবে না (শুধু active property দেখাবে dropdown-এ)
- Admin panel-এ draft status দেখাবে

### পরিবর্তিত files
- `supabase/migrations/` — নতুন migration (status column)
- `src/pages/Properties.tsx` — trial limit removal, draft logic, activate button
- `src/integrations/supabase/types.ts` — auto-updated

