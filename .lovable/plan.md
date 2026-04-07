
## কী সমস্যা এখনো আছে
বাড়িওয়ালার approve/reject logic কোডে আছে, কিন্তু option দেখা যাচ্ছে না কারণ flowটা এখনো landlord context অনুযায়ী ঠিকভাবে expose করা হয়নি।

আমি যা দেখলাম:
- `PendingRequestsSection.tsx`-এ pending family member এর জন্য Approve/Reject button already আছে।
- `FamilyMembersDialog.tsx`-এও pending member এর জন্য approve/reject button already আছে।
- কিন্তু `Tenants.tsx`-এ tenant list এখনো শুধু `.eq("owner_id", effectiveOwnerId!)` দিয়ে tenant আনে।
- self-registered tenant যাদের landlord এর সাথে `tolet_requests.status = accepted` দিয়ে link করা, তারা tenant list-এ না এলে:
  - landlord tenant card-এ ঢুকতে পারে না
  - `FamilyMembersDialog` open করার পথও পায় না
  - ফলে landlord approval option “নাই” মনে হচ্ছে

## কী build করতে হবে

### 1) Tenant list-এ linked tenant include করতে হবে
`src/pages/Tenants.tsx`-এর tenant query update করতে হবে যাতে:
- directly owned tenants আসে
- accepted `tolet_requests` দিয়ে linked tenants-ও আসে
- duplicate remove হয়
- linked tenant হলে request থেকে room info fallback নেয়, যদি tenant row-তে room join empty থাকে

এটা `Guests.tsx` / `Payments.tsx`-এ already যেভাবে merged tenant list করা হয়েছে, সেই pattern follow করবে।

### 2) Family member approval option landlord view-এ visible করতে হবে
`FamilyMembersDialog.tsx`-এ approve/reject button already আছে, কিন্তু এটাকে landlord-friendly করতে হবে:
- button text-এ clear fallback দিতে হবে
- pending member card-এ plain text status দেখাতে হবে
- optionally ছোট helper text দেখানো যাবে: “এই সদস্য অনুমোদনের অপেক্ষায় আছে”

এতে translation key fail করলেও raw key দেখাবে না।

### 3) Pending Requests section আরও dependable করতে হবে
`PendingRequestsSection.tsx`-এ:
- `user?.id` এর বদলে landlord context হিসেবে `effectiveOwnerId` use করা ভালো
- queryKey-ও `effectiveOwnerId` based করা উচিত
- approve/reject success হলে relevant queries invalidate করতে হবে:
  - `pending-members`
  - `tenant-members`
  - `tenants`
  - member count query

এতে approve করার পর count সাথে সাথে update হবে।

### 4) Tenant card-এ family count আরও clear করতে হবে
`Tenants.tsx`-এ current approved family count badge আছে, কিন্তু আরও readable করা হবে:
- `Family: 3` / `পরিবার: ৩`
- চাইলে total member শব্দ ব্যবহার: `মোট সদস্য: ৩`
- count query linked tenants-এর জন্যও কাজ করবে once tenant list is fixed

### 5) Optional quick action add
Tenant card-এর dropdown এর বাইরে visible quick action রাখা যেতে পারে:
- `Family Members` button / badge click area
- এতে landlord সহজে family request review করতে পারবে

এটা optional, but user problem solve করতে helpful।

## Technical details

### Root cause
```text
Landlord linked tenant
-> appears in pending-members section maybe / or partially
-> does NOT appear in tenant list
-> cannot open Family Members dialog from tenant card
-> approval option feels missing
```

### Files to update
- `src/pages/Tenants.tsx`
  - tenant query merge logic
  - member count query stays but will work for linked tenants too
  - optional visible family action
- `src/components/tenants/FamilyMembersDialog.tsx`
  - approval UI text fallback
  - cleaner pending-state messaging
- `src/components/tenants/PendingRequestsSection.tsx`
  - use `effectiveOwnerId`
  - stronger query invalidation after approve/reject

### DB side
Migration diff অনুযায়ী `tenant_members` RLS policy already prepared/added to support linked tenants via accepted `tolet_requests`.  
So next implementation focus হবে mainly frontend visibility + landlord flow consistency।

## Expected result after implementation
- ভাড়াটিয়া family member add করলে status pending থাকবে
- বাড়িওয়ালা `/tenants` page-এ linked tenant-ও দেখতে পাবে
- tenant card থেকে `Family Members` খুলতে পারবে
- pending member এর পাশে `Approve` / `Reject` option দেখবে
- approve করলে pending badge বদলে approved হবে
- tenant card-এ মোট family member count update হবে

## Test checklist
1. self-registered tenant দিয়ে family member add
2. landlord `/tenants` page-এ linked tenant দেখতে পাচ্ছে কি না
3. `Family Members` dialog open হচ্ছে কি না
4. pending member এর পাশে approve/reject button দেখা যাচ্ছে কি না
5. approve করার পর status change হচ্ছে কি না
6. tenant card-এ member count increase হচ্ছে কি না
7. mobile view-এ button overflow হচ্ছে কি না
