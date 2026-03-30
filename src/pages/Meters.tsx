import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Gauge, Pencil, Trash2, Search, Zap, Droplets, Flame } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  meter_number: "",
  meter_type: "electricity",
  billing_type: "postpaid",
  room_id: "",
  tenant_id: "",
  last_reading: "0",
  status: "active",
};

const Meters = () => {
  const { t } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterBilling, setFilterBilling] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: meters, isLoading } = useQuery({
    queryKey: ["meters", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meters")
        .select("*, rooms(room_number, properties(name)), tenants(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-meters", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("id, room_number, properties(name)");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tenants } = useQuery({
    queryKey: ["tenants-for-meters", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, full_name").eq("status", "active");
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const { error } = await supabase.from("meters").insert({
        owner_id: effectiveOwnerId!,
        meter_number: values.meter_number,
        meter_type: values.meter_type,
        billing_type: values.billing_type,
        room_id: values.room_id || null,
        tenant_id: values.tenant_id || null,
        last_reading: values.billing_type === "postpaid" ? Number(values.last_reading) : 0,
        status: values.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      setOpen(false);
      setForm(emptyForm);
      toast.success(t("meter.added"));
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof emptyForm & { id: string }) => {
      const { error } = await supabase.from("meters").update({
        meter_number: values.meter_number,
        meter_type: values.meter_type,
        billing_type: values.billing_type,
        room_id: values.room_id || null,
        tenant_id: values.tenant_id || null,
        last_reading: values.billing_type === "postpaid" ? Number(values.last_reading) : 0,
        status: values.status,
      }).eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast.success(t("meter.updated"));
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      toast.success(t("meter.deleted"));
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      meter_number: m.meter_number,
      meter_type: m.meter_type,
      billing_type: m.billing_type,
      room_id: m.room_id || "",
      tenant_id: m.tenant_id || "",
      last_reading: String(m.last_reading || 0),
      status: m.status,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meter_number.trim()) { toast.error(t("meter.number") + " required"); return; }
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id });
    } else {
      createMutation.mutate(form);
    }
  };

  const meterTypeIcon = (type: string) => {
    switch (type) {
      case "electricity": return <Zap className="h-4 w-4" />;
      case "water": return <Droplets className="h-4 w-4" />;
      case "gas": return <Flame className="h-4 w-4" />;
      default: return <Gauge className="h-4 w-4" />;
    }
  };

  const meterTypeLabel = (type: string) => {
    switch (type) {
      case "electricity": return t("meter.electricity");
      case "water": return t("meter.water");
      case "gas": return t("meter.gas");
      default: return type;
    }
  };

  const filtered = meters?.filter((m: any) => {
    if (search && !m.meter_number.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && m.meter_type !== filterType) return false;
    if (filterBilling !== "all" && m.billing_type !== filterBilling) return false;
    return true;
  }) || [];

  const totalMeters = meters?.length || 0;
  const prepaidCount = meters?.filter((m: any) => m.billing_type === "prepaid").length || 0;
  const postpaidCount = meters?.filter((m: any) => m.billing_type === "postpaid").length || 0;
  const unassignedCount = meters?.filter((m: any) => !m.room_id && !m.tenant_id).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("nav.meters")}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { setEditing(null); setForm(emptyForm); }}>
              <Plus className="h-4 w-4" />
              {t("meter.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? t("meter.edit") : t("meter.add")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("meter.number")} *</Label>
                <Input value={form.meter_number} onChange={e => setForm(f => ({ ...f, meter_number: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("meter.type")}</Label>
                  <Select value={form.meter_type} onValueChange={v => setForm(f => ({ ...f, meter_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electricity">{t("meter.electricity")}</SelectItem>
                      <SelectItem value="water">{t("meter.water")}</SelectItem>
                      <SelectItem value="gas">{t("meter.gas")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("meter.billing_type")}</Label>
                  <Select value={form.billing_type} onValueChange={v => setForm(f => ({ ...f, billing_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">{t("meter.prepaid")}</SelectItem>
                      <SelectItem value="postpaid">{t("meter.postpaid")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("meter.assign_room")}</Label>
                  <Select value={form.room_id || "none"} onValueChange={v => setForm(f => ({ ...f, room_id: v === "none" ? "" : v, tenant_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder={t("meter.unassigned")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("meter.unassigned")}</SelectItem>
                      {rooms?.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.room_number} ({r.properties?.name})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("meter.assign_tenant")}</Label>
                  <Select value={form.tenant_id || "none"} onValueChange={v => setForm(f => ({ ...f, tenant_id: v === "none" ? "" : v, room_id: "" }))}>
                    <SelectTrigger><SelectValue placeholder={t("meter.unassigned")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("meter.unassigned")}</SelectItem>
                      {tenants?.map((te: any) => (
                        <SelectItem key={te.id} value={te.id}>{te.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.billing_type === "postpaid" && (
                <div className="space-y-2">
                  <Label>{t("meter.last_reading")}</Label>
                  <Input type="number" value={form.last_reading} onChange={e => setForm(f => ({ ...f, last_reading: e.target.value }))} />
                </div>
              )}
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("tenant.active")}</SelectItem>
                    <SelectItem value="inactive">{t("tenant.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditing(null); setForm(emptyForm); }}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <Gauge className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{totalMeters}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("meter.total")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{prepaidCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("meter.prepaid")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{postpaidCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("meter.postpaid")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{unassignedCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{t("meter.unassigned")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("meter.all_types")}</SelectItem>
            <SelectItem value="electricity">{t("meter.electricity")}</SelectItem>
            <SelectItem value="water">{t("meter.water")}</SelectItem>
            <SelectItem value="gas">{t("meter.gas")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBilling} onValueChange={setFilterBilling}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("meter.all_billing")}</SelectItem>
            <SelectItem value="prepaid">{t("meter.prepaid")}</SelectItem>
            <SelectItem value="postpaid">{t("meter.postpaid")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6 h-28 animate-pulse bg-muted" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("meter.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((m: any) => {
            const assignedTo = m.rooms
              ? `${m.rooms.room_number} (${m.rooms.properties?.name || ""})`
              : m.tenants
              ? m.tenants.full_name
              : t("meter.unassigned");
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {meterTypeIcon(m.meter_type)}
                        <span className="font-semibold text-lg">{m.meter_number}</span>
                        <Badge variant="outline">{meterTypeLabel(m.meter_type)}</Badge>
                        <Badge variant={m.billing_type === "prepaid" ? "default" : "secondary"}>
                          {m.billing_type === "prepaid" ? t("meter.prepaid") : t("meter.postpaid")}
                        </Badge>
                        {m.status === "inactive" && (
                          <Badge variant="destructive">{t("tenant.inactive")}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("meter.assigned_to")}: {assignedTo}
                      </p>
                      {m.billing_type === "postpaid" && (
                        <p className="text-sm">
                          {t("meter.last_reading")}: <span className="font-medium">{m.last_reading || 0}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

const MetersPage = () => (
  <PermissionGuard permission="view_meters">
    <Meters />
  </PermissionGuard>
);

export default MetersPage;
