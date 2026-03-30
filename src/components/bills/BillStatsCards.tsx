import { Card, CardContent } from "@/components/ui/card";
import { Receipt, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BillStatsCardsProps {
  totalDue: number;
  paidThisMonth: number;
  totalPaid: number;
  overdueCount: number;
}

export function BillStatsCards({ totalDue, paidThisMonth, totalPaid, overdueCount }: BillStatsCardsProps) {
  const { language } = useLanguage();

  const stats = [
    {
      label: language === "bn" ? "মোট বকেয়া" : "Total Due",
      value: `৳${totalDue.toLocaleString()}`,
      icon: Receipt,
      iconBg: "bg-red-500",
      bg: "from-red-50 to-red-100",
    },
    {
      label: language === "bn" ? "এই মাসে পরিশোধ" : "Paid This Month",
      value: `৳${paidThisMonth.toLocaleString()}`,
      icon: CheckCircle2,
      iconBg: "bg-emerald-500",
      bg: "from-emerald-50 to-emerald-100",
    },
    {
      label: language === "bn" ? "মোট পরিশোধিত" : "Total Paid",
      value: `৳${totalPaid.toLocaleString()}`,
      icon: TrendingUp,
      iconBg: "bg-violet-500",
      bg: "from-violet-50 to-violet-100",
    },
    {
      label: language === "bn" ? "মেয়াদোত্তীর্ণ বিল" : "Overdue Bills",
      value: String(overdueCount),
      icon: AlertTriangle,
      iconBg: "bg-orange-500",
      bg: "from-orange-50 to-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label} className={`bg-gradient-to-br ${s.bg} border-0 shadow-sm`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${s.iconBg} flex items-center justify-center`}>
              <s.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
