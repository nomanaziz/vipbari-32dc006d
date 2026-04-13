

# ভাড়াটিয়া ফর্মের ৩টি বাগ ফিক্স

## সমস্যা ১: Collapsible section গুলো টাইপ করলে বন্ধ হয়ে যায়

**Root Cause:** `SectionCollapsible` component টি `TenantFormDialog` এর ভিতরে define করা আছে (line 332-342)। প্রতিটি re-render এ React এটাকে **নতুন component** মনে করে, তাই unmount/remount হয় এবং collapsible এর open state হারিয়ে যায়।

**Fix:** `SectionCollapsible` কে component-এর বাইরে আলাদা function হিসেবে move করবো। এতে React component identity ঠিক থাকবে এবং typing এ collapse হবে না।

## সমস্যা ২: স্থায়ী ঠিকানায় জেলা ও থানা মুছে যায়

**Root Cause:** Collapsible re-mount issue সহ Select component গুলোর value management এ সমস্যা। Division change handler district/thana clear করে, কিন্তু same-value re-selection এও clear হতে পারে যদি normalization mismatch হয়।

**Fix:** 
- Division change handler এ আরও robust check দিবো
- District ও thana value retention নিশ্চিত করবো
- Computed values (districts, thanas arrays) stable রাখবো

## সমস্যা ৩: পূর্ববর্তী বাড়িওয়ালার তথ্য auto-fill

**বর্তমান অবস্থা:** Manual input fields আছে। Tenant release করার সময় `release_reason` ও `prev_leave_reason` DB-তে save হয়।

**পরিকল্পনা:** 
- নতুন tenant তৈরি করার সময়, phone number দিলে DB-তে check করবো যে এই phone-এ কোনো পুরানো inactive tenant আছে কিনা
- যদি থাকে, তার `owner_id` থেকে পূর্ববর্তী বাড়িওয়ালার নাম/ফোন এবং `prev_leave_reason` auto-fill করবো
- বাড়িওয়ালা চাইলে overwrite করতে পারবে (disabled করবো না)

## পরিবর্তিত file
- `src/components/tenants/TenantFormDialog.tsx`
  - `SectionCollapsible` কে component-এর বাইরে নিয়ে যাওয়া
  - Address cascading logic robust করা
  - Phone number দিলে পুরানো tenant data fetch করে previous landlord auto-fill

## Technical Details

```text
Current SectionCollapsible (BUGGY):
  const TenantFormDialog = () => {
    const SectionCollapsible = ({...}) => (  // ← re-created each render!
      <Collapsible>...</Collapsible>
    );
  }

Fixed:
  const SectionCollapsible = ({...}) => (   // ← stable identity
    <Collapsible>...</Collapsible>
  );
  const TenantFormDialog = () => {
    // uses SectionCollapsible from outer scope
  }
```

Previous landlord auto-fill flow:
```text
Phone input → debounced query → 
  supabase.from("tenants")
    .select("*, profiles!inner(full_name, phone)")
    .eq("phone", phoneValue)
    .eq("status", "inactive")
    .neq("owner_id", currentUserId)
    .order("released_at", {ascending: false})
    .limit(1)
→ auto-fill prev_landlord_name, prev_landlord_phone, prev_leave_reason
```

