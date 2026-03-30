import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Wallet, Zap, ShieldCheck } from "lucide-react";
import AppIcon from "./AppIcon";

const BenefitsSection = () => {
  const { t } = useLanguage();

  const items = [
    { icon: CheckCircle2, color: "blue", key: "hassle" },
    { icon: Wallet, color: "green", key: "save_money" },
    { icon: Zap, color: "orange", key: "save_time" },
    { icon: ShieldCheck, color: "purple", key: "peace" },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            {t("landing.benefit_badge")}
          </span>
          <h2 className="text-3xl font-bold mb-3">{t("landing.benefit_title")}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <AppIcon icon={item.icon} color={item.color} />
                <h3 className="font-semibold mt-4 mb-1">{t(`landing.benefit_${item.key}`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`landing.benefit_${item.key}_desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
