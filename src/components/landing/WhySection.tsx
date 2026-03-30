import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Headphones, Shield, Smartphone } from "lucide-react";
import AppIcon from "./AppIcon";

const WhySection = () => {
  const { t } = useLanguage();

  const items = [
    { icon: Globe, color: "blue", key: "bangla" },
    { icon: Headphones, color: "green", key: "support" },
    { icon: Shield, color: "purple", key: "secure" },
    { icon: Smartphone, color: "orange", key: "mobile" },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            {t("landing.why_badge")}
          </span>
          <h2 className="text-3xl font-bold mb-3">{t("landing.why_title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.why_sub")}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <AppIcon icon={item.icon} color={item.color} />
                <h3 className="font-semibold mt-4 mb-1">{t(`landing.why_${item.key}`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`landing.why_${item.key}_desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
