import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Home, AlertCircle } from "lucide-react";

interface Props {
  total: number;
  occupied: number;
  noRoom: number;
}

const TenantStatsCards = ({ total, occupied, noRoom }: Props) => {
  const { t } = useLanguage();

  const stats = [
    { label: t("tenant.total"), value: total, icon: Users, iconBg: "bg-pink-500", bg: "from-pink-50 to-pink-100" },
    { label: t("tenant.occupied"), value: occupied, icon: Home, iconBg: "bg-emerald-500", bg: "from-emerald-50 to-emerald-100" },
    { label: t("tenant.no_room"), value: noRoom, icon: AlertCircle, iconBg: "bg-orange-500", bg: "from-orange-50 to-orange-100" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className={`bg-gradient-to-br ${s.bg} border-0 shadow-sm`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${s.iconBg} flex items-center justify-center`}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TenantStatsCards;
