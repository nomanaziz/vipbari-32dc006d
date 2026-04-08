
# ভাড়াটিয়া page-এ property address না আসার fix plan

## আসল সমস্যা
আপনার property-তে address save আছে, কিন্তু tenant page সেটা `rooms -> properties` relation থেকে আনছে। এখানে মূল বাধা হচ্ছে **RLS policy**:

- `tenants` row tenant দেখতে পারে
- কিন্তু `rooms` table-এ tenant-এর assigned occupied room দেখার policy নেই
- তাই tenant profile query-তে nested `rooms.properties(...)` null হয়ে যাচ্ছে
- ফলে auto current address box ফাঁকা দেখাচ্ছে

স্ক্রিনশট অনুযায়ী issue save না হওয়া না, বরং **tenant page data fetch করতে পারছে না**।

## কী fix হবে

### 1) Room access policy ঠিক করা
নতুন migration-এ `rooms` table-এ tenant-এর নিজের assigned room read করার policy যোগ হবে।

লজিক:
- tenant যদি `tenants.user_id = auth.uid()`
- এবং `tenants.room_id = rooms.id`
- তাহলে সে ওই room read করতে পারবে

এতে tenant page-এর nested room/property data আসবে।

### 2) Property access policy tighten করা
এখন `properties` authenticated user সবাই read করতে পারে (`USING (true)`), এটা security-wise বেশি খোলা।
এটা safer policy-তে আনা হবে যাতে:
- owner তার property দেখতে পারে
- tenant linked/assigned property দেখতে পারে
- to-let/public listing যেটুকু দরকার সেটুকু আগের behavior অনুযায়ী বজায় থাকে

এতে tenant page data-ও আসবে, security-ও better হবে।

### 3) Tenant page query harden করা
`src/pages/tenant/TenantProfile.tsx`-এ query fallback-safe করা হবে:
- current linked tenant-এর room/property এলে auto address দেখাবে
- nested relation missing হলে blank box না দেখিয়ে readable fallback note দেখাবে
- property address compose helper ব্যবহার করে house/road/area/postal info consistent দেখানো হবে

### 4) Auto-populated current address display improve করা
বর্তমান ঠিকানা section-এ:
- division
- district
- thana
- village/area
- detailed address (house/road)
এসব property থেকে consistent map হবে

যাতে landlord property form-এ যেটা দিয়েছে tenant page-এ সেটাই আসে।

### 5) Print / police verification consistency check
`TenantRegistrationPrint.tsx` already property relation ব্যবহার করে। policy fix হলে এটাও ঠিক data পাবে।
প্রয়োজনে display helper reuse করা হবে যেন tenant page আর print form একই address structure follow করে।

## যেসব file বদলাতে হবে
1. `supabase/migrations/...sql` — rooms/properties RLS fix
2. `src/pages/tenant/TenantProfile.tsx` — query + fallback + address mapping
3. প্রয়োজনে `src/components/tenants/TenantRegistrationPrint.tsx` — display consistency

## Expected result
- landlord property-তে দেওয়া address tenant page-এ দেখা যাবে
- linked tenant / accepted tenant উভয়ের current address auto-fill হবে
- police verification print form-এ একই property address আসবে
- blank current address issue বন্ধ হবে

## Technical note
আমি code review করে দেখেছি auth initialization issue না, মূল issue হচ্ছে **assigned room read policy missing**। তাই এই fix-এর মূল focus হবে RLS + tenant profile mapping।
