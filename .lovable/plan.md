
সমস্যাটা আমি read-only mode-এ দেখে confirm করেছি: error-এর root cause frontend code না, database constraint.

কি হচ্ছে:
- `PaymentAccountCard.tsx` এ save করার সময়:
  `upsert(..., { onConflict: "owner_id" })`
- `UtilitySettingsTab.tsx` এ save করার সময়:
  `upsert(..., { onConflict: "owner_id,key" })`

কিন্তু database table schema-তে এই `ON CONFLICT` target-এর জন্য required unique constraint নেই:
- `payment_accounts.owner_id` এ unique নেই
- `landlord_settings (owner_id, key)` এ composite unique নেই

এই কারণেই payment আর utility দুই জায়গাতেই একই error আসছে:
`there is no unique or exclusion constraint matching the ON CONFLICT specification`

আমি language issue-ও check করেছি:
- বাংলা/English switch feature already আছে
- এটা `AdvanceSettingsTab` এর ভিতরে আছে
- তাই “শুধু English আছে” সমস্যা feature-missing না, বরং UI placement/visibility issue হতে পারে

Implementation plan:

1. Database migration দিয়ে দুইটা unique constraint add করবো
```sql
ALTER TABLE public.payment_accounts
ADD CONSTRAINT payment_accounts_owner_id_key UNIQUE (owner_id);

ALTER TABLE public.landlord_settings
ADD CONSTRAINT landlord_settings_owner_id_key_key UNIQUE (owner_id, key);
```

2. Existing settings save flow একই থাকবে
- `PaymentAccountCard.tsx`-এর `upsert(onConflict: "owner_id")`
- `UtilitySettingsTab.tsx`-এর `upsert(onConflict: "owner_id,key")`
এগুলো database fix-এর পর কাজ করবে

3. Settings page-এ language option visibility improve করবো
- বাংলা/English switch যেন clearly দেখা যায় সেটা adjust করবো
- দরকার হলে profile/settings area-তে আরও visible position-এ আনবো
- plain readable text রাখবো

4. Quick audit করবো advance settings-এ একই pattern আছে কিনা
- future-এ আর কোনো settings save এ একই conflict error না আসে সেটা verify করবো

Technical notes:
- `payment_accounts` table এখন single-row-per-owner pattern use করছে, তাই `owner_id` unique হওয়া দরকার
- `landlord_settings` key-value settings table, তাই `(owner_id, key)` unique হওয়া দরকার
- এটি schema fix; frontend logic মূলত ঠিকই আছে
