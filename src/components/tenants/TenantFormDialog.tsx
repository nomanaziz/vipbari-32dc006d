import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { DIVISIONS, DIVISIONS_BN, DISTRICTS, DISTRICTS_BN, THANAS, THANAS_BN, getBnLabel } from "@/data/bangladeshAddress";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: any;
  availableRooms: any[];
  onCredentialsCreated?: (creds: { phone: string; password: string }) => void;
}

const emptyForm = {
  full_name: "", phone: "", secondary_phone: "", nid: "",
  emergency_contact: "", move_in_date: "", room_id: "", status: "active",
  advance_balance: "", billing_type: "billing",
  permanent_division: "", permanent_district: "", permanent_thana: "",
  permanent_village: "", permanent_address: "",
};

const generatePin = () => String(Math.floor(100000 + Math.random() * 900000));

const TenantFormDialog = ({ open, onOpenChange, editing, availableRooms, onCredentialsCreated }: Props) => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");

  const districts = form.permanent_division ? (DISTRICTS[form.permanent_division] || []) : [];
  const thanas = form.permanent_district ? (THANAS[form.permanent_district] || []) : [];

  useEffect(() => {
    if (editing) {
      setForm({
        full_name: editing.full_name || "",
        phone: editing.phone || "",
        secondary_phone: editing.secondary_phone || "",
        nid: editing.nid || "",
        emergency_contact: editing.emergency_contact || "",
        move_in_date: editing.move_in_date || "",
        room_id: editing.room_id || "",
        status: editing.status || "active",
        advance_balance: editing.advance_balance?.toString() || "",
        billing_type: editing.billing_type || "billing",
        permanent_division: editing.permanent_division || "",
        permanent_district: editing.permanent_district || "",
        permanent_thana: editing.permanent_thana || "",
        permanent_village: editing.permanent_village || "",
        permanent_address: editing.permanent_address || "",
      });
      setCreateAccount(false);
      setPassword("");
    } else {
      setForm(emptyForm);
      setCreateAccount(false);
      setPassword("");
    }
  }, [editing, open]);

  const buildPayload = (values: typeof emptyForm) => ({
    full_name: values.full_name,
    phone: values.phone,
    secondary_phone: values.secondary_phone || "",
    nid: values.nid || null,
    emergency_contact: values.emergency_contact || null,
    move_in_date: values.move_in_date || null,
    room_id: values.room_id || null,
    status: values.status,
    advance_balance: values.advance_balance ? parseFloat(values.advance_balance) : 0,
    billing_type: values.billing_type || "billing",
    permanent_division: values.permanent_division || "",
    permanent_district: values.permanent_district || "",
    permanent_thana: values.permanent_thana || "",
    permanent_village: values.permanent_village || "",
    permanent_address: values.permanent_address || "",
  });

  // Create tenant WITH account via edge function
  const createWithAccountMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const { data, error } = await supabase.functions.invoke("create-tenant-user", {
        body: {
          ...buildPayload(values),
          password,
          advance_balance: values.advance_balance || "0",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { user_id: string; tenant_id: string; phone: string; password: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onOpenChange(false);
      toast.success(language === "bn" ? "ভাড়াটিয়া ও অ্যাকাউন্ট তৈরি হয়েছে" : "Tenant & account created");
      onCredentialsCreated?.({ phone: data.phone, password: data.password });
    },
    onError: (e) => toast.error(e.message),
  });

  // Create tenant WITHOUT account (direct insert)
  const createMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const { data: newTenant, error } = await supabase.from("tenants").insert({
        ...buildPayload(values),
        owner_id: effectiveOwnerId || user!.id,
      }).select("id").single();
      if (error) throw error;
      if (values.room_id) {
        const { error: roomErr } = await supabase.from("rooms").update({ status: "occupied", is_tolet: false, available_from: null, tenant_id: newTenant.id }).eq("id", values.room_id);
        if (roomErr) throw roomErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onOpenChange(false);
      toast.success(t("tenant.added") || "Tenant added");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof emptyForm & { id: string; old_room_id?: string }) => {
      const { error } = await supabase.from("tenants").update(buildPayload(values)).eq("id", values.id);
      if (error) throw error;
      if (values.old_room_id && values.old_room_id !== values.room_id) {
        const { error: oldRoomErr } = await supabase.from("rooms").update({ status: "vacant", tenant_id: null }).eq("id", values.old_room_id);
        if (oldRoomErr) throw oldRoomErr;
      }
      if (values.room_id) {
        const { error: newRoomErr } = await supabase.from("rooms").update({ status: "occupied", is_tolet: false, available_from: null, tenant_id: values.id }).eq("id", values.room_id);
        if (newRoomErr) throw newRoomErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onOpenChange(false);
      toast.success(t("tenant.updated") || "Tenant updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id, old_room_id: editing.room_id });
    } else if (createAccount) {
      if (!password || password.length < 6) {
        toast.error(language === "bn" ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters");
        return;
      }
      createWithAccountMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || createWithAccountMutation.isPending;
  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("common.edit") : t("tenant.add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("tenant.basic_info")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("tenant.name")} *</Label>
                <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.phone")} *</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.secondary_phone")}</Label>
                <Input value={form.secondary_phone} onChange={e => set("secondary_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.nid")}</Label>
                <Input value={form.nid} onChange={e => set("nid", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.emergency")}</Label>
                <Input value={form.emergency_contact} onChange={e => set("emergency_contact", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Create Account Toggle - only for new tenants */}
          {!editing && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="create-account"
                  checked={createAccount}
                  onCheckedChange={(v) => {
                    setCreateAccount(!!v);
                    if (v && !password) setPassword(generatePin());
                  }}
                />
                <Label htmlFor="create-account" className="cursor-pointer font-medium">
                  {language === "bn" ? "এই ভাড়াটিয়ার জন্য লগইন অ্যাকাউন্ট তৈরি করুন" : "Create login account for this tenant"}
                </Label>
              </div>

              {createAccount && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "ইউজার আইডি (ফোন নম্বর)" : "User ID (Phone)"}</Label>
                    <Input value={form.phone} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "পাসওয়ার্ড" : "Password"} *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required={createAccount}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setPassword(generatePin())}
                        title={language === "bn" ? "নতুন পিন তৈরি করুন" : "Generate PIN"}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Permanent Address */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("tenant.permanent_address_title")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("tenant.division")}</Label>
                <Select value={form.permanent_division || "none"} onValueChange={v => {
                  set("permanent_division", v === "none" ? "" : v);
                  setForm(f => ({ ...f, permanent_division: v === "none" ? "" : v, permanent_district: "", permanent_thana: "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_division")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {DIVISIONS.map(d => (
                      <SelectItem key={d} value={d}>
                        {getBnLabel(DIVISIONS_BN, d, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.district")}</Label>
                <Select value={form.permanent_district || "none"} onValueChange={v => {
                  setForm(f => ({ ...f, permanent_district: v === "none" ? "" : v, permanent_thana: "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_district")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {districts.map(d => (
                      <SelectItem key={d} value={d}>{getBnLabel(DISTRICTS_BN, d, language)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.thana")}</Label>
                <Select value={form.permanent_thana || "none"} onValueChange={v => set("permanent_thana", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_thana")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {thanas.map(th => (
                      <SelectItem key={th} value={th}>{getBnLabel(THANAS_BN, th, language)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.village")}</Label>
                <Input value={form.permanent_village} onChange={e => set("permanent_village", e.target.value)} />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label>{t("tenant.address_detail")}</Label>
              <Textarea value={form.permanent_address} onChange={e => set("permanent_address", e.target.value)} rows={2} />
            </div>
          </div>

          {/* Room & Meter */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{language === "bn" ? "রুম ও অ্যাসাইনমেন্ট" : "Room & Assignment"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("room.number")}</Label>
                <Select value={form.room_id || "none"} onValueChange={v => set("room_id", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_room")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {availableRooms.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.room_number} ({r.properties?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.advance_balance")}</Label>
                <Input type="number" value={form.advance_balance} onChange={e => set("advance_balance", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.move_in")}</Label>
                <Input type="date" value={form.move_in_date} onChange={e => set("move_in_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "বিলিং টাইপ" : "Billing Type"}</Label>
                <Select value={form.billing_type} onValueChange={v => set("billing_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="billing">{language === "bn" ? "বিলিং" : "Billing"}</SelectItem>
                    <SelectItem value="personal">{language === "bn" ? "পার্সোনাল" : "Personal"}</SelectItem>
                    <SelectItem value="free">{language === "bn" ? "ফ্রি" : "Free"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TenantFormDialog;
