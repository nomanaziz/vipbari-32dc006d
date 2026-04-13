

# SMS অপশন Admin থেকে On/Off নিয়ন্ত্রণ

## কি হবে
Admin Settings-এ প্রতিটি subscription product (Room, To-Let, Sale Listing, Boost, SMS) on/off করার toggle থাকবে। SMS ডিফল্ট off থাকবে। Off করা product Subscription page-এ দেখাবে না।

## পরিবর্তন

### 1) `AdminSettings.tsx`
`defaultSettings`-এ নতুন keys যোগ:
```
product_room_enabled: "true"
product_tolet_enabled: "true"  
product_sale_listing_enabled: "true"
product_boost_enabled: "true"
product_sms_enabled: "false"   ← ডিফল্ট off
```
UI-তে একটা নতুন Card "প্রোডাক্ট নিয়ন্ত্রণ" — প্রতিটি product-এর জন্য Switch toggle।

### 2) `Subscription.tsx`
- Page load-এ `site_settings` থেকে `product_*_enabled` keys fetch করবে
- যে product disabled, সেটার Card, chip selector, summary line, এবং cart add logic সব hide/skip হবে
- SMS section শুধু `product_sms_enabled === "true"` হলে দেখাবে

### পরিবর্তিত files
- `src/pages/admin/AdminSettings.tsx` — product toggle section
- `src/pages/Subscription.tsx` — fetch settings + conditional render

কোনো migration লাগবে না — `site_settings` table-এ key-value হিসেবে save হবে।

