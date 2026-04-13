

# ফ্লোটিং ক্যালকুলেটর উইজেট

## কি হবে
AppLayout-এর header bar-এ একটি Calculator icon button যোগ হবে। Click করলে একটি **draggable floating calculator** popup আসবে যেটা window-এর যেকোনো জায়গায় সরানো যাবে।

## Calculator Features
- যোগ, বিয়োগ, গুণ, ভাগ, percentage
- Clear (C) ও backspace
- Draggable — মাউস/টাচ দিয়ে সরানো যাবে
- Close button দিয়ে বন্ধ করা যাবে

## পরিবর্তন

### 1) নতুন Component: `src/components/FloatingCalculator.tsx`
- State: display value, operand, operator
- Draggable div (onMouseDown/onTouchStart drag logic)
- Standard calculator layout (0-9, +, -, ×, ÷, %, =, C, ⌫)
- Compact design, rounded, shadow

### 2) `src/components/AppLayout.tsx`
- Header bar-এ NotificationBell-এর পাশে Calculator icon button যোগ
- Click করলে FloatingCalculator toggle হবে
- Calculator একটি portal/fixed-position element হিসেবে render হবে

### পরিবর্তিত files
- `src/components/FloatingCalculator.tsx` — নতুন
- `src/components/AppLayout.tsx` — calculator button ও state

