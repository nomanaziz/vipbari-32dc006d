import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, KeyRound, ShieldCheck, ShieldOff, CheckCircle, XCircle, Copy, MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

const ROLE_TABS = [
  { value: "all", label: "All" },
  { value: "landlord", label: "Landlord" },
  { value: "tenant", label: "Tenant" },
  { value: "staff", label: "Admin & Staff" },
];

const AdminUsers = () => {
  const { t } = useLanguage();
  const { role: currentUserRole, loading: authLoading } = useAuth();
  const isAdmin = currentUserRole === "admin";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get("role") || "all";
  const setRoleFilter = (val: string) => {
    if (val === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ role: val });
    }
  };
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [tempPasswordDialog, setTempPasswordDialog] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", role: "landlord", preset_id: "" });

  const { data: presets } = useQuery({
    queryKey: ["permission-presets", "admin"],
    queryFn: async () => {
      const { data } = await supabase.from("permission_presets").select("*").eq("scope", "admin");
      return data || [];
    },
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }, { data: assignments }, { data: properties }, { data: rooms }, { data: tenants }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
        supabase.from("staff_assignments").select("*, permission_presets(name)").eq("scope", "admin") as any,
        supabase.from("properties").select("id, owner_id"),
        supabase.from("rooms").select("id, property_id, status"),
        supabase.from("tenants").select("user_id, owner_id, room_id"),
      ]);
      const rolePriority = ["admin", "employee", "landlord", "landlord_staff", "staff", "tenant"];
      const propsByOwner = new Map<string, string[]>();
      (properties || []).forEach((p: any) => {
        const list = propsByOwner.get(p.owner_id) || [];
        list.push(p.id);
        propsByOwner.set(p.owner_id, list);
      });
      return (profiles || []).map((p: any) => {
        const userRoles = roles?.filter((r: any) => r.user_id === p.user_id) || [];
        const roleValues = userRoles.map((r: any) => r.role as string);
        const highestRole = rolePriority.find((r) => roleValues.includes(r)) || roleValues[0] || "unknown";
        const matchingRoleEntry = userRoles.find((r: any) => r.role === highestRole);
        const assignment = (assignments as any[])?.find((a: any) => a.user_id === p.user_id);
        let propertyCount = 0, totalRooms = 0, vacantRooms = 0;
        if (highestRole === "landlord") {
          const propIds = propsByOwner.get(p.user_id) || [];
          propertyCount = propIds.length;
          const ownerRooms = (rooms || []).filter((r: any) => propIds.includes(r.property_id));
          totalRooms = ownerRooms.length;
          vacantRooms = ownerRooms.filter((r: any) => r.status === "vacant").length;
        }
        let landlordName = "", landlordPhone = "";
        if (highestRole === "tenant") {
          const tenantRec = (tenants || []).find((t: any) => t.user_id === p.user_id);
          if (tenantRec) {
            const landlordProfile = (profiles || []).find((lp: any) => lp.user_id === tenantRec.owner_id);
            if (landlordProfile) {
              landlordName = landlordProfile.full_name || "";
              landlordPhone = landlordProfile.phone || "";
            }
          }
        }
        return { ...p, role: highestRole, role_id: matchingRoleEntry?.id, assignment, propertyCount, totalRooms, vacantRooms, landlordName, landlordPhone };
      });
    },
  });

  // Fetch auth users for email confirmation status
  const { data: authUsers } = useQuery({
    queryKey: ["admin-auth-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "list_auth_users" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.users as { id: string; email_confirmed_at: string | null }[];
    },
  });

  const authUserMap = useMemo(() => {
    const map = new Map<string, string | null>();
    authUsers?.forEach((u) => map.set(u.id, u.email_confirmed_at));
    return map;
  }, [authUsers]);

  const filteredUsers = useMemo(() => {
    return users?.filter((u: any) => {
      if (u.role === "landlord_staff") return false;
      const q = search.toLowerCase();
      const matchesSearch = !q || u.full_name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      let matchesRole = true;
      if (roleFilter === "landlord") matchesRole = u.role === "landlord";
      else if (roleFilter === "tenant") matchesRole = u.role === "tenant";
      else if (roleFilter === "staff") matchesRole = u.role === "admin" || u.role === "employee";
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Column visibility
  const showLandlordCols = roleFilter === "all" || roleFilter === "landlord";
  const showTenantCols = roleFilter === "all" || roleFilter === "tenant";
  const showStaffCols = roleFilter === "staff";
  const showProperties = roleFilter === "landlord";
  const showRooms = roleFilter === "landlord";
  const showVacant = roleFilter === "landlord";
  const showLandlord = roleFilter === "tenant";
  const showLandlordPhone = roleFilter === "tenant";
  const showPreset = roleFilter === "staff";

  const colCount = 9 + (showProperties ? 1 : 0) + (showRooms ? 1 : 0) + (showVacant ? 1 : 0) + (showLandlord ? 1 : 0) + (showLandlordPhone ? 1 : 0) + (showPreset ? 1 : 0);

  const updateRole = useMutation({
    mutationFn: async ({ roleId, newRole }: { roleId: string; newRole: string }) => {
      const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("admin.role_updated")); },
    onError: () => toast.error(t("admin.role_update_error")),
  });

  const updatePreset = useMutation({
    mutationFn: async ({ assignmentId, presetId }: { assignmentId: string; presetId: string }) => {
      const { error } = await supabase.from("staff_assignments").update({ preset_id: presetId }).eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("admin.preset_updated")); },
    onError: () => toast.error(t("admin.preset_update_error")),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      if (form.role === "employee") {
        const { data, error } = await supabase.functions.invoke("invite-staff", {
          body: { email: form.email, password: form.password, full_name: form.full_name, phone: form.phone, role: "employee", preset_id: form.preset_id },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      } else {
        const { data, error } = await supabase.functions.invoke("admin-create-user", {
          body: { email: form.email, password: form.password, full_name: form.full_name, phone: form.phone, role: form.role },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.user_created"));
      setCreateOpen(false);
      setForm({ full_name: "", email: "", phone: "", password: "", role: "landlord", preset_id: "" });
    },
    onError: (e: any) => toast.error(e.message || t("admin.user_create_error")),
  });

  const updateUser = useMutation({
    mutationFn: async (data: { id: string; full_name: string; phone: string; email: string }) => {
      const { error } = await supabase.from("profiles").update({ full_name: data.full_name, phone: data.phone, email: data.email }).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("admin.user_updated")); setEditUser(null); },
    onError: () => toast.error(t("admin.user_update_error")),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success(t("admin.user_deleted")); },
    onError: (e: any) => toast.error(e.message || t("admin.user_delete_error")),
  });

  const adminAction = useMutation({
    mutationFn: async (body: any) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (variables.action === "reset_password") toast.success(t("admin.send_reset"));
      else if (variables.action === "set_temp_password") toast.success(t("admin.set_temp_password"));
      else if (variables.action === "toggle_active") toast.success(data.is_active ? t("admin.enable_user") : t("admin.disable_user"));
      else if (variables.action === "toggle_verified") toast.success(data.is_verified ? t("admin.mark_verified") : t("admin.mark_unverified"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pwd = "";
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  };

  const handleSetTempPassword = (user: any) => {
    setGeneratedPassword(generateTempPassword());
    setTempPasswordDialog(user);
  };

  const confirmTempPassword = () => {
    if (tempPasswordDialog) {
      adminAction.mutate({ action: "set_temp_password", userId: tempPasswordDialog.user_id, tempPassword: generatedPassword });
      setTempPasswordDialog(null);
    }
  };

  const roleCounts = ROLE_TABS.map((tab) => ({
    ...tab,
    count: tab.value === "all"
      ? (users?.filter((u: any) => u.role !== "landlord_staff").length || 0)
      : tab.value === "staff"
        ? (users?.filter((u: any) => u.role === "admin" || u.role === "employee").length || 0)
        : (users?.filter((u: any) => u.role === tab.value).length || 0),
  }));

  if (authLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.users")}</h1>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />{t("admin.create_user")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("admin.create_user")}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("auth.name")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>{t("auth.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>{t("auth.phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>{t("auth.pin")}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div>
                  <Label>{t("admin.role")}</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, preset_id: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landlord">{t("auth.landlord")}</SelectItem>
                      <SelectItem value="tenant">{t("auth.tenant")}</SelectItem>
                      <SelectItem value="employee">{t("auth.employee")}</SelectItem>
                      <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.role === "employee" && (
                  <div>
                    <Label>{t("staff.role_preset")}</Label>
                    <Select value={form.preset_id} onValueChange={(v) => setForm({ ...form, preset_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select preset" /></SelectTrigger>
                      <SelectContent>
                        {presets?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button className="w-full" onClick={() => createUser.mutate()} disabled={createUser.isPending}>
                  {createUser.isPending ? t("common.loading") : t("admin.create_user")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role Filter Tabs */}
      <Tabs value={roleFilter === "" ? "all" : roleFilter} onValueChange={setRoleFilter} className="mb-4">
        <TabsList className="flex-wrap h-auto">
          {roleCounts.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label} <Badge variant="secondary" className="ml-1 text-xs">{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-10" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.edit")}</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div><Label>{t("auth.name")}</Label><Input value={editUser.full_name} onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })} /></div>
              <div><Label>{t("auth.email")}</Label><Input value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} /></div>
              <div><Label>{t("auth.phone")}</Label><Input value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} /></div>
              <Button className="w-full" onClick={() => updateUser.mutate(editUser)} disabled={updateUser.isPending}>
                {updateUser.isPending ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Temp Password Dialog */}
      <Dialog open={!!tempPasswordDialog} onOpenChange={(open) => !open && setTempPasswordDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.temp_password_title")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("admin.temp_password_desc")} — <strong>{tempPasswordDialog?.full_name}</strong>
            </p>
            <div className="flex gap-2">
              <Input value={generatedPassword} onChange={(e) => setGeneratedPassword(e.target.value)} />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(generatedPassword); toast.success(t("admin.copied")); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button className="w-full" onClick={confirmTempPassword} disabled={adminAction.isPending}>
              {adminAction.isPending ? t("common.loading") : t("admin.set_password")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("auth.name")}</TableHead>
              <TableHead>{t("auth.email")}</TableHead>
              <TableHead>{t("auth.phone")}</TableHead>
              <TableHead>{t("admin.role")}</TableHead>
              {showProperties && <TableHead>Properties</TableHead>}
              {showRooms && <TableHead>Rooms</TableHead>}
              {showVacant && <TableHead>Vacant</TableHead>}
              {showLandlord && <TableHead>Landlord</TableHead>}
              {showLandlordPhone && <TableHead>Landlord Phone</TableHead>}
              {showPreset && <TableHead>Preset</TableHead>}
              <TableHead>{t("admin.status")}</TableHead>
              <TableHead>{t("admin.email_status")}</TableHead>
              <TableHead>{t("admin.verified")}</TableHead>
              <TableHead>{t("admin.joined")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={colCount} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : !filteredUsers?.length ? (
              <TableRow><TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground">{t("admin.no_users")}</TableCell></TableRow>
            ) : filteredUsers?.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                <TableCell>{user.email || "—"}</TableCell>
                <TableCell>{user.phone || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <Select value={user.role} onValueChange={(val) => user.role_id && updateRole.mutate({ roleId: user.role_id, newRole: val })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landlord">{t("auth.landlord")}</SelectItem>
                          <SelectItem value="tenant">{t("auth.tenant")}</SelectItem>
                          <SelectItem value="employee">{t("auth.employee")}</SelectItem>
                          <SelectItem value="landlord_staff">{t("auth.landlord_staff")}</SelectItem>
                          <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{user.role}</Badge>
                    )}
                  </div>
                </TableCell>
                {showProperties && <TableCell>{user.role === "landlord" ? user.propertyCount : "—"}</TableCell>}
                {showRooms && <TableCell>{user.role === "landlord" ? user.totalRooms : "—"}</TableCell>}
                {showVacant && <TableCell>{user.role === "landlord" ? user.vacantRooms : "—"}</TableCell>}
                {showLandlord && <TableCell>{user.role === "tenant" ? (user.landlordName || "—") : "—"}</TableCell>}
                {showLandlordPhone && <TableCell>{user.role === "tenant" ? (user.landlordPhone || "—") : "—"}</TableCell>}
                {showPreset && (
                  <TableCell>
                    {user.role === "employee" && user.assignment && isAdmin ? (
                      <Select
                        value={user.assignment.preset_id || ""}
                        onValueChange={(val) => updatePreset.mutate({ assignmentId: user.assignment.id, presetId: val })}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder={t("staff.role_preset")} /></SelectTrigger>
                        <SelectContent>
                          {presets?.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : user.assignment?.permission_presets?.name ? (
                      <Badge variant="outline" className="text-xs">{user.assignment.permission_presets.name}</Badge>
                    ) : "—"}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={user.is_active !== false ? "default" : "destructive"}>
                    {user.is_active !== false ? t("admin.active_status") : t("admin.disabled")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(() => {
                    const confirmed = authUserMap.get(user.user_id);
                    return confirmed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">{t("admin.email_confirmed")}</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">{t("admin.email_pending")}</Badge>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  {user.is_verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditUser({ ...user })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => adminAction.mutate({ action: "reset_password", email: user.email })}>
                            <KeyRound className="h-4 w-4 mr-2" />{t("admin.send_reset")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetTempPassword(user)}>
                            <KeyRound className="h-4 w-4 mr-2" />{t("admin.set_temp_password")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => adminAction.mutate({ action: "toggle_active", userId: user.user_id })}>
                            {user.is_active !== false ? (
                              <><ShieldOff className="h-4 w-4 mr-2" />{t("admin.disable_user")}</>
                            ) : (
                              <><ShieldCheck className="h-4 w-4 mr-2" />{t("admin.enable_user")}</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => adminAction.mutate({ action: "toggle_verified", userId: user.user_id })}>
                            {user.is_verified ? (
                              <><XCircle className="h-4 w-4 mr-2" />{t("admin.mark_unverified")}</>
                            ) : (
                              <><CheckCircle className="h-4 w-4 mr-2" />{t("admin.mark_verified")}</>
                            )}
                          </DropdownMenuItem>
                          {!authUserMap.get(user.user_id) && (
                            <DropdownMenuItem onClick={() => {
                              adminAction.mutate({ action: "confirm_email", userId: user.user_id }, {
                                onSuccess: () => {
                                  queryClient.invalidateQueries({ queryKey: ["admin-auth-users"] });
                                  toast.success(t("admin.email_confirmed_success"));
                                },
                              });
                            }}>
                              <MailCheck className="h-4 w-4 mr-2" />{t("admin.confirm_email")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />{t("admin.delete_user")}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("common.delete")}?</AlertDialogTitle>
                                <AlertDialogDescription>{t("admin.delete_user_confirm")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser.mutate(user.user_id)} className="bg-destructive text-destructive-foreground">
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
