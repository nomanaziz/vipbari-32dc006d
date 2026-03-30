

## Plan: Redesign Hero Phone Mockup — Smaller, Colorful, Light Theme

Inspired by the reference image, the phone mockup will be redesigned to be smaller, use a light/white background (like a real app screenshot), and have more colorful, detailed content with different numbers.

### Changes to `src/components/landing/HeroSection.tsx`

**1. Shrink the phone mockup**
- Reduce from `w-[280px] h-[540px]` to `w-[240px] h-[460px]`

**2. Light theme phone screen** (matching reference)
- Phone inner background: white/light gray instead of dark `bg-slate-800` → `bg-white`
- All text inside phone becomes dark text
- Cards use soft colored backgrounds (green tints, peach, lavender) instead of `bg-white/5`

**3. Richer phone content matching reference style**
- **Header**: Green icon + "বাড়িওয়ালা" + green "অনলাইন" badge
- **3 stat cards** with colored backgrounds:
  - ভাড়াটিয়া **36** (green bg)
  - আদায় **৳১.২L** (green bg) 
  - রুম **22** (green bg)
- **Chart section**: "মাসিক আদায়" bar chart with green bars + "+12%" badge
- **Donut/progress ring**: 75% collection rate with stats
- **4 quick action buttons** at bottom with soft colored backgrounds (peach, lavender, green, mint): পে বিলস, SMS, মেসেজ, বিলবোর্ড

**4. Update floating cards** with different numbers
- ভাড়াটিয়া ৩৬ জন
- আদায় ৳১.২L  
- WhatsApp ১-ক্লিক
- বিল অটো
- ১৫০০+ বাড়িওয়ালা

**5. Floating cards styling** — use white background with subtle shadow (like reference) instead of dark glass:
- `bg-white shadow-md border border-gray-100` with dark text
- Colored icon circles (green, amber, purple)

### Files Modified
| File | Change |
|------|--------|
| `src/components/landing/HeroSection.tsx` | Smaller phone, light theme screen, colorful cards, new numbers, white floating cards |

No other files need changes.
