import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Building2, DoorOpen, Users, CreditCard, TrendingUp, Clock, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { profile, role } = useAuth();
  const isAdmin = role === "admin";
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [props, rooms, tenants, bills, payments, profiles, roles] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("rooms").select("id, status", { count: "exact" }),
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.from("bills").select("id, total_amount, status", { count: "exact" }),
        supabase.from("payments").select("id, amount, verified", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
      ]);
      const totalRevenue = payments.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingVerification = payments.data?.filter((p: any) => !p.verified).length || 0;
      const roleCounts = { landlord: 0, tenant: 0, staff: 0, admin: 0 };
      roles.data?.forEach((r: any) => {
        if (r.role in roleCounts) roleCounts[r.role as keyof typeof roleCounts]++;
      });
      return {
        properties: props.count || 0,
        rooms: rooms.count || 0,
        tenants: tenants.count || 0,
        bills: bills.count || 0,
        totalRevenue,
        pendingVerification,
        users: profiles.count || 0,
        roleCounts,
      };
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*, tenants(full_name)").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const statCards = [
    {
      label: t("admin.total_users"),
      value: stats?.users || 0,
      icon: Users,
      trend: "+12%",
      up: true,
      bg: "from-pink-50 to-pink-100",
      iconBg: "bg-pink-500",
      trendColor: "text-purple-600",
    },
    {
      label: t("admin.total_properties"),
      value: stats?.properties || 0,
      icon: Building2,
      trend: "+8%",
      up: true,
      bg: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
      trendColor: "text-purple-600",
    },
    {
      label: t("admin.total_rooms"),
      value: stats?.rooms || 0,
      icon: DoorOpen,
      trend: "+5%",
      up: true,
      bg: "from-fuchsia-50 to-fuchsia-100",
      iconBg: "bg-fuchsia-500",
      trendColor: "text-purple-600",
    },
    {
      label: t("admin.total_revenue"),
      value: `৳${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      trend: "+18%",
      up: true,
      bg: "from-violet-50 to-violet-100",
      iconBg: "bg-violet-500",
      trendColor: "text-purple-600",
    },
    {
      label: t("admin.total_tenants"),
      value: stats?.tenants || 0,
      icon: Users,
      trend: "+6%",
      up: true,
      bg: "from-rose-50 to-rose-100",
      iconBg: "bg-rose-500",
      trendColor: "text-purple-600",
    },
    {
      label: t("admin.pending_verification"),
      value: stats?.pendingVerification || 0,
      icon: Clock,
      trend: "",
      up: false,
      bg: "from-pink-50/50 to-purple-50",
      iconBg: "bg-pink-400",
      trendColor: "text-pink-600",
    },
  ];

  const roleData = [
    { label: "Landlords", count: stats?.roleCounts?.landlord || 0, color: "bg-purple-500" },
    { label: "Tenants", count: stats?.roleCounts?.tenant || 0, color: "bg-pink-500" },
    { label: "Staff", count: stats?.roleCounts?.staff || 0, color: "bg-fuchsia-500" },
    { label: "Admins", count: stats?.roleCounts?.admin || 0, color: "bg-violet-500" },
  ];

  const totalRoleUsers = Object.values(stats?.roleCounts || {}).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAdmin ? t("admin.admin_dashboard") : t("admin.employee_dashboard")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("admin.welcome")}, {profile?.full_name || "Admin"} •{" "}
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className={`bg-gradient-to-br ${card.bg} border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                {card.trend && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${card.trendColor}`}>
                    {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {card.trend}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Breakdown */}
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t("admin.role_breakdown")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
            {roleData.map((r) => (
              <div key={r.label} className={`${r.color} transition-all`} style={{ width: `${(r.count / totalRoleUsers) * 100}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {roleData.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-bold">{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">{t("admin.recent_signups")}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => navigate("/admin/users")}>
              {t("common.view_all")} <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-purple-100 text-purple-600 font-semibold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{user.phone || user.email || "—"}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("common.no_data")}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">{t("admin.recent_payments")}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => navigate("/admin/payments")}>
              {t("common.view_all")} <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentPayments?.map((payment: any) => (
              <div key={payment.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-pink-100 text-pink-600">
                    <CreditCard className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{payment.tenants?.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">৳{Number(payment.amount).toLocaleString()}</p>
                </div>
                <Badge variant={payment.verified ? "default" : "secondary"} className={`text-[10px] px-2 py-0.5 ${
                  payment.verified
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                }`}>
                  {payment.verified ? t("admin.verified") : t("admin.pending")}
                </Badge>
              </div>
            ))}
            {!recentPayments?.length && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("common.no_data")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
