
# ঠিকানা স্থায়ী না থাকার ফিক্স

## সমস্যা
স্থায়ী এবং বর্তমান ঠিকানার division / district / thana save হওয়ার পর edit/reload এ কিছু field blank হয়ে যাচ্ছে। তাই landlord বা tenant পরে আবার খুললে মনে হচ্ছে তথ্য “চলে গেছে”।

## আসল কারণ
- `TenantFormDialog.tsx` এবং `TenantProfile.tsx`-এর address dropdown only fixed option value নেয়, যেমন `Dhaka`, `Narayanganj`, `Mirpur`।
- কিন্তু DB-তে কিছু পুরনো/মিশ্র data Bangla বা non-canonical format-এ থাকতে পারে, যেমন `ঢাকা`।
- তখন:
  - `DISTRICTS[division]` কাজ করে না
  - `THANAS[district]` কাজ করে না
  - dropdown option list empty হয়ে যায়
  - value DB-তে থাকলেও UI blank দেখায়
- parent field handler child field reset করছে, তাই invalid/mixed value থাকলে district/thana আরও সহজে হারিয়ে যাচ্ছে।

## কীভাবে ফিক্স হবে

### 1) Address normalization helper যোগ হবে
`src/data/bangladeshAddress.ts`-এ helper যোগ করা হবে, যা:
- Bangla label → canonical English value
- English value → same canonical value
- mixed/legacy value → best-match canonical value
- invalid হলে empty string

এতে backend-এ একটাই standard format থাকবে।

### 2) Landlord edit form load fix
`src/components/tenants/TenantFormDialog.tsx`-এ:
- `editing` data form-এ তোলার সময়
  - `permanent_division`, `permanent_district`, `permanent_thana`
  - `present_division`, `present_district`, `present_thana`
  normalize করে state-এ বসানো হবে
- ফলে পুরনো saved data থাকলেও dropdown ঠিকমতো selected থাকবে

### 3) Tenant profile load fix
`src/pages/tenant/TenantProfile.tsx`-এ একই normalization apply হবে, যাতে tenant side-এও বর্তমান ও স্থায়ী ঠিকানা ঠিকভাবে load হয়।

### 4) Save payload hardening
save/update করার আগে address fieldগুলো canonical format-এ normalize করে পাঠানো হবে:
- landlord tenant update
- tenant self profile save
- approval-based update flow

ফলে future-এ আর Bangla/mixed raw value DB-তে জমা হবে না।

### 5) Reset logic safe করা
division/district change handler এমন করা হবে যাতে:
- সত্যি parent value বদলালে তবেই child reset হয়
- load-time normalization বা same value select করলে child blank না হয়
- mismatch থাকলে controlled way-তে clear হয়

### 6) Display consistency
যেখানে address show করা হয়, সেখানে stored canonical value থেকে Bangla label render হবে, যাতে:
- DB value standard থাকে
- UI text readable Bangla থাকে

## যেসব file বদলাতে হবে
- `src/data/bangladeshAddress.ts`
- `src/components/tenants/TenantFormDialog.tsx`
- `src/pages/tenant/TenantProfile.tsx`

প্রয়োজনে display consistency-এর জন্য:
- `src/components/bills/TenantDetailDialog.tsx`
- `src/components/tenants/TenantRegistrationPrint.tsx`

## Expected result
- স্থায়ী ও বর্তমান ঠিকানার division/district/thana আর blank হবে না
- landlord edit করার পর data স্থায়ী থাকবে
- tenant profile থেকেও save করলে ঠিক থাকবে
- পুরনো Bangla-saved data থাকলেও form-এ ঠিকমতো selected হয়ে দেখা যাবে
- একই সমস্যার পুনরাবৃত্তি বন্ধ হবে

## Technical note
DB migration লাগবে না। এটা data normalization + form state handling fix.