import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PROTECTED_FIELDS = [
  "full_name", "father_name", "marital_status", "religion", "education",
  "workplace_address", "passport_number", "email",
  "emergency_name", "emergency_relation", "emergency_address", "emergency_phone",
  "domestic_worker_name", "domestic_worker_nid", "domestic_worker_phone", "domestic_worker_address",
  "driver_name", "driver_nid", "driver_phone", "driver_address",
  "prev_landlord_name", "prev_landlord_phone", "prev_landlord_address", "prev_leave_reason",
  "current_landlord_name", "current_landlord_phone", "living_since",
];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { RefreshCw, ChevronDown } from "lucide-react";
import { DIVISIONS, DIVISIONS_BN, DISTRICTS, DISTRICTS_BN, THANAS, THANAS_BN, getBnLabel, normalizeDivision, normalizeDistrict, normalizeThana } from "@/data/bangladeshAddress";

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
  // Permanent address
  permanent_division: "", permanent_district: "", permanent_thana: "",
  permanent_village: "", permanent_address: "",
  // Present address
  present_division: "", present_district: "", present_thana: "",
  present_village: "", present_address: "",
  // Personal info
  date_of_birth: "", gender: "", occupation: "",
  // Document
  doc_type: "", doc_number: "",
  // Police form fields
  father_name: "", marital_status: "", religion: "", education: "",
  workplace_address: "", passport_number: "", email: "",
  emergency_name: "", emergency_relation: "", emergency_address: "", emergency_phone: "",
  domestic_worker_name: "", domestic_worker_nid: "", domestic_worker_phone: "", domestic_worker_address: "",
  driver_name: "", driver_nid: "", driver_phone: "", driver_address: "",
  prev_landlord_name: "", prev_landlord_phone: "", prev_landlord_address: "",
  prev_leave_reason: "",
  current_landlord_name: "", current_landlord_phone: "", living_since: "",
};

const generatePin = () => String(Math.floor(100000 + Math.random() * 900000));

const TenantFormDialog = ({ open, onOpenChange, editing, availableRooms, onCredentialsCreated }: Props) => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");

  // Permanent address cascading
  const districts = form.permanent_division ? (DISTRICTS[form.permanent_division] || []) : [];
  const thanas = form.permanent_district ? (THANAS[form.permanent_district] || []) : [];
  // Present address cascading
  const presentDistricts = form.present_division ? (DISTRICTS[form.present_division] || []) : [];
  const presentThanas = form.present_district ? (THANAS[form.present_district] || []) : [];

  useEffect(() => {
    if (editing) {
      const f: any = {};
      for (const key of Object.keys(emptyForm)) {
        if (key === "advance_balance") {
          f[key] = editing.advance_balance?.toString() || "";
        } else {
          f[key] = editing[key] || "";
        }
      }
      if (!f.status) f.status = "active";
      if (!f.billing_type) f.billing_type = "billing";
      // Normalize address fields to canonical English keys
      f.permanent_division = normalizeDivision(f.permanent_division);
      f.permanent_district = normalizeDistrict(f.permanent_district);
      f.permanent_thana = normalizeThana(f.permanent_thana);
      f.present_division = normalizeDivision(f.present_division);
      f.present_district = normalizeDistrict(f.present_district);
      f.present_thana = normalizeThana(f.present_thana);
      setForm(f);
      setCreateAccount(false);
      setPassword("");
    } else {
      setForm(emptyForm);
      setCreateAccount(false);
      setPassword("");
    }
  }, [editing, open]);

  const buildPayload = (values: typeof emptyForm & { id?: string; old_room_id?: string }) => {
    const payload: Record<string, any> = {};
    for (const [key, val] of Object.entries(values)) {
      if (key === "id" || key === "old_room_id") continue;
      if (key === "advance_balance") {
        payload[key] = val ? parseFloat(val as string) : 0;
      } else if (key === "room_id" || key === "nid" || key === "emergency_contact" || key === "move_in_date" || key === "date_of_birth") {
        payload[key] = val || null;
      } else {
        payload[key] = val;
      }
    }
    // Ensure address fields are canonical English keys
    payload.permanent_division = normalizeDivision(payload.permanent_division);
    payload.permanent_district = normalizeDistrict(payload.permanent_district);
    payload.permanent_thana = normalizeThana(payload.permanent_thana);
    payload.present_division = normalizeDivision(payload.present_division);
    payload.present_district = normalizeDistrict(payload.present_district);
    payload.present_thana = normalizeThana(payload.present_thana);
    return payload;
  };

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

  const createMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const { data: newTenant, error } = await supabase.from("tenants").insert({
        ...buildPayload(values),
        owner_id: effectiveOwnerId || user!.id,
      } as any).select("id").single();
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

  const isSelfRegistered = editing && editing.user_id && editing.user_id !== editing.owner_id;

  const updateMutation = useMutation({
    mutationFn: async (values: typeof emptyForm & { id: string; old_room_id?: string }) => {
      if (isSelfRegistered) {
        const directPayload: Record<string, any> = {};
        const protectedChanges: Record<string, any> = {};

        const builtPayload = buildPayload(values);
        for (const [key, val] of Object.entries(builtPayload)) {
          if (PROTECTED_FIELDS.includes(key)) {
            if ((editing[key] || "") !== (val || "")) {
              protectedChanges[key] = val;
            }
          } else {
            directPayload[key] = val;
          }
        }

        if (Object.keys(directPayload).length > 0) {
          const { error } = await supabase.from("tenants").update(directPayload as any).eq("id", values.id);
          if (error) throw error;
        }

        if (Object.keys(protectedChanges).length > 0) {
          const { error } = await supabase
            .from("tenant_edit_requests")
            .insert({
              tenant_id: values.id,
              requested_by: user!.id,
              approve_by: editing.user_id,
              field_changes: protectedChanges,
            } as any);
          if (error) throw error;
          return { hasEditRequest: true };
        }
      } else {
        const { error } = await supabase.from("tenants").update(buildPayload(values) as any).eq("id", values.id);
        if (error) throw error;
      }

      if (values.old_room_id && values.old_room_id !== values.room_id) {
        const { error: oldRoomErr } = await supabase.from("rooms").update({ status: "vacant", tenant_id: null }).eq("id", values.old_room_id);
        if (oldRoomErr) throw oldRoomErr;
      }
      if (values.room_id) {
        const { error: newRoomErr } = await supabase.from("rooms").update({ status: "occupied", is_tolet: false, available_from: null, tenant_id: values.id }).eq("id", values.room_id);
        if (newRoomErr) throw newRoomErr;
      }
      return { hasEditRequest: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests"] });
      onOpenChange(false);
      if (result?.hasEditRequest) {
        toast.success(language === "bn" ? "পরিবর্তনের অনুরোধ পাঠানো হয়েছে, ভাড়াটিয়ার অনুমোদন প্রয়োজন" : "Edit request sent, tenant approval required");
      } else {
        toast.success(t("tenant.updated") || "Tenant updated");
      }
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

  const SectionCollapsible = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

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
                <Label>{language === "bn" ? "নাম" : "Name"} *</Label>
                <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "পিতার নাম" : "Father's Name"}</Label>
                <Input value={form.father_name} onChange={e => set("father_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "ফোন" : "Phone"} *</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "অতিরিক্ত ফোন" : "Secondary Phone"}</Label>
                <Input value={form.secondary_phone} onChange={e => set("secondary_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "ইমেইল" : "Email"}</Label>
                <Input value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "NID নম্বর" : "NID"}</Label>
                <Input value={form.nid} onChange={e => set("nid", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "জন্ম তারিখ" : "Date of Birth"}</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "লিঙ্গ" : "Gender"}</Label>
                <Select value={form.gender || "none"} onValueChange={v => set("gender", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="male">{language === "bn" ? "পুরুষ" : "Male"}</SelectItem>
                    <SelectItem value="female">{language === "bn" ? "মহিলা" : "Female"}</SelectItem>
                    <SelectItem value="other">{language === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "পেশা" : "Occupation"}</Label>
                <Input value={form.occupation} onChange={e => set("occupation", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "পাসপোর্ট নম্বর" : "Passport Number"}</Label>
                <Input value={form.passport_number} onChange={e => set("passport_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "বৈবাহিক অবস্থা" : "Marital Status"}</Label>
                <Select value={form.marital_status || "none"} onValueChange={v => set("marital_status", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="married">{language === "bn" ? "বিবাহিত" : "Married"}</SelectItem>
                    <SelectItem value="unmarried">{language === "bn" ? "অবিবাহিত" : "Unmarried"}</SelectItem>
                    <SelectItem value="divorced">{language === "bn" ? "তালাকপ্রাপ্ত" : "Divorced"}</SelectItem>
                    <SelectItem value="widowed">{language === "bn" ? "বিধবা/বিপত্নীক" : "Widowed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "ধর্ম" : "Religion"}</Label>
                <Select value={form.religion || "none"} onValueChange={v => set("religion", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="islam">{language === "bn" ? "ইসলাম" : "Islam"}</SelectItem>
                    <SelectItem value="hinduism">{language === "bn" ? "হিন্দু" : "Hinduism"}</SelectItem>
                    <SelectItem value="christianity">{language === "bn" ? "খ্রিষ্টান" : "Christianity"}</SelectItem>
                    <SelectItem value="buddhism">{language === "bn" ? "বৌদ্ধ" : "Buddhism"}</SelectItem>
                    <SelectItem value="other">{language === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "শিক্ষাগত যোগ্যতা" : "Education"}</Label>
                <Input value={form.education} onChange={e => set("education", e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{language === "bn" ? "পেশা ও কর্মস্থলের ঠিকানা" : "Workplace Address"}</Label>
                <Input value={form.workplace_address} onChange={e => set("workplace_address", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Document Info */}
          <SectionCollapsible title={language === "bn" ? "ডকুমেন্ট তথ্য" : "Document Info"}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "ডকুমেন্টের ধরন" : "Document Type"}</Label>
                <Select value={form.doc_type || "none"} onValueChange={v => set("doc_type", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="nid">{language === "bn" ? "জাতীয় পরিচয়পত্র" : "NID"}</SelectItem>
                    <SelectItem value="passport">{language === "bn" ? "পাসপোর্ট" : "Passport"}</SelectItem>
                    <SelectItem value="birth_certificate">{language === "bn" ? "জন্ম নিবন্ধন" : "Birth Certificate"}</SelectItem>
                    <SelectItem value="driving_license">{language === "bn" ? "ড্রাইভিং লাইসেন্স" : "Driving License"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "ডকুমেন্ট নম্বর" : "Document Number"}</Label>
                <Input value={form.doc_number} onChange={e => set("doc_number", e.target.value)} />
              </div>
            </div>
          </SectionCollapsible>

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
                      <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required={createAccount} />
                      <Button type="button" variant="outline" size="icon" onClick={() => setPassword(generatePin())} title={language === "bn" ? "নতুন পিন তৈরি করুন" : "Generate PIN"}>
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
                  setForm(f => ({ ...f, permanent_division: v === "none" ? "" : v, permanent_district: "", permanent_thana: "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_division")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {DIVISIONS.map(d => (
                      <SelectItem key={d} value={d}>{getBnLabel(DIVISIONS_BN, d, language)}</SelectItem>
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

          {/* Present Address */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{language === "bn" ? "বর্তমান ঠিকানা" : "Present Address"}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("tenant.division")}</Label>
                <Select value={form.present_division || "none"} onValueChange={v => {
                  setForm(f => ({ ...f, present_division: v === "none" ? "" : v, present_district: "", present_thana: "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_division")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {DIVISIONS.map(d => (
                      <SelectItem key={d} value={d}>{getBnLabel(DIVISIONS_BN, d, language)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.district")}</Label>
                <Select value={form.present_district || "none"} onValueChange={v => {
                  setForm(f => ({ ...f, present_district: v === "none" ? "" : v, present_thana: "" }));
                }}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_district")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {presentDistricts.map(d => (
                      <SelectItem key={d} value={d}>{getBnLabel(DISTRICTS_BN, d, language)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tenant.thana")}</Label>
                <Select value={form.present_thana || "none"} onValueChange={v => set("present_thana", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder={t("tenant.select_thana")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {presentThanas.map(th => (
                      <SelectItem key={th} value={th}>{getBnLabel(THANAS_BN, th, language)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "গ্রাম/এলাকা" : "Village/Area"}</Label>
                <Input value={form.present_village} onChange={e => set("present_village", e.target.value)} />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label>{language === "bn" ? "বিস্তারিত ঠিকানা" : "Detailed Address"}</Label>
              <Textarea value={form.present_address} onChange={e => set("present_address", e.target.value)} rows={2} />
            </div>
          </div>

          {/* Emergency Contact */}
          <SectionCollapsible title={language === "bn" ? "জরুরী যোগাযোগ" : "Emergency Contact"}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.emergency_name} onChange={e => set("emergency_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "সম্পর্ক" : "Relation"}</Label>
                <Input value={form.emergency_relation} onChange={e => set("emergency_relation", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.emergency_phone} onChange={e => set("emergency_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "ঠিকানা" : "Address"}</Label>
                <Input value={form.emergency_address} onChange={e => set("emergency_address", e.target.value)} />
              </div>
            </div>
          </SectionCollapsible>

          {/* Domestic Worker */}
          <SectionCollapsible title={language === "bn" ? "গৃহকর্মী তথ্য" : "Domestic Worker Info"}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.domestic_worker_name} onChange={e => set("domestic_worker_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "জাতীয় পরিচয়পত্র নং" : "NID"}</Label>
                <Input value={form.domestic_worker_nid} onChange={e => set("domestic_worker_nid", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.domestic_worker_phone} onChange={e => set("domestic_worker_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "স্থায়ী ঠিকানা" : "Address"}</Label>
                <Input value={form.domestic_worker_address} onChange={e => set("domestic_worker_address", e.target.value)} />
              </div>
            </div>
          </SectionCollapsible>

          {/* Driver */}
          <SectionCollapsible title={language === "bn" ? "ড্রাইভার তথ্য" : "Driver Info"}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.driver_name} onChange={e => set("driver_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "জাতীয় পরিচয়পত্র নং" : "NID"}</Label>
                <Input value={form.driver_nid} onChange={e => set("driver_nid", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.driver_phone} onChange={e => set("driver_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "স্থায়ী ঠিকানা" : "Address"}</Label>
                <Input value={form.driver_address} onChange={e => set("driver_address", e.target.value)} />
              </div>
            </div>
          </SectionCollapsible>

          {/* Previous Landlord */}
          <SectionCollapsible title={language === "bn" ? "পূর্ববর্তী বাড়িওয়ালার তথ্য" : "Previous Landlord Info"}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.prev_landlord_name} onChange={e => set("prev_landlord_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.prev_landlord_phone} onChange={e => set("prev_landlord_phone", e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{language === "bn" ? "ঠিকানা" : "Address"}</Label>
                <Input value={form.prev_landlord_address} onChange={e => set("prev_landlord_address", e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{language === "bn" ? "পূর্ববর্তী বাসা ছাড়ার কারণ" : "Reason for Leaving"}</Label>
                <Input value={form.prev_leave_reason} onChange={e => set("prev_leave_reason", e.target.value)} />
              </div>
            </div>
          </SectionCollapsible>

          {/* Current Landlord */}
          <SectionCollapsible title={language === "bn" ? "বর্তমান বাড়িওয়ালার তথ্য" : "Current Landlord Info"}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.current_landlord_name} onChange={e => set("current_landlord_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.current_landlord_phone} onChange={e => set("current_landlord_phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "বসবাসের তারিখ" : "Living Since"}</Label>
                <Input type="date" value={form.living_since} onChange={e => set("living_since", e.target.value)} />
              </div>
            </div>
          </SectionCollapsible>

          {/* Room & Assignment */}
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
