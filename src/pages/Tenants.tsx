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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Users, Pencil, Trash2, Phone, Search, MapPin, CalendarDays, MoreVertical, UserPlus, UserMinus, X, Link } from "lucide-react";
import { toast } from "sonner";

import TenantFormDialog from "@/components/tenants/TenantFormDialog";
import TenantCredentialsDialog from "@/components/tenants/TenantCredentialsDialog";
import FamilyMembersDialog from "@/components/tenants/FamilyMembersDialog";
import PendingRequestsSection from "@/components/tenants/PendingRequestsSection";
import TenantStatsCards from "@/components/tenants/TenantStatsCards";
import LinkTenantDialog from "@/components/tenants/LinkTenantDialog";

const Tenants = () => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [familyDialogTenant, setFamilyDialogTenant] = useState<any>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<any>(null);
  const [credentials, setCredentials] = useState<{ phone: string; password: string } | null>(null);
  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-assign", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("id, room_number, property_id, status, properties!inner(name, owner_id)").eq("properties.owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: properties } = useQuery({
    queryKey: ["properties-list", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants", effectiveOwnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*, rooms:rooms!tenants_room_id_fkey(room_number, property_id, properties(name))")
        .eq("owner_id", effectiveOwnerId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (tenant: any) => {
      const { error } = await supabase.from("tenants").delete().eq("id", tenant.id);
      if (error) throw error;
      if (tenant.room_id) {
        await supabase.from("rooms").update({ status: "vacant", tenant_id: null }).eq("id", tenant.room_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("tenant.deleted") || "Tenant deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const releaseMutation = useMutation({
    mutationFn: async (tenant: any) => {
      if (!tenant.user_id) throw new Error("Cannot release a tenant without a linked account");
      const { error } = await supabase.from("tenants").update({
        owner_id: tenant.user_id,
        room_id: null,
        status: "inactive",
      }).eq("id", tenant.id);
      if (error) throw error;
      if (tenant.room_id) {
        await supabase.from("rooms").update({ status: "vacant", tenant_id: null }).eq("id", tenant.room_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("tenant.released") || "Tenant released successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (tenant: any) => {
    setEditing(tenant);
    setOpen(true);
  };

  // Filtering
  const filtered = tenants?.filter((tenant: any) => {
    const matchesSearch = tenant.full_name.toLowerCase().includes(search.toLowerCase()) || tenant.phone.includes(search);
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    const matchesProperty = propertyFilter === "all" || tenant.rooms?.property_id === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  }) || [];

  const totalTenants = tenants?.length || 0;
  const occupiedCount = tenants?.filter((t: any) => t.room_id).length || 0;
  const noRoomCount = totalTenants - occupiedCount;

  const vacantRooms = rooms?.filter((r: any) => r.status === "vacant") || [];
  const availableRooms = editing
    ? [...vacantRooms, ...(rooms?.filter((r: any) => r.id === editing.room_id) || [])]
    : vacantRooms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("nav.tenants")}</h1>
          <p className="text-sm text-muted-foreground">{t("tenant.total")}: {totalTenants}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setLinkDialogOpen(true)}>
            <Link className="h-4 w-4" />
            {t("tenant.link_existing") || "Link Tenant"}
          </Button>
          <Button className="gap-2" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" />
            {t("tenant.add")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TenantStatsCards total={totalTenants} occupied={occupiedCount} noRoom={noRoomCount} />

      {/* Pending Requests */}
      <PendingRequestsSection />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search") + "..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("tenant.all_tenants")}</SelectItem>
            <SelectItem value="active">{t("tenant.active")}</SelectItem>
            <SelectItem value="inactive">{t("tenant.inactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("tenant.all_properties")}</SelectItem>
            {properties?.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tenant Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6 h-40 animate-pulse bg-muted" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{search || statusFilter !== "all" || propertyFilter !== "all"
              ? (t("tenant.no_results") || "No tenants found")
              : (t("tenant.empty") || "No tenants yet. Add your first tenant!")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tenant: any) => (
            <Card key={tenant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                      {tenant.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name & Phone */}
                      <div>
                        <h3 className="font-semibold truncate">{tenant.full_name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />{tenant.phone}
                        </p>
                      </div>
                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {tenant.rooms && (
                          <Badge variant="secondary" className="text-xs">
                            {tenant.rooms.room_number}
                          </Badge>
                        )}
                        {tenant.nid && (
                          <Badge variant="outline" className="text-xs">
                            NID: {tenant.nid}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {tenant.user_id ? (t("tenant.self") || "Self") : (t("tenant.by_landlord") || "Landlord")}
                        </Badge>
                        <Badge variant={tenant.status === "active" ? "default" : "destructive"} className="text-xs">
                          {tenant.status === "active" ? t("tenant.active") : t("tenant.inactive")}
                        </Badge>
                        {tenant.billing_type && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {tenant.billing_type === "billing" ? (language === "bn" ? "বিলিং" : "Billing") : tenant.billing_type === "free" ? (language === "bn" ? "ফ্রি" : "Free") : (language === "bn" ? "পার্সোনাল" : "Personal")}
                          </Badge>
                        )}
                      </div>
                      {/* Meta info */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {tenant.move_in_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {t("tenant.joined")}: {new Date(tenant.move_in_date).toLocaleDateString()}
                          </span>
                        )}
                        {tenant.rooms?.properties?.name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tenant.rooms.properties.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(tenant)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFamilyDialogTenant(tenant)}>
                        <UserPlus className="h-3.5 w-3.5 mr-2" />
                        {t("tenant.family_members")}
                      </DropdownMenuItem>
                      {tenant.user_id && tenant.user_id !== user?.id && (
                        <DropdownMenuItem className="text-orange-600" onClick={() => {
                          if (confirm(t("tenant.release_confirm") || "Are you sure you want to release this tenant? They will be unlinked from your account.")) {
                            releaseMutation.mutate(tenant);
                          }
                        }}>
                          <UserMinus className="h-3.5 w-3.5 mr-2" />
                          {t("tenant.release") || "Release"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTenant(tenant)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <TenantFormDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        availableRooms={availableRooms}
        onCredentialsCreated={(creds) => setCredentials(creds)}
      />

      {/* Credentials Share Dialog */}
      <TenantCredentialsDialog
        open={!!credentials}
        onOpenChange={(v) => { if (!v) setCredentials(null); }}
        credentials={credentials}
      />

      {/* Family Members Dialog */}
      <FamilyMembersDialog
        tenant={familyDialogTenant}
        onClose={() => setFamilyDialogTenant(null)}
      />

      {/* Link Existing Tenant Dialog */}
      <LinkTenantDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        availableRooms={vacantRooms}
      />
      <DeleteConfirmDialog
        open={!!deleteTenant}
        onOpenChange={(open) => !open && setDeleteTenant(null)}
        onConfirm={() => { if (deleteTenant) { deleteMutation.mutate(deleteTenant); setDeleteTenant(null); } }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

const TenantsPage = () => (
  <PermissionGuard permission="view_tenants">
    <Tenants />
  </PermissionGuard>
);

export default TenantsPage;
