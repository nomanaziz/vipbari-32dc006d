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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Users, Pencil, Trash2, Phone, Search, MapPin, CalendarDays, MoreVertical, UserPlus, UserMinus, Link, RotateCcw, Archive, ArrowRightLeft, ShieldBan, Printer } from "lucide-react";
import { toast } from "sonner";

import TenantFormDialog from "@/components/tenants/TenantFormDialog";
import TenantRegistrationPrint from "@/components/tenants/TenantRegistrationPrint";
import TenantCredentialsDialog from "@/components/tenants/TenantCredentialsDialog";
import FamilyMembersDialog from "@/components/tenants/FamilyMembersDialog";
import PendingRequestsSection from "@/components/tenants/PendingRequestsSection";
import TenantStatsCards from "@/components/tenants/TenantStatsCards";
import LinkTenantDialog from "@/components/tenants/LinkTenantDialog";
import TenantReleaseDialog from "@/components/tenants/TenantReleaseDialog";
import RoomShiftDialog from "@/components/tenants/RoomShiftDialog";

const Tenants = () => {
  const { language, t } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [familyDialogTenant, setFamilyDialogTenant] = useState<any>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteTenant, setDeleteTenant] = useState<any>(null);
  const [releaseTenant, setReleaseTenant] = useState<any>(null);
  const [credentials, setCredentials] = useState<{ phone: string; password: string } | null>(null);
  const [shiftTenant, setShiftTenant] = useState<any>(null);

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
      // 1) Directly owned tenants
      const { data: ownedData, error: ownedError } = await supabase
        .from("tenants")
        .select("*, rooms:rooms!tenants_room_id_fkey(room_number, property_id, properties(name))")
        .eq("owner_id", effectiveOwnerId!);
      if (ownedError) throw ownedError;

      // 2) Linked tenants via accepted tolet_requests
      const { data: linkedRequests } = await supabase
        .from("tolet_requests")
        .select("tenant_user_id")
        .eq("landlord_user_id", effectiveOwnerId!)
        .eq("status", "accepted");

      const linkedUserIds = (linkedRequests || []).map((r: any) => r.tenant_user_id).filter(Boolean);
      let linkedTenants: any[] = [];
      if (linkedUserIds.length > 0) {
        const { data: ltData } = await supabase
          .from("tenants")
          .select("*, rooms:rooms!tenants_room_id_fkey(room_number, property_id, properties(name))")
          .in("user_id", linkedUserIds);
        linkedTenants = ltData || [];
      }

      // Merge and deduplicate
      const allTenants = [...(ownedData || [])];
      const existingIds = new Set(allTenants.map((t: any) => t.id));
      for (const lt of linkedTenants) {
        if (!existingIds.has(lt.id)) {
          allTenants.push(lt);
          existingIds.add(lt.id);
        }
      }
      return allTenants;
    },
    enabled: !!effectiveOwnerId,
  });

  // Query approved family member counts per tenant
  const { data: memberCounts } = useQuery({
    queryKey: ["tenant-member-counts", effectiveOwnerId],
    queryFn: async () => {
      const tenantIds = tenants?.map((t: any) => t.id) || [];
      if (tenantIds.length === 0) return {};
      const { data } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .in("tenant_id", tenantIds)
        .eq("status", "approved");
      const counts: Record<string, number> = {};
      (data || []).forEach((m: any) => {
        counts[m.tenant_id] = (counts[m.tenant_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!tenants && tenants.length > 0,
  });

  // Query bill counts per tenant for delete protection
  const { data: tenantBillCounts } = useQuery({
    queryKey: ["tenant-bill-counts", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("tenant_id")
        .eq("owner_id", effectiveOwnerId!);
      const counts: Record<string, number> = {};
      (data || []).forEach((b: any) => {
        counts[b.tenant_id] = (counts[b.tenant_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!effectiveOwnerId,
  });

  // Query bill summary for archived tenants
  const { data: tenantBillSummary } = useQuery({
    queryKey: ["tenant-bill-summary", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("tenant_id, total_amount, received_amount")
        .eq("owner_id", effectiveOwnerId!);
      const summary: Record<string, { totalBilled: number; totalPaid: number }> = {};
      (data || []).forEach((b: any) => {
        if (!summary[b.tenant_id]) summary[b.tenant_id] = { totalBilled: 0, totalPaid: 0 };
        summary[b.tenant_id].totalBilled += Number(b.total_amount || 0);
        summary[b.tenant_id].totalPaid += Number(b.received_amount || 0);
      });
      return summary;
    },
    enabled: !!effectiveOwnerId,
  });

  const hasBills = (tenantId: string) => (tenantBillCounts?.[tenantId] || 0) > 0;

  const deleteMutation = useMutation({
    mutationFn: async (tenant: any) => {
      if (tenant.room_id) {
        const { error: roomError } = await supabase
          .from("rooms")
          .update({ status: "vacant", tenant_id: null })
          .eq("id", tenant.room_id);
        if (roomError) throw roomError;
      }

      if (tenant.user_id) {
        const { error } = await supabase
          .from("tenants")
          .update({
            owner_id: tenant.user_id,
            room_id: null,
            status: "active",
            released_at: null,
            release_reason: null,
            release_notes: null,
          })
          .eq("id", tenant.id);
        if (error) throw error;
        return { mode: "unlinked" as const };
      }

      const { error } = await supabase.from("tenants").delete().eq("id", tenant.id);
      if (error) throw error;
      return { mode: "deleted" as const };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(
        result?.mode === "unlinked"
          ? (language === "bn" ? "ভাড়াটিয়াকে আপনার তালিকা থেকে সরানো হয়েছে" : "Tenant removed from your list")
          : (language === "bn" ? "ভাড়াটিয়া মুছে ফেলা হয়েছে" : "Tenant deleted")
      );
    },
    onError: (e) => toast.error(e.message),
  });

  const releaseMutation = useMutation({
    mutationFn: async ({ tenant, reason, notes }: { tenant: any; reason: string; notes: string }) => {
      const { error } = await supabase.from("tenants").update({
        status: "inactive",
        room_id: null,
        released_at: new Date().toISOString(),
        release_reason: reason,
        release_notes: notes,
      }).eq("id", tenant.id);
      if (error) throw error;
      if (tenant.room_id) {
        await supabase.from("rooms").update({ status: "vacant", tenant_id: null }).eq("id", tenant.room_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setReleaseTenant(null);
      toast.success(language === "bn" ? "ভাড়াটিয়া রিলিজ হয়েছে" : "Tenant released successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (tenant: any) => {
      const { error } = await supabase.from("tenants").update({
        status: "active",
        released_at: null,
        release_reason: "",
        release_notes: "",
      }).eq("id", tenant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(language === "bn" ? "ভাড়াটিয়া পুনরায় সক্রিয় হয়েছে" : "Tenant reactivated");
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (tenant: any) => {
    setEditing(tenant);
    setOpen(true);
  };

  const handleDeleteAttempt = (tenant: any) => {
    if (hasBills(tenant.id)) {
      toast.error(
        language === "bn"
          ? "এই ভাড়াটিয়ার বিল আছে। মুছে ফেলা যাবে না, রিলিজ করুন।"
          : "This tenant has billing history. Cannot delete — use Release instead."
      );
      return;
    }
    setDeleteTenant(tenant);
  };

  // Filtering
  const filtered = tenants?.filter((tenant: any) => {
    const matchesSearch = tenant.full_name.toLowerCase().includes(search.toLowerCase()) || tenant.phone.includes(search);
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = tenant.status === "active";
    else if (statusFilter === "released") matchesStatus = tenant.status === "inactive" && !!tenant.released_at;
    else if (statusFilter === "all") matchesStatus = true;
    const matchesProperty = propertyFilter === "all" || tenant.rooms?.property_id === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  }) || [];

  const totalTenants = tenants?.length || 0;
  const activeTenants = tenants?.filter((t: any) => t.status === "active").length || 0;
  const releasedTenants = tenants?.filter((t: any) => t.status === "inactive" && t.released_at).length || 0;
  const occupiedCount = tenants?.filter((t: any) => t.room_id).length || 0;
  const noRoomCount = activeTenants - occupiedCount;

  const vacantRooms = rooms?.filter((r: any) => r.status === "vacant") || [];
  const availableRooms = editing
    ? [...vacantRooms, ...(rooms?.filter((r: any) => r.id === editing.room_id) || [])]
    : vacantRooms;

  const isReleased = (tenant: any) => tenant.status === "inactive" && !!tenant.released_at;

  const getReleaseReasonLabel = (reason: string) => {
    if (reason === "all_paid") return language === "bn" ? "সব বিল পরিশোধ" : "All bills paid";
    if (reason === "unpaid") return language === "bn" ? "বিল বাকি আছে" : "Bills unpaid";
    if (reason === "other") return language === "bn" ? "অন্যান্য" : "Other";
    return reason;
  };

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("nav.tenants")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {language === "bn" ? "মোট" : "Total"}: {totalTenants} | {language === "bn" ? "সক্রিয়" : "Active"}: {activeTenants} | {language === "bn" ? "আর্কাইভ" : "Archived"}: {releasedTenants}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm" onClick={() => setLinkDialogOpen(true)}>
            <Link className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{language === "bn" ? "ভাড়াটিয়া লিংক" : "Link Tenant"}</span>
            <span className="sm:hidden">Link</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs sm:text-sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
            <span>{language === "bn" ? "ভাড়াটিয়া যোগ করুন" : "Add Tenant"}</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <TenantStatsCards total={totalTenants} occupied={occupiedCount} noRoom={noRoomCount} />

      {/* Pending Requests */}
      <PendingRequestsSection />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={(language === "bn" ? "খুঁজুন" : "Search") + "..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সব ভাড়াটিয়া" : "All Tenants"}</SelectItem>
              <SelectItem value="active">{language === "bn" ? "সক্রিয়" : "Active"}</SelectItem>
              <SelectItem value="released">{language === "bn" ? "আর্কাইভ (রিলিজ)" : "Archived (Released)"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={propertyFilter} onValueChange={setPropertyFilter}>
            <SelectTrigger className="flex-1 sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সব সম্পত্তি" : "All Properties"}</SelectItem>
              {properties?.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            <p>{search || statusFilter !== "active" || propertyFilter !== "all"
              ? (language === "bn" ? "কোনো ভাড়াটিয়া পাওয়া যায়নি" : "No tenants found")
              : (language === "bn" ? "এখনো কোনো ভাড়াটিয়া নেই। প্রথম ভাড়াটিয়া যোগ করুন!" : "No tenants yet. Add your first tenant!")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tenant: any) => {
            const released = isReleased(tenant);
            const summary = tenantBillSummary?.[tenant.id];
            return (
              <Card key={tenant.id} className={`hover:shadow-md transition-shadow ${released ? "opacity-80 border-dashed" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${released ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
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
                            {tenant.user_id ? (language === "bn" ? "নিজে" : "Self") : (language === "bn" ? "বাড়িওয়ালা" : "Landlord")}
                          </Badge>
                          {(memberCounts?.[tenant.id] || 0) > 0 && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Users className="h-3 w-3" />
                              {language === "bn" ? "পরিবার" : "Family"}: {memberCounts?.[tenant.id]}
                            </Badge>
                          )}
                          {released ? (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <Archive className="h-3 w-3" />
                              {language === "bn" ? "রিলিজড" : "Released"}
                            </Badge>
                          ) : (
                            <Badge variant={tenant.status === "active" ? "default" : "destructive"} className="text-xs">
                              {tenant.status === "active" ? (language === "bn" ? "সক্রিয়" : "Active") : (language === "bn" ? "নিষ্ক্রিয়" : "Inactive")}
                            </Badge>
                          )}
                          {released && tenant.release_reason && (
                            <Badge variant="outline" className="text-xs">
                              {getReleaseReasonLabel(tenant.release_reason)}
                            </Badge>
                          )}
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
                              {language === "bn" ? "যোগদান" : "Joined"}: {new Date(tenant.move_in_date).toLocaleDateString()}
                            </span>
                          )}
                          {released && tenant.released_at && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {language === "bn" ? "রিলিজ" : "Released"}: {new Date(tenant.released_at).toLocaleDateString()}
                            </span>
                          )}
                          {tenant.rooms?.properties?.name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {tenant.rooms.properties.name}
                            </span>
                          )}
                        </div>
                        {/* Bill summary for released tenants */}
                        {released && summary && (
                          <div className="flex flex-wrap gap-3 text-xs mt-1">
                            <span className="text-muted-foreground">
                              {language === "bn" ? "মোট বিল" : "Total Billed"}: ৳{summary.totalBilled.toLocaleString()}
                            </span>
                            <span className="text-green-600">
                              {language === "bn" ? "পরিশোধ" : "Paid"}: ৳{summary.totalPaid.toLocaleString()}
                            </span>
                            {summary.totalBilled - summary.totalPaid > 0 && (
                              <span className="text-destructive font-medium">
                                {language === "bn" ? "বকেয়া" : "Due"}: ৳{(summary.totalBilled - summary.totalPaid).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
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
                        {!released && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(tenant)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              {language === "bn" ? "সম্পাদনা" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFamilyDialogTenant(tenant)}>
                              <UserPlus className="h-3.5 w-3.5 mr-2" />
                              {language === "bn" ? "পরিবারের সদস্য" : "Family Members"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-orange-600" onClick={() => setReleaseTenant(tenant)}>
                              <UserMinus className="h-3.5 w-3.5 mr-2" />
                              {language === "bn" ? "রিলিজ করুন" : "Release"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShiftTenant(tenant)}>
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                              {language === "bn" ? "রুম শিফট" : "Room Shift"}
                            </DropdownMenuItem>
                            {tenant.user_id && tenant.user_id !== user?.id && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={async () => {
                                  try {
                                    await supabase.from("user_blocks").insert({
                                      blocker_id: user!.id,
                                      blocked_id: tenant.user_id,
                                      reason: "",
                                    });
                                    toast.success(language === "bn" ? "ব্লক করা হয়েছে" : "User blocked");
                                  } catch (e: any) {
                                    toast.error(e.message);
                                  }
                                }}
                              >
                                <ShieldBan className="h-3.5 w-3.5 mr-2" />
                                {language === "bn" ? "ব্লক করুন" : "Block"}
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {released && (
                          <DropdownMenuItem onClick={() => reactivateMutation.mutate(tenant)}>
                            <RotateCcw className="h-3.5 w-3.5 mr-2" />
                            {language === "bn" ? "পুনরায় সক্রিয় করুন" : "Reactivate"}
                          </DropdownMenuItem>
                        )}
                        {!hasBills(tenant.id) && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteAttempt(tenant)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            {language === "bn" ? "মুছে ফেলুন" : "Delete"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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

      {/* Release Dialog */}
      <TenantReleaseDialog
        open={!!releaseTenant}
        onOpenChange={(v) => { if (!v) setReleaseTenant(null); }}
        tenantName={releaseTenant?.full_name || ""}
        onConfirm={(reason, notes) => {
          if (releaseTenant) releaseMutation.mutate({ tenant: releaseTenant, reason, notes });
        }}
        isPending={releaseMutation.isPending}
      />

      {/* Delete Confirm Dialog (only for tenants with no bills) */}
      <DeleteConfirmDialog
        open={!!deleteTenant}
        onOpenChange={(open) => !open && setDeleteTenant(null)}
        onConfirm={() => { if (deleteTenant) { deleteMutation.mutate(deleteTenant); setDeleteTenant(null); } }}
        isPending={deleteMutation.isPending}
      />

      {/* Room Shift Dialog */}
      <RoomShiftDialog
        open={!!shiftTenant}
        onOpenChange={(v) => { if (!v) setShiftTenant(null); }}
        tenant={shiftTenant}
        availableRooms={vacantRooms}
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
