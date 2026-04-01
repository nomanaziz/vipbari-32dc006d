import { useLanguage } from "@/contexts/LanguageContext";
import { useLandingContent } from "@/hooks/useLandingContent";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

const PaymentMethodsSection = () => {
  const { t } = useLanguage();
  const { lc } = useLandingContent();

  const methods = [
    { key: "bkash", color: "bg-gradient-to-br from-pink-500 to-pink-700", label: "bKash" },
    { key: "nagad", color: "bg-gradient-to-br from-orange-500 to-orange-700", label: "Nagad" },
    { key: "rocket", color: "bg-gradient-to-br from-purple-500 to-purple-700", label: "Rocket" },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">{lc("payment_title", "landing.payment_title")}</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">{lc("payment_sub", "landing.payment_sub")}</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {methods.map((m) => (
            <Card key={m.key} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl ${m.color} flex items-center justify-center shadow-lg mb-4`}>
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">{lc(`payment_${m.key}`, `landing.payment_${m.key}`)}</h3>
                <p className="text-sm text-muted-foreground">{lc(`payment_${m.key}_desc`, `landing.payment_${m.key}_desc`)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaymentMethodsSection;
