import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, MapPin, FileText, Save, Loader2, Upload, X, Camera, ImagePlus, Printer, Briefcase, Phone as PhoneIcon, Car, Home, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageCropDialog from "@/components/ImageCropDialog";
import TenantRegistrationPrint from "@/components/tenants/TenantRegistrationPrint";
import EditApprovalSection from "@/components/tenants/EditApprovalSection";
import TenantReleaseDialog from "@/components/tenants/TenantReleaseDialog";
import {
  DIVISIONS, DIVISIONS_BN, DISTRICTS, DISTRICTS_BN, THANAS, THANAS_BN,
  normalizeDivision, normalizeDistrict, normalizeThana,
  findDivisionForDistrict, findDistrictForThana,
} from "@/data/bangladeshAddress";

const PROTECTED_FIELDS = [
  "full_name", "father_name", "marital_status", "religion", "education",
  "workplace_address", "passport_number", "email",
  "emergency_name", "emergency_relation", "emergency_address", "emergency_phone",
  "domestic_worker_name", "domestic_worker_nid", "domestic_worker_phone", "domestic_worker_address",
  "driver_name", "driver_nid", "driver_phone", "driver_address",
  "prev_landlord_name", "prev_landlord_phone", "prev_landlord_address", "prev_leave_reason",
  "current_landlord_name", "current_landlord_phone", "living_since",
];

const DOC_TYPES = [
  { value: "nid", en: "NID", bn: "জাতীয় পরিচয়পত্র" },
  { value: "birth_certificate", en: "Birth Certificate", bn: "জন্ম সনদ" },
  { value: "passport", en: "Passport", bn: "পাসপোর্ট" },
  { value: "license", en: "Driving License", bn: "ড্রাইভিং লাইসেন্স" },
];

const GENDER_OPTIONS = [
  { value: "male", en: "Male", bn: "পুরুষ" },
  { value: "female", en: "Female", bn: "মহিলা" },
  { value: "other", en: "Other", bn: "অন্যান্য" },
];

const TenantProfile = () => {
  const { t, language } = useLanguage();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const frontRef = useRef<HTMLInputElement>(null);
  const frontCamRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const backCamRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const avatarCamRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["my-tenant-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*, rooms:rooms!tenants_room_id_fkey(room_number, property_id, properties(name, division, district, thana, area, house_number, road_number, postal_code, owner_id))")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch landlord profile for auto-populate
  const landlordUserId = tenant && (tenant as any).owner_id !== (tenant as any).user_id ? (tenant as any).owner_id : null;
  const { data: landlordProfile } = useQuery({
    queryKey: ["landlord-profile-for-tenant", landlordUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", landlordUserId!)
        .maybeSingle();
      return data;
    },
    enabled: !!landlordUserId,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const isFormLoaded = useRef(false);

  // Derive auto-populated values from property/landlord
  const propData = (tenant as any)?.rooms?.properties;
  const autoCurrentLandlordName = landlordProfile?.full_name || "";
  const autoCurrentLandlordPhone = landlordProfile?.phone || "";
  const autoPresentDivision = propData?.division ? (language === "bn" ? (DIVISIONS_BN[propData.division] || propData.division) : propData.division) : "";
  const autoPresentDistrict = propData?.district ? (language === "bn" ? (DISTRICTS_BN[propData.district] || propData.district) : propData.district) : "";
  const autoPresentThana = propData?.thana ? (language === "bn" ? (THANAS_BN[propData.thana] || propData.thana) : propData.thana) : "";
  const autoPresentVillage = propData?.area || "";
  const autoPresentAddress = [propData?.house_number, propData?.road_number].filter(Boolean).join(", ");
  const autoPresentPostalCode = propData?.postal_code || "";

  // Populate form once tenant data loads
  if (tenant && !isFormLoaded.current) {
    const t = tenant as any;
    setForm({
      full_name: t.full_name || "",
      phone: t.phone || "",
      secondary_phone: t.secondary_phone || "",
      date_of_birth: t.date_of_birth || "",
      gender: t.gender || "",
      occupation: t.occupation || "",
      nid: t.nid || "",
      doc_type: t.doc_type || "",
      doc_number: t.doc_number || "",
      doc_front_url: t.doc_front_url || "",
      doc_back_url: t.doc_back_url || "",
      present_division: normalizeDivision(t.present_division),
      present_district: normalizeDistrict(t.present_district),
      present_thana: normalizeThana(t.present_thana),
      present_village: t.present_village || "",
      present_address: t.present_address || "",
      permanent_division: normalizeDivision(t.permanent_division),
      permanent_district: normalizeDistrict(t.permanent_district),
      permanent_thana: normalizeThana(t.permanent_thana),
      permanent_village: t.permanent_village || "",
      permanent_address: t.permanent_address || "",
      emergency_contact: t.emergency_contact || "",
      father_name: t.father_name || "",
      marital_status: t.marital_status || "",
      religion: t.religion || "",
      education: t.education || "",
      workplace_address: t.workplace_address || "",
      passport_number: t.passport_number || "",
      email: t.email || "",
      emergency_name: t.emergency_name || "",
      emergency_relation: t.emergency_relation || "",
      emergency_address: t.emergency_address || "",
      emergency_phone: t.emergency_phone || "",
      domestic_worker_name: t.domestic_worker_name || "",
      domestic_worker_nid: t.domestic_worker_nid || "",
      domestic_worker_phone: t.domestic_worker_phone || "",
      domestic_worker_address: t.domestic_worker_address || "",
      driver_name: t.driver_name || "",
      driver_nid: t.driver_nid || "",
      driver_phone: t.driver_phone || "",
      driver_address: t.driver_address || "",
      prev_landlord_name: t.prev_landlord_name || "",
      prev_landlord_phone: t.prev_landlord_phone || "",
      prev_landlord_address: t.prev_landlord_address || "",
      prev_leave_reason: t.prev_leave_reason || "",
      current_landlord_name: t.current_landlord_name || "",
      current_landlord_phone: t.current_landlord_phone || "",
      living_since: t.living_since || "",
    });
    isFormLoaded.current = true;
  }

  // Self-release mutation
  const selfReleaseMutation = useMutation({
    mutationFn: async ({ reason, notes }: { reason: string; notes: string }) => {
      const t = tenant as any;
      const { error } = await supabase
        .from("tenant_edit_requests")
        .insert({
          tenant_id: t.id,
          requested_by: user!.id,
          approve_by: t.owner_id,
          field_changes: { _action: "release", release_reason: reason, release_notes: notes },
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests-sent"] });
      setReleaseDialogOpen(false);
      toast.success(language === "bn" ? "বাড়ি ছাড়ার অনুরোধ পাঠানো হয়েছে, বাড়িওয়ালার অনুমোদন প্রয়োজন" : "Release request sent, landlord approval required");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateField = (key: string, value: string) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === "present_division") {
        const next = normalizeDivision(value);
        const current = normalizeDivision(f.present_division);
        updated.present_division = next;
        if (next !== current) {
          updated.present_district = "";
          updated.present_thana = "";
        }
      } else if (key === "present_district") {
        const next = normalizeDistrict(value);
        const current = normalizeDistrict(f.present_district);
        updated.present_district = next;
        if (next !== current) {
          updated.present_thana = "";
        }
      } else if (key === "permanent_division") {
        const next = normalizeDivision(value);
        const current = normalizeDivision(f.permanent_division);
        updated.permanent_division = next;
        if (next !== current) {
          updated.permanent_district = "";
          updated.permanent_thana = "";
        }
      } else if (key === "permanent_district") {
        const next = normalizeDistrict(value);
        const current = normalizeDistrict(f.permanent_district);
        updated.permanent_district = next;
        if (next !== current) {
          updated.permanent_thana = "";
        }
      } else if (key === "present_thana") {
        updated.present_thana = normalizeThana(value);
      } else if (key === "permanent_thana") {
        updated.permanent_thana = normalizeThana(value);
      }
      return updated;
    });
  };

  // Check if tenant is linked to a different landlord (self-registered but under a landlord)
  const isLinkedToLandlord = tenant && (tenant as any).user_id && (tenant as any).owner_id && (tenant as any).user_id !== (tenant as any).owner_id;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const allFields: Record<string, any> = {
        full_name: form.full_name,
        phone: form.phone,
        secondary_phone: form.secondary_phone,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
        occupation: form.occupation,
        nid: form.nid,
        doc_type: form.doc_type,
        doc_number: form.doc_number,
        doc_front_url: form.doc_front_url,
        doc_back_url: form.doc_back_url,
        present_division: normalizeDivision(form.present_division),
        present_district: normalizeDistrict(form.present_district),
        present_thana: normalizeThana(form.present_thana),
        present_village: form.present_village,
        present_address: form.present_address,
        permanent_division: normalizeDivision(form.permanent_division),
        permanent_district: normalizeDistrict(form.permanent_district),
        permanent_thana: normalizeThana(form.permanent_thana),
        permanent_village: form.permanent_village,
        permanent_address: form.permanent_address,
        emergency_contact: form.emergency_contact,
        father_name: form.father_name,
        marital_status: form.marital_status,
        religion: form.religion,
        education: form.education,
        workplace_address: form.workplace_address,
        passport_number: form.passport_number,
        email: form.email,
        emergency_name: form.emergency_name,
        emergency_relation: form.emergency_relation,
        emergency_address: form.emergency_address,
        emergency_phone: form.emergency_phone,
        domestic_worker_name: form.domestic_worker_name,
        domestic_worker_nid: form.domestic_worker_nid,
        domestic_worker_phone: form.domestic_worker_phone,
        domestic_worker_address: form.domestic_worker_address,
        driver_name: form.driver_name,
        driver_nid: form.driver_nid,
        driver_phone: form.driver_phone,
        driver_address: form.driver_address,
        prev_landlord_name: form.prev_landlord_name,
        prev_landlord_phone: form.prev_landlord_phone,
        prev_landlord_address: form.prev_landlord_address,
        prev_leave_reason: form.prev_leave_reason,
        current_landlord_name: form.current_landlord_name,
        current_landlord_phone: form.current_landlord_phone,
        living_since: form.living_since,
      };

      if (isLinkedToLandlord) {
        // Split into direct-save and protected fields
        const directPayload: Record<string, any> = {};
        const protectedChanges: Record<string, any> = {};
        const oldTenant = tenant as any;

        for (const [key, val] of Object.entries(allFields)) {
          if (PROTECTED_FIELDS.includes(key)) {
            // Only create request if value actually changed
            if ((oldTenant[key] || "") !== (val || "")) {
              protectedChanges[key] = val;
            }
          } else {
            directPayload[key] = val;
          }
        }

        // Save non-protected fields directly
        if (Object.keys(directPayload).length > 0) {
          const { error } = await supabase
            .from("tenants")
            .update(directPayload as any)
            .eq("user_id", user!.id);
          if (error) throw error;
        }

        // Create edit request for protected fields
        if (Object.keys(protectedChanges).length > 0) {
          const { error } = await supabase
            .from("tenant_edit_requests")
            .insert({
              tenant_id: oldTenant.id,
              requested_by: user!.id,
              approve_by: oldTenant.owner_id,
              field_changes: protectedChanges,
            } as any);
          if (error) throw error;
          return { hasEditRequest: true };
        }
        return { hasEditRequest: false };
      } else {
        // No landlord linked — save everything directly
        const { error } = await supabase
          .from("tenants")
          .update(allFields as any)
          .eq("user_id", user!.id);
        if (error) throw error;
        return { hasEditRequest: false };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant-profile"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests-sent"] });
      if (result?.hasEditRequest) {
        toast.success(language === "bn" ? "পরিবর্তনের অনুরোধ পাঠানো হয়েছে, বাড়িওয়ালার অনুমোদন প্রয়োজন" : "Edit request sent, landlord approval required");
      } else {
        toast.success(t("tenant.updated"));
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadDoc = async (file: File, field: "doc_front_url" | "doc_back_url") => {
    if (!file || !user) return;
    setUploading(field);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("tenant-documents")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("tenant-documents").getPublicUrl(path);
      updateField(field, urlData.publicUrl);
      toast.success(language === "bn" ? "আপলোড সফল" : "Upload successful");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
    e.target.value = "";
  };

  const handleCroppedAvatar = async (blob: Blob) => {
    setCropOpen(false);
    setCropFile(null);
    if (!user) return;
    setUploading("avatar");
    try {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
      await refreshProfile();
      toast.success(language === "bn" ? "প্রোফাইল ছবি আপডেট হয়েছে" : "Profile picture updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <User className="h-10 w-10 opacity-40" />
        <p>{language === "bn" ? "আপনার টেনান্ট রেকর্ড পাওয়া যায়নি।" : "Your tenant record was not found."}</p>
      </div>
    );
  }

  const presentDivisionValue = normalizeDivision(form.present_division);
  const presentDistrictValue = normalizeDistrict(form.present_district);
  const presentThanaValue = normalizeThana(form.present_thana);
  const permanentDivisionValue = normalizeDivision(form.permanent_division);
  const permanentDistrictValue = normalizeDistrict(form.permanent_district);
  const permanentThanaValue = normalizeThana(form.permanent_thana);

  const presentDistricts = presentDivisionValue ? DISTRICTS[presentDivisionValue] || [] : [];
  const presentThanas = presentDistrictValue ? THANAS[presentDistrictValue] || [] : [];
  const permDistricts = permanentDivisionValue ? DISTRICTS[permanentDivisionValue] || [] : [];
  const permThanas = permanentDistrictValue ? THANAS[permanentDistrictValue] || [] : [];

  const renderAddressSelect = (label: string, value: string, onChange: (v: string) => void, options: string[], bnMap: Record<string, string>, placeholder: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{language === "bn" ? (bnMap[opt] || opt) : opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{language === "bn" ? "আমার প্রোফাইল" : "My Profile"}</h1>

      {/* Edit Approval Section */}
      <EditApprovalSection role="tenant" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardContent className="py-6 flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {authProfile?.avatar_url && <AvatarImage src={authProfile.avatar_url} alt={authProfile?.full_name || ""} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {authProfile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {uploading === "avatar" && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => avatarCamRef.current?.click()} disabled={!!uploading}>
                <Camera className="h-4 w-4 mr-1" />
                {language === "bn" ? "ক্যামেরা" : "Camera"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => avatarRef.current?.click()} disabled={!!uploading}>
                <ImagePlus className="h-4 w-4 mr-1" />
                {language === "bn" ? "গ্যালারি" : "Gallery"}
              </Button>
            </div>
            <input ref={avatarCamRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarSelect} />
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            <ImageCropDialog file={cropFile} open={cropOpen} onClose={() => { setCropOpen(false); setCropFile(null); }} onCropComplete={handleCroppedAvatar} />
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />{language === "bn" ? "ব্যক্তিগত তথ্য" : "Personal Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("auth.name")}</Label>
                <Input value={form.full_name || ""} onChange={(e) => updateField("full_name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("tenant.phone")}</Label>
                <Input value={form.phone || ""} onChange={(e) => updateField("phone", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("tenant.secondary_phone")}</Label>
                <Input value={form.secondary_phone || ""} onChange={(e) => updateField("secondary_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "জন্ম তারিখ" : "Date of Birth"}</Label>
                <Input type="date" value={form.date_of_birth || ""} onChange={(e) => updateField("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "লিঙ্গ" : "Gender"}</Label>
                <Select value={form.gender || ""} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger><SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{language === "bn" ? g.bn : g.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "পেশা" : "Occupation"}</Label>
                <Input value={form.occupation || ""} onChange={(e) => updateField("occupation", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "পিতার নাম" : "Father's Name"}</Label>
                <Input value={form.father_name || ""} onChange={(e) => updateField("father_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "ইমেইল" : "Email"}</Label>
                <Input value={form.email || ""} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "পাসপোর্ট নম্বর" : "Passport Number"}</Label>
                <Input value={form.passport_number || ""} onChange={(e) => updateField("passport_number", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "বৈবাহিক অবস্থা" : "Marital Status"}</Label>
                <Select value={form.marital_status || ""} onValueChange={(v) => updateField("marital_status", v)}>
                  <SelectTrigger><SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="married">{language === "bn" ? "বিবাহিত" : "Married"}</SelectItem>
                    <SelectItem value="unmarried">{language === "bn" ? "অবিবাহিত" : "Unmarried"}</SelectItem>
                    <SelectItem value="divorced">{language === "bn" ? "তালাকপ্রাপ্ত" : "Divorced"}</SelectItem>
                    <SelectItem value="widowed">{language === "bn" ? "বিধবা/বিপত্নীক" : "Widowed"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "ধর্ম" : "Religion"}</Label>
                <Select value={form.religion || ""} onValueChange={(v) => updateField("religion", v)}>
                  <SelectTrigger><SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="islam">{language === "bn" ? "ইসলাম" : "Islam"}</SelectItem>
                    <SelectItem value="hinduism">{language === "bn" ? "হিন্দু" : "Hinduism"}</SelectItem>
                    <SelectItem value="christianity">{language === "bn" ? "খ্রিষ্টান" : "Christianity"}</SelectItem>
                    <SelectItem value="buddhism">{language === "bn" ? "বৌদ্ধ" : "Buddhism"}</SelectItem>
                    <SelectItem value="other">{language === "bn" ? "অন্যান্য" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "শিক্ষাগত যোগ্যতা" : "Education"}</Label>
                <Input value={form.education || ""} onChange={(e) => updateField("education", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{language === "bn" ? "পেশা ও কর্মস্থলের ঠিকানা" : "Workplace Address"}</Label>
                <Input value={form.workplace_address || ""} onChange={(e) => updateField("workplace_address", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />{language === "bn" ? "ডকুমেন্ট তথ্য" : "Document Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "ডকুমেন্টের ধরন" : "Document Type"}</Label>
                <Select value={form.doc_type || ""} onValueChange={(v) => updateField("doc_type", v)}>
                  <SelectTrigger><SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} /></SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{language === "bn" ? d.bn : d.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "ডকুমেন্ট নম্বর" : "Document Number"}</Label>
                <Input value={form.doc_number || ""} onChange={(e) => updateField("doc_number", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "সামনের ছবি" : "Front Image"}</Label>
                <div className="flex items-center gap-2">
                  {form.doc_front_url ? (
                    <div className="relative w-20 h-14 rounded border overflow-hidden group">
                      <img src={form.doc_front_url} alt="Front" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => updateField("doc_front_url", "")} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => frontCamRef.current?.click()} disabled={!!uploading}>
                        {uploading === "doc_front_url" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                        {language === "bn" ? "ক্যামেরা" : "Camera"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => frontRef.current?.click()} disabled={!!uploading}>
                        <ImagePlus className="h-4 w-4 mr-1" />
                        {language === "bn" ? "গ্যালারি" : "Gallery"}
                      </Button>
                    </div>
                  )}
                  <input ref={frontCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "doc_front_url")} />
                  <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "doc_front_url")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "পেছনের ছবি" : "Back Image"}</Label>
                <div className="flex items-center gap-2">
                  {form.doc_back_url ? (
                    <div className="relative w-20 h-14 rounded border overflow-hidden group">
                      <img src={form.doc_back_url} alt="Back" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => updateField("doc_back_url", "")} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => backCamRef.current?.click()} disabled={!!uploading}>
                        {uploading === "doc_back_url" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                        {language === "bn" ? "ক্যামেরা" : "Camera"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => backRef.current?.click()} disabled={!!uploading}>
                        <ImagePlus className="h-4 w-4 mr-1" />
                        {language === "bn" ? "গ্যালারি" : "Gallery"}
                      </Button>
                    </div>
                  )}
                  <input ref={backCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "doc_back_url")} />
                  <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "doc_back_url")} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Present Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />{language === "bn" ? "বর্তমান ঠিকানা" : "Present Address"}
              {isLinkedToLandlord && <span className="text-xs font-normal text-muted-foreground ml-2">({language === "bn" ? "স্বয়ংক্রিয়ভাবে আসা তথ্য" : "Auto-populated"})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLinkedToLandlord ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("tenant.division")}</Label>
                  <Input value={autoPresentDivision} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.district")}</Label>
                  <Input value={autoPresentDistrict} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.thana")}</Label>
                  <Input value={autoPresentThana} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.village")}</Label>
                  <Input value={autoPresentVillage} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>{language === "bn" ? "পোস্টাল কোড" : "Postal Code"}</Label>
                  <Input value={autoPresentPostalCode} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("tenant.address_detail")}</Label>
                  <Input value={autoPresentAddress} disabled className="bg-muted" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderAddressSelect(t("tenant.division"), presentDivisionValue || "", (v) => updateField("present_division", v), DIVISIONS, DIVISIONS_BN, t("tenant.select_division"))}
                {renderAddressSelect(t("tenant.district"), presentDistrictValue || "", (v) => updateField("present_district", v), presentDistricts, DISTRICTS_BN, t("tenant.select_district"))}
                {renderAddressSelect(t("tenant.thana"), presentThanaValue || "", (v) => updateField("present_thana", v), presentThanas, THANAS_BN, t("tenant.select_thana"))}
                <div className="space-y-1.5">
                  <Label>{t("tenant.village")}</Label>
                  <Input value={form.present_village || ""} onChange={(e) => updateField("present_village", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("tenant.address_detail")}</Label>
                  <Textarea value={form.present_address || ""} onChange={(e) => updateField("present_address", e.target.value)} rows={2} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permanent Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{t("tenant.permanent_address_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderAddressSelect(t("tenant.division"), permanentDivisionValue || "", (v) => updateField("permanent_division", v), DIVISIONS, DIVISIONS_BN, t("tenant.select_division"))}
              {renderAddressSelect(t("tenant.district"), permanentDistrictValue || "", (v) => updateField("permanent_district", v), permDistricts, DISTRICTS_BN, t("tenant.select_district"))}
              {renderAddressSelect(t("tenant.thana"), permanentThanaValue || "", (v) => updateField("permanent_thana", v), permThanas, THANAS_BN, t("tenant.select_thana"))}
              <div className="space-y-1.5">
                <Label>{t("tenant.village")}</Label>
                <Input value={form.permanent_village || ""} onChange={(e) => updateField("permanent_village", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("tenant.address_detail")}</Label>
                <Textarea value={form.permanent_address || ""} onChange={(e) => updateField("permanent_address", e.target.value)} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><PhoneIcon className="h-4 w-4" />{language === "bn" ? "জরুরী যোগাযোগ" : "Emergency Contact"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.emergency_name || ""} onChange={(e) => updateField("emergency_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "সম্পর্ক" : "Relation"}</Label>
                <Input value={form.emergency_relation || ""} onChange={(e) => updateField("emergency_relation", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "মোবাইল নম্বর" : "Mobile"}</Label>
                <Input value={form.emergency_phone || ""} onChange={(e) => updateField("emergency_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "ঠিকানা" : "Address"}</Label>
                <Input value={form.emergency_address || ""} onChange={(e) => updateField("emergency_address", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domestic Worker */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" />{language === "bn" ? "গৃহকর্মী তথ্য" : "Domestic Worker Info"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.domestic_worker_name || ""} onChange={(e) => updateField("domestic_worker_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "জাতীয় পরিচয়পত্র নং" : "NID"}</Label>
                <Input value={form.domestic_worker_nid || ""} onChange={(e) => updateField("domestic_worker_nid", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.domestic_worker_phone || ""} onChange={(e) => updateField("domestic_worker_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "স্থায়ী ঠিকানা" : "Address"}</Label>
                <Input value={form.domestic_worker_address || ""} onChange={(e) => updateField("domestic_worker_address", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Car className="h-4 w-4" />{language === "bn" ? "ড্রাইভার তথ্য" : "Driver Info"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.driver_name || ""} onChange={(e) => updateField("driver_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "জাতীয় পরিচয়পত্র নং" : "NID"}</Label>
                <Input value={form.driver_nid || ""} onChange={(e) => updateField("driver_nid", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.driver_phone || ""} onChange={(e) => updateField("driver_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "স্থায়ী ঠিকানা" : "Address"}</Label>
                <Input value={form.driver_address || ""} onChange={(e) => updateField("driver_address", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Landlord */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Home className="h-4 w-4" />{language === "bn" ? "পূর্ববর্তী বাড়িওয়ালার তথ্য" : "Previous Landlord Info"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                <Input value={form.prev_landlord_name || ""} onChange={(e) => updateField("prev_landlord_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                <Input value={form.prev_landlord_phone || ""} onChange={(e) => updateField("prev_landlord_phone", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{language === "bn" ? "ঠিকানা" : "Address"}</Label>
                <Input value={form.prev_landlord_address || ""} onChange={(e) => updateField("prev_landlord_address", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{language === "bn" ? "পূর্ববর্তী বাসা ছাড়ার কারণ" : "Reason for Leaving"}</Label>
                <Input value={form.prev_leave_reason || ""} onChange={(e) => updateField("prev_leave_reason", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Landlord */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4" />{language === "bn" ? "বর্তমান বাড়িওয়ালার তথ্য" : "Current Landlord Info"}
              {isLinkedToLandlord && <span className="text-xs font-normal text-muted-foreground ml-2">({language === "bn" ? "স্বয়ংক্রিয়ভাবে আসা তথ্য" : "Auto-populated"})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                {isLinkedToLandlord ? (
                  <Input value={autoCurrentLandlordName} disabled className="bg-muted" />
                ) : (
                  <Input value={form.current_landlord_name || ""} onChange={(e) => updateField("current_landlord_name", e.target.value)} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "মোবাইল" : "Mobile"}</Label>
                {isLinkedToLandlord ? (
                  <Input value={autoCurrentLandlordPhone} disabled className="bg-muted" />
                ) : (
                  <Input value={form.current_landlord_phone || ""} onChange={(e) => updateField("current_landlord_phone", e.target.value)} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{language === "bn" ? "বসবাসের তারিখ" : "Living Since"}</Label>
                <Input type="date" value={form.living_since || ""} onChange={(e) => updateField("living_since", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          {isLinkedToLandlord && (
            <Button type="button" variant="outline" className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => setReleaseDialogOpen(true)}>
              <LogOut className="h-4 w-4" />
              {language === "bn" ? "বাড়ি ছাড়তে চাই" : "I want to leave"}
            </Button>
          )}
          <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {language === "bn" ? "নিবন্ধন ফরম প্রিন্ট" : "Print Registration Form"}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </div>
      </form>

      {/* Self-release dialog */}
      {isLinkedToLandlord && (
        <TenantReleaseDialog
          open={releaseDialogOpen}
          onOpenChange={setReleaseDialogOpen}
          tenantName={form.full_name || ""}
          onConfirm={(reason, notes) => selfReleaseMutation.mutate({ reason, notes })}
          isPending={selfReleaseMutation.isPending}
        />
      )}

      {/* Hidden print form with auto-populated data */}
      <div className="hidden print:block">
        <TenantRegistrationPrint
          tenant={{
            ...(tenant as any),
            current_landlord_name: isLinkedToLandlord ? autoCurrentLandlordName : (tenant as any)?.current_landlord_name,
            current_landlord_phone: isLinkedToLandlord ? autoCurrentLandlordPhone : (tenant as any)?.current_landlord_phone,
          }}
        />
      </div>
    </div>
  );
};

export default TenantProfile;
