import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Play, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const categories = ["all", "landlord", "tenant", "staff", "general"];

function getYoutubeThumbnail(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "";
}

const Tutorials = () => {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ["public-tutorials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tutorials" as any)
        .select("*")
        .eq("is_published", true)
        .order("sort_order");
      return data || [];
    },
  });

  const filtered = activeCategory === "all"
    ? tutorials
    : tutorials.filter((t: any) => t.category === activeCategory);

  const getCounts = (cat: string) =>
    cat === "all" ? tutorials.length : tutorials.filter((t: any) => t.category === cat).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Video className="h-4 w-4" />
            {tutorials.length} {t("tutorial.video_count")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {t("tutorial.title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("tutorial.subtitle")}
          </p>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="max-w-6xl mx-auto px-4 py-8 w-full">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="flex-wrap h-auto gap-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="gap-1.5">
                {t(`tutorial.${cat}`)}
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {getCounts(cat)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Video Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">{t("tutorial.no_tutorials")}</p>
            <p className="text-sm">{t("tutorial.coming_soon")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((tut: any) => {
              const thumb = tut.thumbnail_url || getYoutubeThumbnail(tut.youtube_url);
              const title = language === "bn" ? (tut.title_bn || tut.title_en) : tut.title_en;
              const desc = language === "bn" ? (tut.description_bn || tut.description_en) : tut.description_en;

              return (
                <a
                  key={tut.id}
                  href={tut.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-video bg-muted">
                    {thumb ? (
                      <img src={thumb} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                        <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                      {t(`tutorial.${tut.category}`)}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {title}
                    </h3>
                    {desc && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
                      <ExternalLink className="h-3 w-3" />
                      YouTube
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-12 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">{t("tutorial.cta_title")}</h2>
          <p className="text-muted-foreground mb-6">{t("tutorial.cta_desc")}</p>
          <Link to="/register">
            <Button size="lg" className="px-8">{t("landing.get_started")}</Button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Tutorials;
