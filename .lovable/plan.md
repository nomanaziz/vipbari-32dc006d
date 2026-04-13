

# প্রপার্টি টাইপ বিস্তারিত করা

## বর্তমান অবস্থা
বর্তমানে ৪টি property type আছে: **Building, House, Shop, Tin Shed**। Database-এ `property_type` হচ্ছে plain `text` field (enum না), তাই নতুন type যোগ করতে migration লাগবে না।

## প্রস্তাবিত নতুন Property Types

দুইটি ক্যাটাগরিতে ভাগ করা হবে:

### আবাসিক (Residential)
| Value | বাংলা | English |
|-------|--------|---------|
| `tin_shed` | টিনশেড / কমন | Tin Shed |
| `semi_pucca` | সেমি-পাকা | Semi-Pucca |
| `building` | পাকা বিল্ডিং | Building |
| `duplex` | ডুপ্লেক্স | Duplex |
| `house` | বাড়ি | House |
| `sublet` | সাবলেট | Sublet |
| `mess` | মেস | Mess |
| `hostel` | হোস্টেল | Hostel |
| `slum` | বস্তি | Slum |

### বাণিজ্যিক (Commercial/Non-residential)
| Value | বাংলা | English |
|-------|--------|---------|
| `shop` | দোকান/শোরুম | Shop/Showroom |
| `office` | অফিস বিল্ডিং | Office |
| `warehouse` | গোডাউন/ওয়্যারহাউস | Warehouse |
| `factory` | মিল-কারখানা | Factory |
| `commercial_complex` | বাণিজ্যিক কমপ্লেক্স | Commercial Complex |
| `market` | মার্কেট | Market |

### অন্যান্য
| Value | বাংলা | English |
|-------|--------|---------|
| `plot` | প্লট/জমি | Plot/Land |

## পরিবর্তন

### 1) `src/pages/Properties.tsx`
- `typeLabels` object-এ সব নতুন type যোগ
- Property type Select dropdown-এ **grouped options** (আবাসিক / বাণিজ্যিক / অন্যান্য header সহ)
- Default form `property_type: "building"` থাকবে

### 2) `src/components/rooms/RoomFormDialog.tsx`
- `roomTypeConfig`-এ নতুন property type গুলোর জন্য room type mapping:
  - `duplex, semi_pucca, sublet, mess, hostel, slum` → room only
  - `office, warehouse, factory` → room/shop
  - `commercial_complex, market` → shop only
  - `plot` → room (basic)

### 3) `src/lib/defaultImages.ts`
- নতুন type গুলোর জন্য default image mapping (existing SVG reuse)

### 4) অন্যান্য files যেখানে typeLabels আছে
- `src/components/sale/SaleListingCard.tsx`
- `src/pages/SaleListingDetail.tsx`
- `src/pages/BuySell.tsx` (filter options)
- `src/components/sale/SellDialog.tsx`

সব জায়গায় নতুন type labels যোগ হবে।

### পরিবর্তিত files
- `src/pages/Properties.tsx` — grouped dropdown + labels
- `src/components/rooms/RoomFormDialog.tsx` — roomTypeConfig update
- `src/lib/defaultImages.ts` — new mappings
- `src/components/sale/SaleListingCard.tsx` — labels
- `src/pages/SaleListingDetail.tsx` — labels
- `src/pages/BuySell.tsx` — filter options
- `src/components/sale/SellDialog.tsx` — labels

**কোনো database migration লাগবে না** — `property_type` already text field।

