import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Car, Trash2, Pencil, Warehouse, Home, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GarageFormDialog } from "@/components/garages/GarageFormDialog";

const Garages = () => {
  const { language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const { data: properties } = useQuery({
    queryKey: ["properties-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: garages, isLoading } = useQuery({
    queryKey: ["garages", user?.id, propertyFilter],
    queryFn: async () => {
      let q = supabase
        .from("garages")
        .select("*, properties(name), tenants(full_name), rooms(room_number)")
        .eq("owner_id", effectiveOwnerId!)
        .order("created_at", { ascending: false });
      if (propertyFilter !== "all") q = q.eq("property_id", propertyFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editData) {
        const { error } = await supabase.from("garages").update(data).eq("id", editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("garages").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garages"] });
      setShowForm(false);
      setEditData(null);
      toast.success(editData ? L("Garage updated", "গ্যারেজ আপডেট হয়েছে") : L("Garage added", "গ্যারেজ যোগ হয়েছে"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("garages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garages"] });
      toast.success(L("Garage deleted", "গ্যারেজ মুছে ফেলা হয়েছে"));
    },
  });

  const totalSpaces = garages?.length || 0;
  const occupied = garages?.filter((g: any) => g.status === "occupied").length || 0;
  const vacant = totalSpaces - occupied;
  const monthlyRevenue = garages?.filter((g: any) => g.status === "occupied").reduce((s: number, g: any) => s + Number(g.rent_amount), 0) || 0;

  const stats = [
    { label: L("Total Spaces", "মোট স্পেস"), value: totalSpaces, gradientBg: "from-blue-50 to-blue-100", iconBg: "bg-blue-500", icon: Warehouse },
    { label: L("Occupied", "ব্যবহৃত"), value: occupied, gradientBg: "from-emerald-50 to-emerald-100", iconBg: "bg-emerald-500", icon: Car },
    { label: L("Vacant", "খালি"), value: vacant, gradientBg: "from-orange-50 to-orange-100", iconBg: "bg-orange-500", icon: Home },
    { label: L("Monthly Revenue", "মাসিক আয়"), value: `৳${monthlyRevenue.toLocaleString()}`, gradientBg: "from-violet-50 to-violet-100", iconBg: "bg-violet-500", icon: Car },
  ];

  const assignmentBadge = (g: any) => {
    const type = g.assignment_type || "individual";
    if (type === "with_room") return { label: L("With Room", "রুম সহ"), variant: "default" as const, icon: Home };
    if (type === "individual") return { label: L("Individual", "একক"), variant: "secondary" as const, icon: User };
    if (type === "external") return { label: L("External", "বাইরের"), variant: "outline" as const, icon: UserPlus };
    return { label: L("Vacant", "খালি"), variant: "secondary" as const, icon: Car };
  };

  const getTenantDisplay = (g: any) => {
    if (g.assignment_type === "external" && g.external_tenant_name) {
      return `${g.external_tenant_name}${g.external_tenant_phone ? ` (${g.external_tenant_phone})` : ""}`;
    }
    return g.tenants?.full_name || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{L("Garages / Parking", "গ্যারেজ / পার্কিং")}</h1>
        <div className="flex items-center gap-2">
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Properties", "সব প্রপার্টি")}</SelectItem>
              {properties?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditData(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {L("Add Garage", "গ্যারেজ যোগ করুন")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.gradientBg} border-0 shadow-sm`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <GarageFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => saveMutation.mutate(data)}
        isPending={saveMutation.isPending}
        editData={editData}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted" /></Card>)}
        </div>
      ) : !garages?.length ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{L("No garages added yet", "এখনো কোনো গ্যারেজ যোগ করা হয়নি")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {garages.map((g: any) => {
            const ab = assignmentBadge(g);
            const AbIcon = ab.icon;
            const tenantName = getTenantDisplay(g);
            return (
              <Card key={g.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">{g.garage_number}</span>
                    </div>
                    <Badge variant={g.status === "occupied" ? "default" : "secondary"}>
                      {g.status === "occupied" ? L("Occupied", "ব্যবহৃত") : L("Vacant", "খালি")}
                    </Badge>
                    {g.is_tolet && g.status === "vacant" && (
                      <Badge className="bg-green-600 text-white text-[10px]">{L("To-Let", "টু-লেট")}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{g.properties?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={ab.variant} className="text-xs gap-1">
                      <AbIcon className="h-3 w-3" />
                      {ab.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {g.garage_type === "car" ? L("Car", "গাড়ি") : g.garage_type === "bike" ? L("Bike", "বাইক") : L("Other", "অন্যান্য")}
                    </span>
                  </div>
                  {g.rooms?.room_number && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {L("Room", "রুম")}: {g.rooms.room_number}
                    </p>
                  )}
                  <p className="text-sm font-medium mt-1">৳{Number(g.rent_amount).toLocaleString()}/{L("month", "মাস")}</p>
                  {tenantName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {L("Tenant", "ভাড়াটিয়া")}: {tenantName}
                    </p>
                  )}
                  <div className="flex justify-end gap-1 mt-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditData(g); setShowForm(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(g.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

const GaragesPage = () => (
  <PermissionGuard permission="view_garages">
    <Garages />
  </PermissionGuard>
);

export default GaragesPage;
