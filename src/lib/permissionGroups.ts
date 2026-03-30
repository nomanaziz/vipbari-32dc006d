export interface PermissionItem {
  key: string;
  label_bn: string;
  label_en: string;
}

export interface PermissionGroup {
  key: string;
  label_bn: string;
  label_en: string;
  icon?: string;
  permissions: PermissionItem[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "tenants",
    label_bn: "ভাড়াটিয়া",
    label_en: "Tenants",
    permissions: [
      { key: "view_tenants", label_bn: "ভাড়াটিয়া দেখতে পারবে", label_en: "Can view tenants" },
      { key: "manage_tenants", label_bn: "ভাড়াটিয়া যোগ/সম্পাদনা করতে পারবে", label_en: "Can add/edit tenants" },
    ],
  },
  {
    key: "bills_payments",
    label_bn: "বিল ও পেমেন্ট",
    label_en: "Bills & Payments",
    permissions: [
      { key: "view_bills", label_bn: "বিল দেখতে পারবে", label_en: "Can view bills" },
      { key: "manage_bills", label_bn: "বিল তৈরি/সম্পাদনা করতে পারবে", label_en: "Can create/edit bills" },
      { key: "view_payments", label_bn: "পেমেন্ট দেখতে পারবে", label_en: "Can view payments" },
      { key: "manage_payments", label_bn: "পেমেন্ট পরিচালনা করতে পারবে", label_en: "Can manage payments" },
      { key: "manage_rent", label_bn: "ভাড়া পরিচালনা করতে পারবে", label_en: "Can manage rent" },
    ],
  },
  {
    key: "properties",
    label_bn: "প্রপার্টি",
    label_en: "Properties",
    permissions: [
      { key: "view_properties", label_bn: "প্রপার্টি দেখতে পারবে", label_en: "Can view properties" },
      { key: "manage_properties", label_bn: "প্রপার্টি যোগ/সম্পাদনা করতে পারবে", label_en: "Can add/edit properties" },
    ],
  },
  {
    key: "rooms",
    label_bn: "রুম/ফ্ল্যাট",
    label_en: "Rooms/Flats",
    permissions: [
      { key: "view_rooms", label_bn: "রুম দেখতে পারবে", label_en: "Can view rooms" },
      { key: "manage_rooms", label_bn: "রুম যোগ/সম্পাদনা করতে পারবে", label_en: "Can add/edit rooms" },
    ],
  },
  {
    key: "meters",
    label_bn: "মিটার",
    label_en: "Meters",
    permissions: [
      { key: "view_meters", label_bn: "মিটার দেখতে পারবে", label_en: "Can view meters" },
      { key: "manage_meters", label_bn: "মিটার পরিচালনা করতে পারবে", label_en: "Can manage meters" },
    ],
  },
  {
    key: "garages",
    label_bn: "গ্যারেজ",
    label_en: "Garages",
    permissions: [
      { key: "view_garages", label_bn: "গ্যারেজ দেখতে পারবে", label_en: "Can view garages" },
      { key: "manage_garages", label_bn: "গ্যারেজ পরিচালনা করতে পারবে", label_en: "Can manage garages" },
    ],
  },
  {
    key: "guests",
    label_bn: "গেস্ট/অতিথি",
    label_en: "Guests",
    permissions: [
      { key: "view_guests", label_bn: "গেস্ট দেখতে পারবে", label_en: "Can view guests" },
      { key: "manage_guests", label_bn: "গেস্ট পরিচালনা করতে পারবে", label_en: "Can manage guests" },
    ],
  },
  {
    key: "complaints",
    label_bn: "অভিযোগ",
    label_en: "Complaints",
    permissions: [
      { key: "manage_complaints", label_bn: "অভিযোগ পরিচালনা করতে পারবে", label_en: "Can manage complaints" },
    ],
  },
  {
    key: "notices",
    label_bn: "নোটিশ",
    label_en: "Notices",
    permissions: [
      { key: "manage_notices", label_bn: "নোটিশ পরিচালনা করতে পারবে", label_en: "Can manage notices" },
    ],
  },
  {
    key: "accounting",
    label_bn: "হিসাব",
    label_en: "Accounting",
    permissions: [
      { key: "view_accounting", label_bn: "হিসাব দেখতে পারবে", label_en: "Can view accounting" },
    ],
  },
  {
    key: "staff",
    label_bn: "স্টাফ",
    label_en: "Staff",
    permissions: [
      { key: "manage_staff", label_bn: "স্টাফ পরিচালনা করতে পারবে", label_en: "Can manage staff" },
    ],
  },
  {
    key: "others",
    label_bn: "অন্যান্য",
    label_en: "Others",
    permissions: [
      { key: "delete_records", label_bn: "রেকর্ড মুছতে পারবে", label_en: "Can delete records" },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

export function getPermissionLabel(key: string, lang: "bn" | "en"): string {
  for (const group of PERMISSION_GROUPS) {
    const perm = group.permissions.find((p) => p.key === key);
    if (perm) return lang === "bn" ? perm.label_bn : perm.label_en;
  }
  return key.replace(/_/g, " ");
}
