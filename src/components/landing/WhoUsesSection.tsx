import { useLanguage } from "@/contexts/LanguageContext";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Home, UserCog } from "lucide-react";
import AppIcon from "./AppIcon";

const WhoUsesSection = () => {
  const { t } = useLanguage();
  const { lc } = useLandingContent();

  const items = [
    { icon: Building2, color: "blue", key: "multi" },
    { icon: Users, color: "green", key: "mess" },
    { icon: Home, color: "orange", key: "shop" },
    { icon: UserCog, color: "purple", key: "manager" },
  ];

  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            {lc("who_badge", "landing.who_badge")}
          </span>
          <h2 className="text-3xl font-bold mb-3">{lc("who_title", "landing.who_title")}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <AppIcon icon={item.icon} color={item.color} />
                <h3 className="font-semibold mt-4 mb-1">{lc(`who_${item.key}`, `landing.who_${item.key}`)}</h3>
                <p className="text-sm text-muted-foreground">{lc(`who_${item.key}_desc`, `landing.who_${item.key}_desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoUsesSection;
