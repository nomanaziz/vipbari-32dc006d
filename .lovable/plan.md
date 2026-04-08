
# ঠিক কী সমস্যা এখন আছে

আমি code দেখে এখন issue-টা দুই ভাগে clearভাবে দেখছি:

1. **বর্তমান ঠিকানা (Current Address)**  
   tenant portal-এ এটা `rooms -> properties` থেকে auto আসে।  
   কিন্তু landlord/admin-side edit flow-এ এখনো `tenants.present_*` field নিয়েই কাজ হচ্ছে।  
   তাই **একই current address দুই জায়গায় দুই source থেকে আসছে**।

2. **স্থায়ী ঠিকানা (Permanent Address)**  
   `division → district → thana` dropdown cascade আছে, কিন্তু normalization এখন parent-aware না।  
   ফলে saved value division/district hierarchy-এর সাথে mismatch হলে district/thana blank হয়ে যাচ্ছে, যদিও DB-তে data থাকতে পারে।

স্ক্রিনশট + code মিলিয়ে আমি যেটা বুঝেছি:
- tenant portal-এর current address property-based হওয়া ঠিক
- admin/landlord side-এও linked tenant হলে same property address দেখানো উচিত
- permanent address tenant নিজে update করলে সেটা tenant table-এ stableভাবে থেকে যেতে হবে
- district/thana disappearing issue আসছে form state + normalization/cascade mismatch থেকে

## Root cause summary

### A) Current address-এর source mismatch
- `TenantProfile.tsx`-এ linked tenant হলে current address property থেকে auto-populated
- `TenantFormDialog.tsx`-এ landlord এখনো `present_division`, `present_district`, `present_thana` manually edit করতে পারে
- ফলে admin/landlord panel আর tenant portal একই truth follow করছে না

### B) District/Thana normalization অসম্পূর্ণ
`normalizeDistrict()` আর `normalizeThana()` এখন শুধু raw label/value normalize করে, কিন্তু:
- selected division-এর মধ্যে district valid কি না
- selected district-এর মধ্যে thana valid কি না  
এটা check করে না

ফলে load/save সময়:
- division canonical হয়েছে
- district/thana old/mismatched value হলে dropdown option list-এ পড়ে না
- UI blank দেখায়
- পরে save হলে empty value overwrite হওয়ার risk থাকে

## আমি কী implement করার plan দিচ্ছি

### 1) Address helper-কে hierarchy-aware করা
`src/data/bangladeshAddress.ts`-এ helper বাড়ানো হবে:

- division-aware district normalize
- district-aware thana normalize
- “value exists globally” না দেখে “value valid under selected parent” check
- helper থাকবে যেমন:
  - `normalizeDistrictForDivision(division, district)`
  - `normalizeThanaForDistrict(district, thana)`
  - optional validator:
    - `isDistrictInDivision`
    - `isThanaInDistrict`

এতে mismatched child silently blank না হয়ে controlledভাবে handle হবে।

### 2) Permanent address load/save harden করা
`src/components/tenants/TenantFormDialog.tsx` এবং `src/pages/tenant/TenantProfile.tsx`-এ:

- initial load-এর সময়
  - division আগে normalize
  - তারপর ওই division অনুযায়ী district normalize
  - তারপর ওই district অনুযায়ী thana normalize
- save payload-এর সময়ও একই ordered normalization apply হবে

অর্থাৎ:
```text
division -> validate district under division -> validate thana under district
```

এতে tenant নিজে permanent address update করলে district/thana আর গায়েব হবে না।

### 3) Cascade reset logic safe করা
এখন child reset হচ্ছে parent change হলে, কিন্তু logic আরও safe করা হবে:

- division unchanged হলে district/thana reset না
- district unchanged হলে thana reset না
- load-time normalization-এর সময় accidental reset না
- parent বদলালে child value valid থাকলে preserve, invalid হলে তবেই clear

এতে edit form খুললেই district/thana blank হয়ে যাওয়ার bug বন্ধ হবে।

### 4) Current address-এর single source of truth ঠিক করা
linked tenant-এর ক্ষেত্রে **current address tenant table থেকে না, property থেকে derive** করা হবে — সব relevant UI-তে একইভাবে।

#### Linked tenant হলে:
- current address fields read-only / auto-filled
- source:
  - property.division
  - property.district
  - property.thana
  - property.area
  - property.house_number
  - property.road_number
  - property.postal_code

#### Unlinked/manual tenant হলে:
- existing `tenants.present_*` fields editable থাকবে

এতে landlord/admin panel আর tenant portal একই address দেখাবে।

### 5) Landlord/Admin edit dialog-এ current address UI align করা
`TenantFormDialog.tsx`-এ linked/assigned tenant-এর জন্য present address section update হবে:

- যদি tenant-এর assigned room/property থাকে:
  - Present Address section property-based read-only preview দেখাবে
  - landlord manually এটা edit করবে না
- যদি room/property link না থাকে:
  - current manual fields editable থাকবে

এটাই user expectation-এর সাথে match করে:
“যে property-তে আছে, current address ওইটাই হবে।”

### 6) Tenant portal display fallback improve করা
`TenantProfile.tsx`-এ:
- property relation থাকলে property address show
- relation missing হলে readable fallback message
- Bangla label mapping consistent রাখা
- postal code + house/road display stable রাখা

এতে tenant side-এ current address predictable থাকবে।

### 7) Admin/landlord views-এ same address reflect করা
যেসব জায়গায় tenant address summary দেখানো হয়, সেখানে current address display same rule follow করবে:

সম্ভাব্য file:
- `src/components/bills/TenantDetailDialog.tsx`
- `src/components/tenants/TenantRegistrationPrint.tsx`
- প্রয়োজনে tenant list/detail summary usage

Rule:
- current address = linked property address
- permanent address = tenant’s own saved permanent fields

### 8) Police verification form consistency
`TenantRegistrationPrint.tsx` already property data use করে, কিন্তু display consistency check হবে:

- division
- thana
- district/area
- house/road
- postal code

সব format tenant portal/admin panel-এর সাথে consistent থাকবে।

## কোন কোন file likely change হবে

1. `src/data/bangladeshAddress.ts`
2. `src/components/tenants/TenantFormDialog.tsx`
3. `src/pages/tenant/TenantProfile.tsx`
4. `src/components/bills/TenantDetailDialog.tsx`
5. `src/components/tenants/TenantRegistrationPrint.tsx`

প্রয়োজনে:
6. `src/pages/Tenants.tsx` বা related admin display file

## Expected result

ফিক্সের পর:

- tenant নিজের **স্থায়ী ঠিকানা** update করলে district/thana আর গায়েব হবে না
- landlord/admin edit খুললেও saved permanent address stable থাকবে
- **current address** linked property থেকে tenant portal ও admin/landlord panel — দুই জায়গাতেই same দেখাবে
- police verification form-এও same property address reflect করবে
- বর্তমান ঠিকানা আর manual duplicate source থেকে conflict করবে না

## Technical note

এটা এখন mainly **form-state + address hierarchy + source-of-truth problem**।  
আগের RLS fix tenant portal property fetch-এর জন্য দরকার ছিল, কিন্তু আপনার এখনকার remaining issue resolve করতে front-end address flow unification দরকার।

সবচেয়ে গুরুত্বপূর্ণ fix হবে:
```text
Permanent address = tenant-owned saved data
Current address = property-derived data (when tenant is linked to a property)
```
