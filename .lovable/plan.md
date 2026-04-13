

# Payment Accounts "ON CONFLICT" Error Fix

## সমস্যা
`payment_accounts` table-এ `owner_id` column-এ কোনো **unique constraint** নেই। কিন্তু code-এ `upsert({ onConflict: "owner_id" })` ব্যবহার করা হচ্ছে। PostgreSQL unique constraint না পেয়ে error দিচ্ছে।

## সমাধান
একটি database migration দিয়ে `owner_id`-তে unique constraint যোগ করা হবে:

```sql
ALTER TABLE payment_accounts ADD CONSTRAINT payment_accounts_owner_id_key UNIQUE (owner_id);
```

## পরিবর্তন
- **1টি migration** — `payment_accounts.owner_id`-তে unique constraint add
- কোনো frontend code change লাগবে না, কারণ code already সঠিকভাবে `onConflict: "owner_id"` ব্যবহার করছে

