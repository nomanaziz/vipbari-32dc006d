

# বুকিং মানি / অগ্রিম টাকা ট্র্যাকিং সিস্টেম

## বর্তমান অবস্থা
- `tenants` table-এ `advance_balance` (numeric) column আছে — শুধু একটা number, কোনো transaction history নেই
- Accounting page-এ manual income/expense entry আছে, কিন্তু booking money এর dedicated tracking নেই

## কি তৈরি হবে

**ভাড়াটিয়া-ভিত্তিক বুকিং মানি লেজার** — প্রতিটি টাকা জমা, কর্তন বা ফেরতের ইতিহাস রাখবে।

### পলিসি সাপোর্ট:
1. **চুক্তি শেষে পূর্ণ ফেরত** — দোকান/মার্কেটের জন্য, চুক্তি শেষ হলে পুরো টাকা ফেরত
2. **ভাড়া থেকে কর্তন** — বুকিং মানি থেকে মাসিক ভাড়া কেটে রাখা (যেমন শেষ ৬ মাসের ভাড়া)
3. **ক্যাশ ফেরত** — নগদ টাকা ফেরত দেওয়া

---

## ১) Database Migration

নতুন `booking_transactions` table:
```sql
CREATE TABLE public.booking_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'deposit',  -- deposit, rent_deduct, cash_refund, full_refund
  amount numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
-- RLS: owner can manage, tenant can view own
```

`tenants` table-এ `advance_balance` column ইতোমধ্যে আছে — এটা `booking_transactions` sum থেকে auto-calculate হবে।

## ২) TenantFormDialog.tsx পরিবর্তন
- `advance_balance` field-এর label পরিবর্তন: "বুকিং মানি / অগ্রিম (৳)" 
- এটা initial deposit হিসেবে save হবে + `booking_transactions`-এ "deposit" entry যোগ হবে

## ৩) Tenants.tsx পরিবর্তন
- প্রতিটি tenant card-এ **বুকিং ব্যালেন্স** দেখাবে (যদি > 0)
- Tenant dropdown menu-তে নতুন option: **"বুকিং মানি ম্যানেজ"**
- Click করলে **BookingMoneyDialog** খুলবে

## ৪) নতুন Component: `BookingMoneyDialog.tsx`

Dialog-এ দেখাবে:
- **বর্তমান ব্যালেন্স** (মোট জমা - মোট কর্তন/ফেরত)
- **Transaction history** — তারিখ, ধরন, পরিমাণ
- **৩টি Action button:**
  - **➕ জমা যোগ করুন** — নতুন deposit (পরিমাণ + বিবরণ)
  - **🏠 ভাড়া থেকে কাটুন** — rent deduction (পরিমাণ + কোন মাসের ভাড়া)
  - **💵 ক্যাশ ফেরত** — cash refund (পরিমাণ + বিবরণ)
- প্রতিটি transaction accounting_entries তেও auto-entry করবে

## ৫) Accounting integration
- Booking money deposit → accounting-এ "advance_payment" income
- Rent deduction → advance_balance কমবে, ভাড়া paid হিসেবে count হবে
- Cash refund → accounting-এ "booking_refund" expense

---

### পরিবর্তিত/নতুন files:
- `supabase/migrations/` — booking_transactions table + RLS
- `src/components/tenants/BookingMoneyDialog.tsx` — নতুন
- `src/pages/Tenants.tsx` — booking balance display + menu option
- `src/components/tenants/TenantFormDialog.tsx` — label update
- `src/components/accounting/AccountingEntryDialog.tsx` — নতুন category যোগ

