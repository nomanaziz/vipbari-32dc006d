import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { FileBarChart } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function Reports() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: maintenanceData = [] } = useQuery({
    queryKey: ["report_maintenance", user?.id, fromDate, toDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("asset_maintenance")
        .select("*, assets(name, category)")
        .eq("owner_id", user!.id)
        .gte("maintenance_date", fromDate)
        .lte("maintenance_date", toDate)
        .order("maintenance_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: serviceData = [] } = useQuery({
    queryKey: ["report_services", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("service_type, price, payment_frequency, contact_name")
        .eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Maintenance report: group by asset
  const assetSummary = maintenanceData.reduce((acc: Record<string, { name: string; count: number; total: number }>, m: any) => {
    const name = (m as any).assets?.name || "Unknown";
    if (!acc[name]) acc[name] = { name, count: 0, total: 0 };
    acc[name].count += 1;
    acc[name].total += (m.amount || 0);
    return acc;
  }, {});
  const assetSummaryArr = Object.values(assetSummary);

  // Monthly expense chart
  const monthlyExpense = maintenanceData.reduce((acc: Record<string, number>, m: any) => {
    const month = m.maintenance_date?.slice(0, 7) || "unknown";
    acc[month] = (acc[month] || 0) + (m.amount || 0);
    return acc;
  }, {});
  const monthlyChartData = Object.entries(monthlyExpense)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  // Category pie chart
  const categoryExpense = maintenanceData.reduce((acc: Record<string, number>, m: any) => {
    const cat = (m as any).assets?.category || "other";
    acc[cat] = (acc[cat] || 0) + (m.amount || 0);
    return acc;
  }, {});
  const categoryPieData = Object.entries(categoryExpense).map(([name, value]) => ({ name, value }));

  // Service cost summary
  const serviceMonthlyCost = serviceData.reduce((total: number, s: any) => {
    if (s.payment_frequency === "monthly") return total + (s.price || 0);
    if (s.payment_frequency === "daily") return total + (s.price || 0) * 30;
    if (s.payment_frequency === "weekly") return total + (s.price || 0) * 4;
    return total;
  }, 0);

  const totalMaintenanceCost = maintenanceData.reduce((t: number, m: any) => t + (m.amount || 0), 0);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileBarChart className="h-6 w-6" />
        {L("Reports", "রিপোর্ট")}
      </h1>

      <div className="flex gap-3 items-end">
        <div>
          <Label>{L("From", "শুরু")}</Label>
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label>{L("To", "শেষ")}</Label>
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
        </div>
      </div>

      <Tabs defaultValue="maintenance">
        <TabsList>
          <TabsTrigger value="maintenance">{L("Maintenance Report", "রক্ষণাবেক্ষণ রিপোর্ট")}</TabsTrigger>
          <TabsTrigger value="financial">{L("Financial Report", "আর্থিক রিপোর্ট")}</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{L("Total Records", "মোট রেকর্ড")}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{maintenanceData.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{L("Total Cost", "মোট খরচ")}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">৳{totalMaintenanceCost.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{L("Assets Maintained", "রক্ষণাবেক্ষিত সম্পদ")}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{assetSummaryArr.length}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>{L("Asset-wise Maintenance", "সম্পদ অনুযায়ী রক্ষণাবেক্ষণ")}</CardTitle></CardHeader>
            <CardContent>
              {assetSummaryArr.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{L("No data", "কোন ডাটা নেই")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{L("Asset", "সম্পদ")}</TableHead>
                      <TableHead>{L("Times Repaired", "মেরামত সংখ্যা")}</TableHead>
                      <TableHead>{L("Total Cost (৳)", "মোট খরচ (৳)")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetSummaryArr.map((a: any) => (
                      <TableRow key={a.name}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.count}</TableCell>
                        <TableCell>৳{a.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{L("Maintenance Cost", "রক্ষণাবেক্ষণ খরচ")}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">৳{totalMaintenanceCost.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{L("Monthly Service Cost", "মাসিক সেবা খরচ")}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">৳{serviceMonthlyCost.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{L("Total Estimated Monthly", "মোট আনুমানিক মাসিক")}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-primary">৳{(serviceMonthlyCost + Math.round(totalMaintenanceCost / Math.max(monthlyChartData.length, 1))).toLocaleString()}</div></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{L("Monthly Maintenance Expense", "মাসিক রক্ষণাবেক্ষণ খরচ")}</CardTitle></CardHeader>
              <CardContent>
                {monthlyChartData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{L("No data", "কোন ডাটা নেই")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{L("Expense by Category", "ক্যাটাগরি অনুযায়ী খরচ")}</CardTitle></CardHeader>
              <CardContent>
                {categoryPieData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{L("No data", "কোন ডাটা নেই")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={categoryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categoryPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
