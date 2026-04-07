

# Replace Calendar with DD-MM-YYYY Text Input & Min Age 14

## Changes

**File: `src/pages/Register.tsx`**

1. Replace `dateOfBirth` state from `Date | undefined` to a string `""` (DD-MM-YYYY format)
2. Remove Calendar/Popover imports (`Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar`, `CalendarDays`, `cn`)
3. Replace the Popover+Calendar block (lines 206-243) with a simple `<Input>` field:
   - Placeholder: `DD-MM-YYYY`
   - Icon: calendar icon (CalendarDays)
   - Max length 10, pattern-guided input
4. Add a helper to parse DD-MM-YYYY string to Date for validation
5. Add age validation in `handleRegister`: parse the typed date, check user is at least 14 years old, show error toast if under 14
6. Convert typed DD-MM-YYYY to `yyyy-MM-dd` format when sending to Supabase signup metadata
7. Remove unused imports: `Popover`, `PopoverContent`, `PopoverTrigger`, `Calendar`, `cn`, `format` (if no longer needed elsewhere)

## Validation Logic

- Parse `DD-MM-YYYY` → check valid date (day/month ranges, leap year)
- Calculate age: compare birth date to today
- If age < 14 → toast error "You must be at least 14 years old to register" / "রেজিস্ট্রেশনের জন্য বয়স কমপক্ষে ১৪ বছর হতে হবে"
- Keep existing `date > now` and `date < 1920` checks

## Input UX

- Auto-insert dashes as user types (e.g., typing `07042012` becomes `07-04-2012`)
- Or simpler: just let user type with placeholder guidance

