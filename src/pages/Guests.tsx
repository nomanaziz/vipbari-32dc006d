import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CheckCircle2, XCircle, Clock, ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const visitorTypeColors: Record<string, string> = {
  guest: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  delivery: "bg-blue-500/10 text-blue-600 border-blue-200",
  worker: "bg-amber-500/10 text-amber-600 border-amber-200",
  family: "bg-purple-500/10 text-purple-600 border-purple-200",
  other: "bg-muted text-muted-foreground",
};

const visitorTypeLabels: Record<string, { en: string; bn: string }> = {
  guest: { en: "Guest", bn: "অতিথি" },
  delivery: { en: "Delivery", bn: "ডেলিভারি" },
  worker: { en: "Worker", bn: "কর্মী" },
  family: { en: "Family", bn: "পরিবার" },
  other: { en: "Other", bn: "অন্যান্য" },
};

const Guests = () => {
  const { language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const { data: guests, isLoading } = useQuery({
    queryKey: ["landlord-guests", user?.id],
    queryFn: async () => {
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, full_name, room_id")
        .eq("owner_id", effectiveOwnerId!);
      if (!tenants?.length) return [];
      const tenantIds = tenants.map(t => t.id);
      const tenantMap = Object.fromEntries(tenants.map(t => [t.id, t.full_name]));
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .in("tenant_id", tenantIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(g => ({ ...g, tenantName: tenantMap[g.tenant_id] || "—" }));
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "approved") {
        updates.verified_at = new Date().toISOString();
        updates.verified_by = user!.id;
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 1);
        updates.expires_at = newExpiry.toISOString();
      }
      const { error } = await supabase.from("guests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-guests"] });
      toast.success(L("Status updated", "স্ট্যাটাস আপডেট হয়েছে"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const now = new Date();
  const filtered = (guests || []).filter(g => {
    const isExpired = g.expires_at && new Date(g.expires_at) < now;
    const isActive = g.status === "approved" && !isExpired;
    if (filter === "active") return isActive;
    if (filter === "inactive") return isExpired || g.status === "rejected";
    if (filter === "pending") return g.status === "pending" && !isExpired;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{L("Guest Management", "অতিথি ব্যবস্থাপনা")}</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L("All", "সকল")}</SelectItem>
            <SelectItem value="active">{L("Active", "সক্রিয়")}</SelectItem>
            <SelectItem value="pending">{L("Pending", "অপেক্ষমান")}</SelectItem>
            <SelectItem value="inactive">{L("Expired / Rejected", "মেয়াদোত্তীর্ণ / প্রত্যাখ্যাত")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</p>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p>{L("No guests found", "কোনো অতিথি পাওয়া যায়নি")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g: any) => {
            const isExpired = g.expires_at && new Date(g.expires_at) < now;
            return (
              <Card key={g.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{g.guest_name}</p>
                      <p className="text-xs text-muted-foreground">{L("Tenant", "ভাড়াটিয়া")}: {g.tenantName}</p>
                    </div>
                    <Badge className={`text-xs ${visitorTypeColors[g.visitor_type || "guest"]}`}>
                      {visitorTypeLabels[g.visitor_type || "guest"]?.[language === "bn" ? "bn" : "en"]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {g.status === "approved" && !isExpired && (
                      <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />{L("Active", "সক্রিয়")}
                      </Badge>
                    )}
                    {g.status === "pending" && !isExpired && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />{L("Pending", "অপেক্ষমান")}
                      </Badge>
                    )}
                    {g.status === "rejected" && (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="h-3 w-3 mr-1" />{L("Rejected", "প্রত্যাখ্যাত")}
                      </Badge>
                    )}
                    {isExpired && (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldAlert className="h-3 w-3 mr-1" />{L("Expired", "মেয়াদোত্তীর্ণ")}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {g.phone ? `${g.phone} · ` : ""}{new Date(g.visit_date).toLocaleDateString()} · {g.duration_days} {L("day(s)", "দিন")}
                  </p>
                  {g.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      {L("Expires", "মেয়াদ")}: {new Date(g.expires_at).toLocaleString()}
                    </p>
                  )}
                  {g.notes && <p className="text-xs text-muted-foreground">{g.notes}</p>}

                  {g.status === "pending" && !isExpired && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="gap-1" onClick={() => updateStatus.mutate({ id: g.id, status: "approved" })}>
                        <CheckCircle2 className="h-3.5 w-3.5" />{L("Approve", "অনুমোদন")}
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus.mutate({ id: g.id, status: "rejected" })}>
                        <XCircle className="h-3.5 w-3.5" />{L("Reject", "প্রত্যাখ্যান")}
                      </Button>
                    </div>
                  )}
                  {g.status === "approved" && !isExpired && (
                    <div className="pt-1">
                      <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus.mutate({ id: g.id, status: "rejected" })}>
                        <ShieldAlert className="h-3.5 w-3.5" />{L("Deactivate", "নিষ্ক্রিয় করুন")}
                      </Button>
                    </div>
                  )}
                  {(g.status === "rejected" || isExpired) && (
                    <div className="pt-1">
                      <Button size="sm" variant="outline" className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => updateStatus.mutate({ id: g.id, status: "approved" })}>
                        <RefreshCw className="h-3.5 w-3.5" />{L("Reactivate", "পুনরায় সক্রিয় করুন")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const GuestsPage = () => (
  <PermissionGuard permission="view_guests">
    <Guests />
  </PermissionGuard>
);

export default GuestsPage;
