

# প্রপার্টি Draft মোডে সংরক্ষণ

## সমস্যা
ট্রায়াল ইউজার সর্বোচ্চ ১টি সম্পত্তি যোগ করতে পারে। লিমিট পূর্ণ হলে আর যোগ করা যায় না। ইউজার চায় draft আকারে সেভ করে রাখতে, পরে সাবস্ক্রিপশন কিনলে active করতে।

## সমাধান

### ১) Database Migration
`properties` table-এ নতুন column:
```sql
ALTER TABLE public.properties 
  ADD COLUMN status text NOT NULL DEFAULT 'active';
```
- `active` = সচল সম্পত্তি (বর্তমান সব property এই status পাবে)
- `draft` = ড্রাফট, ট্রায়াল লিমিটে গণনা হবে না

### ২) Properties.tsx পরিবর্তন

**Create mutation:**
- ট্রায়াল লিমিটে hit করলে error না দিয়ে `status: 'draft'` দিয়ে save করবে
- Toast-এ জানাবে: "ড্রাফট হিসেবে সংরক্ষিত। সাবস্ক্রিপশন কিনলে সক্রিয় হবে।"
- লিমিটের মধ্যে থাকলে `status: 'active'` দিয়ে save হবে

**Property list:**
- Draft property গুলো আলাদা badge দেখাবে ("ড্রাফট" badge)
- Draft property-তে "সক্রিয় করুন" button থাকবে
- "সক্রিয় করুন" click করলে চেক করবে — সাবস্ক্রিপশন কিনেছে কিনা, active property limit-এর মধ্যে আছে কিনা

**Property count:**
- `propertyCount` গণনায় শুধু `status = 'active'` গুলো count হবে
- `canAddProperty` চেক শুধু active property-র জন্য

**Query filter:**
- Properties query-তে সব (active + draft) দেখাবে, কিন্তু draft আলাদা visual সহ

### ৩) অন্যান্য জায়গায় draft filter
- Rooms, Tenants, Bills ইত্যাদি page-এ property dropdown-এ শুধু `active` property দেখাবে (draft এ room/tenant add করা যাবে না)

### পরিবর্তিত files
- `supabase/migrations/` — status column যোগ
- `src/pages/Properties.tsx` — draft save logic, badge, activate button
- `src/integrations/supabase/types.ts` — auto-updated

