

# ভাড়াটিয়া ফর্মে দুইটি পরিবর্তন

## পরিবর্তন ১: শিক্ষাগত যোগ্যতা Select + Custom

**বর্তমান অবস্থা:** Education field একটি plain text Input (line 392-395)

**পরিবর্তন:** Select dropdown দিয়ে বাংলাদেশী শিক্ষাগত যোগ্যতা options + "অন্যান্য" option-এ custom text input

Options:
- অশিক্ষিত / Illiterate
- পঞ্চম পাস / PSC
- অষ্টম পাস / JSC
- এসএসসি / SSC
- এইচএসসি / HSC
- ডিপ্লোমা / Diploma
- অনার্স / Honours
- বিএসসি / BSc
- মাস্টার্স / Masters
- এমএসসি / MSc
- এমবিএ / MBA
- এমবিবিএস / MBBS
- পিএইচডি / PhD
- অন্যান্য / Other (custom text input দেখাবে)

## পরিবর্তন ২: Room select আগে আনা + বর্তমান ঠিকানা auto-fill

**বর্তমান অবস্থা:** 
- Room selection ফর্মের একদম শেষে (line 730+)
- নতুন tenant তৈরি করার সময় বর্তমান ঠিকানা editable fields দেখায়
- Room select করলে property address auto-fill হয় না

**পরিবর্তন:**
- "রুম ও অ্যাসাইনমেন্ট" section-টি **স্থায়ী ঠিকানার আগে** নিয়ে আসবো (Basic Info-র পরে)
- নতুন tenant-এ room select করলে `availableRooms` থেকে ঐ room-এর property data নিয়ে বর্তমান ঠিকানা auto-fill + disabled দেখাবে
- Room select না করলে manual editable fields দেখাবে

### পরিবর্তিত file
- `src/components/tenants/TenantFormDialog.tsx` — education dropdown, room section reorder, present address auto-fill

