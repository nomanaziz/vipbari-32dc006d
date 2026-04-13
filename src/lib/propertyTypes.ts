// Centralized property type labels and grouping for the whole app

export interface PropertyTypeGroup {
  label_en: string;
  label_bn: string;
  types: { value: string; en: string; bn: string }[];
}

export const propertyTypeGroups: PropertyTypeGroup[] = [
  {
    label_en: "Residential",
    label_bn: "আবাসিক",
    types: [
      { value: "building", en: "Building", bn: "পাকা বিল্ডিং" },
      { value: "house", en: "House", bn: "বাড়ি" },
      { value: "duplex", en: "Duplex", bn: "ডুপ্লেক্স" },
      { value: "semi_pucca", en: "Semi-Pucca", bn: "সেমি-পাকা" },
      { value: "tin_shed", en: "Tin Shed / Common", bn: "টিনশেড / কমন" },
      { value: "sublet", en: "Sublet", bn: "সাবলেট" },
      { value: "mess", en: "Mess", bn: "মেস" },
      { value: "hostel", en: "Hostel", bn: "হোস্টেল" },
      { value: "slum", en: "Slum", bn: "বস্তি" },
    ],
  },
  {
    label_en: "Commercial",
    label_bn: "বাণিজ্যিক",
    types: [
      { value: "shop", en: "Shop / Showroom", bn: "দোকান / শোরুম" },
      { value: "office", en: "Office Building", bn: "অফিস বিল্ডিং" },
      { value: "warehouse", en: "Warehouse / Godown", bn: "গোডাউন / ওয়্যারহাউস" },
      { value: "factory", en: "Factory / Mill", bn: "মিল-কারখানা" },
      { value: "commercial_complex", en: "Commercial Complex", bn: "বাণিজ্যিক কমপ্লেক্স" },
      { value: "market", en: "Market", bn: "মার্কেট" },
    ],
  },
  {
    label_en: "Other",
    label_bn: "অন্যান্য",
    types: [
      { value: "plot", en: "Plot / Land", bn: "প্লট / জমি" },
    ],
  },
];

/** Flat lookup: value → label based on language */
export function getPropertyTypeLabel(value: string, language: string): string {
  for (const group of propertyTypeGroups) {
    const found = group.types.find((t) => t.value === value);
    if (found) return language === "bn" ? found.bn : found.en;
  }
  return value;
}

/** All type values as flat array */
export const allPropertyTypes = propertyTypeGroups.flatMap((g) => g.types.map((t) => t.value));
