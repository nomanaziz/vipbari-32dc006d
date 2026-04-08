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
import { User, MapPin, FileText, Save, Loader2, Upload, X, Camera, ImagePlus, Printer, Briefcase, Phone as PhoneIcon, Car, Home } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageCropDialog from "@/components/ImageCropDialog";
import {
  DIVISIONS, DIVISIONS_BN, DISTRICTS, DISTRICTS_BN, THANAS, THANAS_BN,
} from "@/data/bangladeshAddress";

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

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["my-tenant-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const isFormLoaded = useRef(false);

  // Populate form once tenant data loads
  if (tenant && !isFormLoaded.current) {
    setForm({
      full_name: tenant.full_name || "",
      phone: tenant.phone || "",
      secondary_phone: tenant.secondary_phone || "",
      date_of_birth: tenant.date_of_birth || "",
      gender: (tenant as any).gender || "",
      occupation: (tenant as any).occupation || "",
      nid: tenant.nid || "",
      doc_type: (tenant as any).doc_type || "",
      doc_number: (tenant as any).doc_number || "",
      doc_front_url: (tenant as any).doc_front_url || "",
      doc_back_url: (tenant as any).doc_back_url || "",
      present_division: (tenant as any).present_division || "",
      present_district: (tenant as any).present_district || "",
      present_thana: (tenant as any).present_thana || "",
      present_village: (tenant as any).present_village || "",
      present_address: (tenant as any).present_address || "",
      permanent_division: tenant.permanent_division || "",
      permanent_district: tenant.permanent_district || "",
      permanent_thana: tenant.permanent_thana || "",
      permanent_village: tenant.permanent_village || "",
      permanent_address: tenant.permanent_address || "",
      emergency_contact: tenant.emergency_contact || "",
    });
    isFormLoaded.current = true;
  }

  const updateField = (key: string, value: string) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Reset cascading address fields
      if (key === "present_division") {
        updated.present_district = "";
        updated.present_thana = "";
      } else if (key === "present_district") {
        updated.present_thana = "";
      } else if (key === "permanent_division") {
        updated.permanent_district = "";
        updated.permanent_thana = "";
      } else if (key === "permanent_district") {
        updated.permanent_thana = "";
      }
      return updated;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({
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
          present_division: form.present_division,
          present_district: form.present_district,
          present_thana: form.present_thana,
          present_village: form.present_village,
          present_address: form.present_address,
          permanent_division: form.permanent_division,
          permanent_district: form.permanent_district,
          permanent_thana: form.permanent_thana,
          permanent_village: form.permanent_village,
          permanent_address: form.permanent_address,
          emergency_contact: form.emergency_contact,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenant-profile"] });
      toast.success(t("tenant.updated"));
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

  const presentDistricts = form.present_division ? DISTRICTS[form.present_division] || [] : [];
  const presentThanas = form.present_district ? THANAS[form.present_district] || [] : [];
  const permDistricts = form.permanent_division ? DISTRICTS[form.permanent_division] || [] : [];
  const permThanas = form.permanent_district ? THANAS[form.permanent_district] || [] : [];

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
                <Label>{t("tenant.emergency")}</Label>
                <Input value={form.emergency_contact || ""} onChange={(e) => updateField("emergency_contact", e.target.value)} />
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
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{language === "bn" ? "বর্তমান ঠিকানা" : "Present Address"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderAddressSelect(t("tenant.division"), form.present_division || "", (v) => updateField("present_division", v), DIVISIONS, DIVISIONS_BN, t("tenant.select_division"))}
              {renderAddressSelect(t("tenant.district"), form.present_district || "", (v) => updateField("present_district", v), presentDistricts, DISTRICTS_BN, t("tenant.select_district"))}
              {renderAddressSelect(t("tenant.thana"), form.present_thana || "", (v) => updateField("present_thana", v), presentThanas, THANAS_BN, t("tenant.select_thana"))}
              <div className="space-y-1.5">
                <Label>{t("tenant.village")}</Label>
                <Input value={form.present_village || ""} onChange={(e) => updateField("present_village", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("tenant.address_detail")}</Label>
                <Textarea value={form.present_address || ""} onChange={(e) => updateField("present_address", e.target.value)} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permanent Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />{t("tenant.permanent_address_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderAddressSelect(t("tenant.division"), form.permanent_division || "", (v) => updateField("permanent_division", v), DIVISIONS, DIVISIONS_BN, t("tenant.select_division"))}
              {renderAddressSelect(t("tenant.district"), form.permanent_district || "", (v) => updateField("permanent_district", v), permDistricts, DISTRICTS_BN, t("tenant.select_district"))}
              {renderAddressSelect(t("tenant.thana"), form.permanent_thana || "", (v) => updateField("permanent_thana", v), permThanas, THANAS_BN, t("tenant.select_thana"))}
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

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TenantProfile;
