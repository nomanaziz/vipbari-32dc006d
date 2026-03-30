import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { ArrowLeft } from "lucide-react";

const CMSPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

  const { data: page, isLoading } = useQuery({
    queryKey: ["cms-page", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings-contact"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["support_email", "support_phone"]);
      const map: Record<string, string> = {};
      data?.forEach((s: any) => {
        map[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      });
      return map;
    },
  });

  const title = language === "bn" ? page?.title_bn : page?.title_en;
  let content = language === "bn" ? page?.content_bn : page?.content_en;

  // Replace contact placeholders with values from Admin Settings
  if (content && siteSettings) {
    content = content
      .replace(/\{\{support_email\}\}/g, siteSettings.support_email || "support@vipbari.com")
      .replace(/\{\{support_phone\}\}/g, siteSettings.support_phone || "+880 1700-000000");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : page ? (
          <article>
            <h1 className="text-3xl font-bold mb-6">{title}</h1>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content || "" }} />
          </article>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Page not found</div>
        )}
      </main>
      <LandingFooter />
    </div>
  );
};

export default CMSPage;
