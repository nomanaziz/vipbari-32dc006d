import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DoorOpen, Users, CreditCard, TrendingUp, AlertCircle, Home, Send, CheckCircle2, Clock, XCircle, AlertTriangle, Bell, Wallet, Car } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

const RecentActivity = ({ tenantId }: { tenantId: string }) => {
  const { t, language } = useLanguage();

  const { data: recentComplaints } = useQuery({
    queryKey: ["recent-complaints", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("complaints").select("id, title, status, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(3);
      return data || [];
    },
  });

  const { data: recentNotices } = useQuery({
    queryKey: ["recent-notices-activity", tenantId],
    queryFn: async () => {
      const { data } = await supabase.from("notices").select("id, title, created_at").order("created_at", { ascending: false }).limit(3);
      return data || [];
    },
  });

  type Activity = { type: string; title: string; status?: string; date: string };
  const activities: Activity[] = [
    ...(recentComplaints || []).map((c: any) => ({ type: "complaint" as const, title: c.title, status: c.status, date: c.created_at })),
    ...(recentNotices || []).map((n: any) => ({ type: "notice" as const, title: n.title, date: n.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (!activities.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("tenant.recent_activity")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className={`p-1.5 rounded-full ${a.type === "complaint" ? "bg-destructive/10" : "bg-primary/10"}`}>
                {a.type === "complaint" ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <Bell className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</p>
              </div>
              {a.type === "complaint" && a.status && (
                <Badge variant={a.status === "resolved" ? "default" : "secondary"} className="text-xs">
                  {a.status === "resolved" ? t("tenant.status_resolved") : a.status === "in_progress" ? t("tenant.status_in_progress") : t("tenant.status_pending")}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const TenantDashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const { data: myRequests } = useQuery({
    queryKey: ["my-tolet-requests", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tolet_requests")
        .select("*, rooms(room_number, rent_amount, properties(name))")
        .eq("tenant_user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myTenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select("*, rooms(room_number, rent_amount, properties(name, address, area, thana, district, division))")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: myBills } = useQuery({
    queryKey: ["my-bills", user?.id],
    queryFn: async () => {
      if (!myTenant) return [];
      const { data } = await supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", myTenant.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!myTenant,
  });

  const { data: latestNotices } = useQuery({
    queryKey: ["tenant-notices-marquee", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notices").select("id, title, created_at").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const totalBill = myBills?.reduce((s, b: any) => s + Number(b.total_amount), 0) || 0;
  const totalPaid = myBills?.reduce((s, b: any) => s + Number(b.received_amount || 0), 0) || 0;
  const totalDue = totalBill - totalPaid;
  const recentBills = myBills?.slice(0, 5) || [];

  const statusBadge = (status: string) => {
    switch (status) {
      case "accepted": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Accepted</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      {/* Scrolling Notice Marquee */}
      {latestNotices && latestNotices.length > 0 && (
        <Link to="/tenant/notices">
          <Card className="border-primary/20 bg-primary/5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="overflow-hidden flex-1 whitespace-nowrap">
                <div className="inline-block" style={{ animation: "marquee 20s linear infinite" }}>
                  {latestNotices.map((n: any, i: number) => (
                    <span key={n.id} className="inline-block mr-12">
                      <span className="font-medium text-sm">{n.title}</span>
                      <span className="text-xs text-muted-foreground ml-2">({new Date(n.created_at).toLocaleDateString()})</span>
                      {i < latestNotices.length - 1 && <span className="mx-4 text-muted-foreground">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Tenant Address & Room Info */}
      {myTenant && myTenant.rooms && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start gap-6">
              <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center"><Home className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("tenant.my_address")}</p>
                  <p className="font-semibold">{myTenant.rooms.properties?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[myTenant.rooms.properties?.address, myTenant.rooms.properties?.area, myTenant.rooms.properties?.thana, myTenant.rooms.properties?.district].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center"><DoorOpen className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("tenant.room_number")}</p>
                  <p className="font-semibold">{myTenant.rooms.room_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-fuchsia-500 flex items-center justify-center"><Users className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("tenant.tenant_id")}</p>
                  <p className="font-semibold text-sm">{myTenant.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <Badge variant={myTenant.status === "active" ? "default" : "secondary"} className="self-center">
                {myTenant.status === "active" ? t("tenant.active") : t("tenant.inactive")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary Cards */}
      {myTenant && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">৳{totalDue.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{language === "bn" ? "মোট বকেয়া" : "Total Due"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">৳{totalPaid.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{language === "bn" ? "মোট পরিশোধ" : "Total Paid"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950/40 dark:to-violet-900/20 border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-violet-500 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">৳{totalBill.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{language === "bn" ? "মোট বিল" : "Total Bill"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center"><Home className="h-5 w-5 text-white" /></div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{t("tolet.browse") || "Browse To-Let"}</h3>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/tenant/tolet">{t("tolet.browse_btn") || "Browse"}</Link></Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center"><Bell className="h-5 w-5 text-white" /></div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{t("tenant.notices")}</h3>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/tenant/notices">{language === "bn" ? "দেখুন" : "View"}</Link></Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/20 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{t("tenant.add_complaint")}</h3>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/tenant/complaints">{language === "bn" ? "যোগ করুন" : "File"}</Link></Button>
          </CardContent>
        </Card>

        {myTenant && (
          <Card className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-950/40 dark:to-fuchsia-900/20 border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-fuchsia-500 flex items-center justify-center"><DoorOpen className="h-5 w-5 text-white" /></div>
              <div>
                <h3 className="font-medium text-sm">{t("tolet.my_room") || "My Room"}</h3>
                <p className="text-xs text-muted-foreground">{myTenant.rooms?.room_number} — ৳{Number(myTenant.rooms?.rent_amount || 0).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      {myTenant && <RecentActivity tenantId={myTenant.id} />}

      {/* My Bills */}
      {myTenant && recentBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("nav.bills") || "My Bills"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{bill.month}</p>
                    <p className="text-sm text-muted-foreground">৳{Number(bill.total_amount).toLocaleString()}</p>
                  </div>
                  <Badge variant={bill.status === "paid" ? "default" : "secondary"}>
                    {bill.status === "paid" ? t("bill.paid") : t("bill.unpaid")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("tolet.my_requests") || "My Rental Requests"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!myRequests?.length ? (
            <div className="text-center text-muted-foreground py-8">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("tolet.no_my_requests") || "You haven't sent any rental requests yet."}</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link to="/tolet">{t("tolet.browse_btn") || "Browse Listings"}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {req.rooms?.room_number} — {req.rooms?.properties?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ৳{Number(req.rooms?.rent_amount || 0).toLocaleString()} · {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {statusBadge(req.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const LandlordDashboard = () => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();

  const { data: properties } = useQuery({
    queryKey: ["properties", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("*").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: rooms } = useQuery({
    queryKey: ["dashboard-rooms", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*, properties!inner(owner_id)").eq("properties.owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: tenants } = useQuery({
    queryKey: ["dashboard-tenants", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("*").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: bills } = useQuery({
    queryKey: ["dashboard-bills", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("bills").select("*").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: payments } = useQuery({
    queryKey: ["dashboard-payments", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: garages } = useQuery({
    queryKey: ["dashboard-garages", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("garages").select("*").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: expenses } = useQuery({
    queryKey: ["expenses-total", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("accounting_entries")
        .select("amount")
        .eq("owner_id", effectiveOwnerId!)
        .eq("type", "expense");
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const activeTenantRoomIds = new Set(
    (tenants || [])
      .filter((tenant) => tenant.status === "active" && tenant.room_id)
      .map((tenant) => tenant.room_id)
  );

  const isRoomOccupied = (room: any) => {
    if (room.status === "occupied" || room.status === "partially_occupied") return true;
    if (room.tenant_id != null) return true;
    return activeTenantRoomIds.has(room.id);
  };

  const totalRooms = rooms?.length || 0;
  const occupiedRooms = rooms?.filter(isRoomOccupied).length || 0;
  const vacantRooms = totalRooms - occupiedRooms;
  const activeTenants = tenants?.filter(t => t.status === "active").length || 0;
  const totalDue = bills?.filter(b => b.status !== "paid").reduce((s, b) => s + (Number(b.total_amount) - Number(b.received_amount || 0)), 0) || 0;
  const totalReceived = bills?.reduce((s, b) => s + Number(b.received_amount || 0), 0) || 0;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthlyBill = bills?.filter(b => b.month?.startsWith(currentMonth) || b.created_at?.startsWith(currentMonth)).reduce((s, b) => s + Number(b.total_amount), 0) || 0;
  const totalPaid = payments?.filter(p => p.status === "accepted" || p.verified).reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalExpense = expenses?.reduce((s, e) => s + Number(e.amount), 0) || 0;

  const occupancyData = [
    { name: t("dashboard.occupied"), value: occupiedRooms || 0 },
    { name: t("dashboard.vacant"), value: vacantRooms || 0 },
  ];

  const revenueData = (() => {
    if (!payments?.length) return [];
    const byMonth: Record<string, number> = {};
    payments.forEach(p => {
      const month = p.payment_date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + Number(p.amount);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month: month.substring(5), amount }));
  })();

  const propertyStats = [
    { label: t("dashboard.total_properties"), value: String(properties?.length || 0), icon: Building2, iconBg: "bg-pink-500", bg: "from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/20" },
    { label: t("dashboard.total_rooms"), value: String(totalRooms), icon: DoorOpen, iconBg: "bg-purple-500", bg: "from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20" },
    { label: t("dashboard.occupied"), value: String(occupiedRooms), icon: TrendingUp, iconBg: "bg-emerald-500", bg: "from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20" },
    { label: t("dashboard.vacant"), value: String(vacantRooms), icon: AlertCircle, iconBg: "bg-amber-500", bg: "from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20" },
  ];

  const totalGarages = garages?.length || 0;
  const activeGarages = garages?.filter(g => g.status === "occupied").length || 0;
  const freeGarages = garages?.filter(g => g.status === "vacant").length || 0;

  const financialStats = [
    { label: t("dashboard.total_tenants"), value: String(activeTenants), icon: Users, iconBg: "bg-violet-500", bg: "from-violet-50 to-violet-100 dark:from-violet-950/40 dark:to-violet-900/20" },
    { label: language === "bn" ? "মোট বকেয়া" : "Total Due", value: `৳${totalDue.toLocaleString()}`, icon: AlertCircle, iconBg: "bg-red-500", bg: "from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20" },
    { label: language === "bn" ? "মাসিক বিল" : "Monthly Bill", value: `৳${monthlyBill.toLocaleString()}`, icon: CreditCard, iconBg: "bg-blue-500", bg: "from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20" },
    { label: language === "bn" ? "মোট আদায়" : "Total Received", value: `৳${totalReceived.toLocaleString()}`, icon: CheckCircle2, iconBg: "bg-emerald-500", bg: "from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20" },
    { label: language === "bn" ? "মোট খরচ" : "Total Expense", value: `৳${totalExpense.toLocaleString()}`, icon: TrendingUp, iconBg: "bg-orange-500", bg: "from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/20" },
  ];

  const garageStats = [
    { label: language === "bn" ? "মোট গ্যারেজ" : "Total Garages", value: String(totalGarages), icon: Car, iconBg: "bg-pink-500", bg: "from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-pink-900/20" },
    { label: language === "bn" ? "ব্যবহৃত" : "Active", value: String(activeGarages), icon: Car, iconBg: "bg-emerald-500", bg: "from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20" },
    { label: language === "bn" ? "খালি" : "Free", value: String(freeGarages), icon: Car, iconBg: "bg-amber-500", bg: "from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {propertyStats.map((stat) => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.bg} border-0 shadow-sm`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {financialStats.map((stat) => (
          <Card key={stat.label} className={`bg-gradient-to-br ${stat.bg} border-0 shadow-sm`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalGarages > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {garageStats.map((stat) => (
            <Card key={stat.label} className={`bg-gradient-to-br ${stat.bg} border-0 shadow-sm`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.revenue_chart")}</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                {t("dashboard.no_data") || "No payment data yet"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.occupancy")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {totalRooms > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {occupancyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                {t("dashboard.no_rooms") || "No rooms added yet"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { role } = useAuth();

  if (role === "tenant") {
    return <TenantDashboard />;
  }

  // employee sees landlord dashboard (read-only based on permissions)
  // landlord_staff sees landlord dashboard (scoped by their landlord's data)
  return <LandlordDashboard />;
};

export default Dashboard;
