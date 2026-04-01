

## Plan: Copy Feature Text from bariwala.pro & Update Comparison Table

### 1. Update Feature Text (Bangla descriptions from bariwala.pro)

Update `src/contexts/LanguageContext.tsx` translation keys to use bariwala.pro's richer Bangla text:

| Key | Current Bangla | New Bangla (from bariwala.pro) |
|-----|---------------|-------------------------------|
| `feat_tenant` | ভাড়াটিয়া ম্যানেজমেন্ট | ভাড়াটিয়া ম্যানেজমেন্ট |
| `feat_tenant_desc` | ভাড়াটিয়ার তথ্য, NID, ফোন... | সহজেই ভাড়াটিয়াদের তথ্য সংরক্ষণ, NID ভেরিফিকেশন এবং ট্র্যাকিং। |
| `feat_room` | রুম/ফ্ল্যাট/দোকান | রুম/ফ্ল্যাট/দোকান |
| `feat_room_desc` | প্রতিটি সম্পত্তির রুম... | সব ধরনের প্রপার্টি এক জায়গায় ম্যানেজ করুন সহজে। |
| `feat_billing` | অটো বিলিং | স্বয়ংক্রিয় বিল |
| `feat_billing_desc` | ভাড়া + ইউটিলিটি... | বিদ্যুৎ মিটার রিডিং থেকে অটোমেটিক বিল ক্যালকুলেশন। |
| `feat_send` | বিল পাঠান | বিল পাঠান |
| `feat_send_desc` | SMS বা WhatsApp-এ... | বিল তৈরি হলে অটো পেমেন্ট লিংকসহ SMS ও WhatsApp এ বিল পাঠান। |
| `feat_payment` | অনলাইন পেমেন্ট | অনলাইন পেমেন্ট |
| `feat_payment_desc` | বিকাশ, নগদ... | ভাড়াটিয়ারা সরাসরি বিকাশ/নগদে পেমেন্ট করতে পারে। |
| `feat_report` | রিপোর্ট ও এনালিটিক্স | রিপোর্ট ও আয়-ব্যয় |
| `feat_report_desc` | মাসিক আয়... | মাসিক কালেকশন এবং বকেয়ার বিস্তারিত রিপোর্ট। |

Also update mini feature descriptions to match bariwala.pro:

| Key | New Bangla |
|-----|-----------|
| `mini_link` | পেমেন্ট লিংক |
| `mini_sms` | অটো SMS/WhatsApp |
| `mini_elec` | বিদ্যুৎ বিল |
| `mini_water` | পানি বিল |
| `mini_gas` | গ্যাস বিল |
| `mini_wifi` | ওয়াইফাই বিল |
| `mini_notif` | নোটিফিকেশন |
| `mini_security` | নিরাপদ |
| `mini_pdf` | PDF ডাউনলোড |
| `mini_backup` | ডেটা ব্যাকআপ |
| `mini_share` | বিল শেয়ার |
| `mini_history` | পেমেন্ট হিস্ট্রি |

### 2. Fix Comparison Table — All ✗ for Excel (match bariwala.pro)

bariwala.pro shows VIP Bari ✓ for all 6 rows, Manual ✗ for all, Excel ✗ for all. No partial support.

**Change in `LandingPage.tsx`** (lines 301-314): Remove the orange partial logic for Excel. All Excel cells become red `XCircle`, same as Manual.

### Files Modified
1. `src/contexts/LanguageContext.tsx` — update Bangla feature descriptions
2. `src/pages/LandingPage.tsx` — simplify comparison table (all Excel = ✗)

