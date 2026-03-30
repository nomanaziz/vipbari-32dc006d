import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { DoorOpen, Search, MapPin, Bell, ArrowRight, Sparkles } from "lucide-react";

const ToLetHighlight = () => {
  const { t } = useLanguage();

  const bullets = [
    { icon: Sparkles, text: t("landing.tolet_hl_auto") || "Auto-publish vacant rooms instantly" },
    { icon: Bell, text: t("landing.tolet_hl_request") || "Receive tenant requests directly" },
    { icon: MapPin, text: t("landing.tolet_hl_location") || "Division, District & Thana filters" },
    { icon: Search, text: t("landing.tolet_hl_free") || "Tenants browse for free" },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Gradient background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 dark:from-primary/10 dark:to-primary/5" />
      
      <div className="max-w-5xl mx-auto relative">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left — content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full">
              <DoorOpen className="h-4 w-4" />
              {t("landing.tolet_hl_badge") || "⭐ Best Feature"}
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              {t("landing.tolet_hl_title") || "Find Tenants Fast with To-Let"}
            </h2>

            <p className="text-muted-foreground text-lg">
              {t("landing.tolet_hl_desc") || "Publish your vacant rooms online. Tenants search by location and send rental requests — no middleman, no hassle."}
            </p>

            <ul className="space-y-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" asChild>
                <Link to="/tolet" className="gap-2">
                  {t("landing.tolet_hl_browse") || "Browse Listings"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">
                  {t("landing.tolet_hl_publish") || "Publish Your Room"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — visual card */}
          <div className="relative">
            <div className="rounded-2xl border bg-card p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <DoorOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-lg">{t("landing.tolet_hl_card_title") || "To-Let Listings"}</p>
                  <p className="text-sm text-muted-foreground">{t("landing.tolet_hl_card_sub") || "Live vacancy board"}</p>
                </div>
              </div>

              {/* Fake listing cards */}
              {[
                { room: "3A", type: "Flat", rent: "১২,০০০", loc: "Mirpur, Dhaka" },
                { room: "B2", type: "Room", rent: "৫,০০০", loc: "Uttara, Dhaka" },
                { room: "5C", type: "Shop", rent: "২০,০০০", loc: "Gulshan, Dhaka" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {item.room}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.type} · ৳{item.rent}</p>
                      <p className="text-xs text-muted-foreground">{item.loc}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    {t("dashboard.vacant") || "Vacant"}
                  </span>
                </div>
              ))}
            </div>

            {/* Decorative dots */}
            <div className="absolute -z-10 -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToLetHighlight;
