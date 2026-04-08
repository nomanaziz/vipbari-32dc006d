

# ভাড়াটিয়া তথ্য আপডেট সমস্যা সমাধান

## সমস্যা চিহ্নিত

বাড়িওয়ালার TenantFormDialog-এ অনেক গুরুত্বপূর্ণ ফিল্ড নেই যা tenant profile-এ আছে। ফলে বাড়িওয়ালা সব তথ্য একবারে আপডেট করতে পারছেন না এবং কিছু ফিল্ড save হচ্ছে না।

**বাড়িওয়ালার ফর্মে যা নেই:**
- বর্তমান ঠিকানা (present_division, present_district, present_thana, present_village, present_address)
- জন্ম তারিখ, লিঙ্গ, পেশা (date_of_birth, gender, occupation)
- ডকুমেন্ট তথ্য (doc_type, doc_number)

**district/thana blank সমস্যা:** ফিল্ডগুলো save হচ্ছে কিন্তু ফর্ম re-open করলে cascading Select-এর কারণে হয়তো সঠিকভাবে দেখাচ্ছে না।

## পরিবর্তন

### 1. TenantFormDialog.tsx — সকল ফিল্ড যোগ

`emptyForm`-এ missing ফিল্ড যোগ:
- `present_division`, `present_district`, `present_thana`, `present_village`, `present_address`
- `date_of_birth`, `gender`, `occupation`
- `doc_type`, `doc_number`

ফর্ম UI-তে নতুন section যোগ:
- **বর্তমান ঠিকানা** section — division/district/thana Select cascade + village + address
- **ব্যক্তিগত তথ্য** — জন্ম তারিখ, লিঙ্গ, পেশা
- **ডকুমেন্ট** — ধরন ও নম্বর

`buildPayload`-এ `date_of_birth` কে null হিসেবে handle করা (empty string হলে null)।

### 2. TenantFormDialog.tsx — district/thana সমস্যা ঠিক

`useEffect`-এ editing load করার সময় cascading ঠিক রাখতে:
- division set করার পর district ও thana reset না করা (শুধু নতুন division select করলেই reset হবে)
- Present address-এর জন্যও একই cascading logic

### 3. buildPayload — সব ফিল্ড নিশ্চিত

নতুন ফিল্ডগুলো `buildPayload`-এ যাতে সঠিকভাবে handle হয় (null vs empty string)।

## ফাইল পরিবর্তন

1. **`src/components/tenants/TenantFormDialog.tsx`** — emptyForm এ নতুন ফিল্ড, UI-তে নতুন section, buildPayload fix

