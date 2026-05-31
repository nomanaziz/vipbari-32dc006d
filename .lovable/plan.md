# Login & Forgot PIN — তিনটি সমস্যার সমাধান

## ১) Forgot PIN error: "Email address ...placeholder.local is invalid"

### কারণ
Staff/employee account তৈরি হওয়ার সময় email হিসেবে `staff_xxx@placeholder.local` save হয়। এটা আসল email না — শুধু internal placeholder। Forgot Password page এ mobile দিলে `login-with-phone` সেই placeholder email ফেরত দেয়, তারপর `supabase.auth.resetPasswordForEmail()` সেটায় mail পাঠানোর চেষ্টা করে এবং Supabase reject করে।

### সমাধান
- `login-with-phone` edge function এ check: যদি email `@placeholder.local` দিয়ে শেষ হয়, তাহলে `{ error: "no_real_email" }` ফেরত দিবে।
- `ForgotPassword.tsx` সেই error দেখলে clear Bangla message দিবে: "এই মোবাইল নাম্বারে কোনো বৈধ email নেই। PIN reset করতে আপনার মালিক/admin এর সাথে যোগাযোগ করুন।"
- Staff/tenant যাদের real email নেই (admin-created), তারা শুধু landlord/admin এর মাধ্যমেই PIN reset করতে পারবে (Staff Password Dialog আগে থেকেই আছে)।
- যেহেতু SMS gateway এখনো নাই, mobile-based OTP reset এখন possible না — তাই এটাই সঠিক behavior।

## ২) Login page এ "Sign in with Google" যোগ

Register page এ Google button আছে কিন্তু Login page এ নাই। `Login.tsx` এ একই Google sign-in button যোগ করব (Register এর মতো একই SVG ও handler)। যেহেতু login এ role আগে থেকেই জানা থাকে না, OAuth flow এ existing user হলে তার current role auto-detect হবে; নতুন হলে `/dashboard` এ যাবে (existing OAuthCallbackHandler).

## ৩) এক mobile/email এ দুই role থাকলে login এ role selector

### Plan
একই login page থাকবে (option B: আপনার দ্বিতীয় idea)। Email+PIN বা phone+PIN দিয়ে login successful হওয়ার পর:

```text
User এর user_roles fetch
   │
   ├─ শুধু landlord  → /dashboard
   ├─ শুধু tenant   → /dashboard (tenant module)
   ├─ admin/employee → block (error, must use admin login)
   └─ landlord + tenant দুটোই → Role Selector Dialog দেখাবে
                                  ├─ "বাড়িওয়ালা হিসেবে প্রবেশ করুন" → /dashboard
                                  └─ "ভাড়াটিয়া হিসেবে প্রবেশ করুন" → /dashboard
```

### Implementation
- `Login.tsx` এ login success-এর পর `user_roles` table থেকে সব role আনব।
- যদি landlord ও tenant দুটোই থাকে → modal/dialog দেখাবে দুটো বড় button দিয়ে (বাড়িওয়ালা / ভাড়াটিয়া)।
- User এর choice `localStorage.active_role` এ save হবে।
- `AppLayout`/`Dashboard` route এ `active_role` দেখে correct module render হবে (যেটা ইতিমধ্যে role-based routing দিয়ে কাজ করছে — শুধু selected role-কে primary হিসেবে treat করতে হবে)।
- Top-bar এ একটা small "Role switch" option থাকবে যাতে user পরে role swap করতে পারে (logout না করে)।

## পরিবর্তিত files
- `supabase/functions/login-with-phone/index.ts` — placeholder email filter
- `src/pages/ForgotPassword.tsx` — better error message
- `src/pages/Login.tsx` — Google sign-in button + role detection + role selector dialog
- `src/components/RoleSelectorDialog.tsx` (নতুন) — দুই button-এর modal
- `src/contexts/AuthContext.tsx` — `activeRole` state + setter, localStorage-এ persist
- `src/components/AppLayout.tsx` বা relevant routing — `activeRole` respect করবে
- একটা ছোট "Switch Role" menu item top-bar এ (যদি user-এর dual role থাকে)

কোনো DB migration লাগবে না।
