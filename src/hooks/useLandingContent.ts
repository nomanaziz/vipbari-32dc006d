import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface LandingSection {
  id: string;
  section_key: string;
  value_bn: string;
  value_en: string;
  section_group: string;
  sort_order: number;
  is_active: boolean;
}

export function useLandingContent() {
  const { language, t } = useLanguage();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["landing_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_sections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LandingSection[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sectionMap = new Map<string, LandingSection>();
  sections.forEach((s) => sectionMap.set(s.section_key, s));

  /** Get landing content by key. Falls back to translation system. */
  const lc = (key: string, fallbackKey?: string): string => {
    const section = sectionMap.get(key);
    if (section) {
      const val = language === "bn" ? section.value_bn : section.value_en;
      if (val) return val;
    }
    if (fallbackKey) return t(fallbackKey);
    return "";
  };

  /** Get all sections in a group, sorted */
  const getGroup = (group: string) =>
    sections.filter((s) => s.section_group === group);

  return { lc, getGroup, sections, isLoading };
}
