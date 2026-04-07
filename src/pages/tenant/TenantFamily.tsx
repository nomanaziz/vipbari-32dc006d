import { useState, useRef } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, UserPlus, Users, Edit2, X, Clock, CheckCircle2, XCircle, Upload, Loader2, Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const RELATION_OPTIONS = [
  { value: "Husband", en: "Husband", bn: "স্বামী" },
  { value: "Wife", en: "Wife", bn: "স্ত্রী" },
  { value: "Son", en: "Son", bn: "ছেলে" },
  { value: "Daughter", en: "Daughter", bn: "মেয়ে" },
  { value: "Father", en: "Father", bn: "বাবা" },
  { value: "Mother", en: "Mother", bn: "মা" },
  { value: "Brother", en: "Brother", bn: "ভাই" },
  { value: "Sister", en: "Sister", bn: "বোন" },
  { value: "Relative", en: "Relative", bn: "আত্মীয়" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const GENDER_OPTIONS = [
  { value: "male", en: "Male", bn: "পুরুষ" },
  { value: "female", en: "Female", bn: "মহিলা" },
  { value: "other", en: "Other", bn: "অন্যান্য" },
];

const emptyForm = { name: "", relation: "", phone: "", nid: "", occupation: "", age: "", gender: "", doc_url: "", photo_url: "" };

const TenantFamily = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const docCamRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const photoCamRef = useRef<HTMLInputElement>(null);

  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["tenant-members", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const uploadDoc = async (file: File) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/member-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("tenant-documents")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("tenant-documents").getPublicUrl(path);
      setForm((f) => ({ ...f, doc_url: urlData.publicUrl }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      const maxW = 300;
      const scale = Math.min(maxW / img.width, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8));
      const path = `${user.id}/member-photo-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("tenant-documents").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("tenant-documents").getPublicUrl(path);
      setForm((f) => ({ ...f, photo_url: urlData.publicUrl }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const payload: any = {
        tenant_id: tenant!.id,
        name: values.name,
        relation: values.relation,
        phone: values.phone || "",
        nid: values.nid || "",
        occupation: values.occupation || "",
        age: values.age ? parseInt(values.age) : null,
        gender: values.gender || "",
        doc_url: values.doc_url || "",
        photo_url: values.photo_url || "",
      };
      if (editingId) {
        const { error } = await supabase.from("tenant_members").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tenant_members").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-members", tenant?.id] });
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      toast.success(editingId ? t("tenant.updated") : t("tenant.member_added"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-members", tenant?.id] });
      toast.success(t("tenant.member_deleted"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleEdit = (m: any) => {
    setForm({
      name: m.name,
      relation: m.relation,
      phone: m.phone || "",
      nid: m.nid || "",
      occupation: m.occupation || "",
      age: m.age ? String(m.age) : "",
      gender: m.gender || "",
      doc_url: m.doc_url || "",
      photo_url: m.photo_url || "",
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMutation.mutate(form);
  };

  const getRelationLabel = (value: string) => {
    const opt = RELATION_OPTIONS.find((o) => o.value === value);
    if (!opt) return value;
    return language === "bn" ? opt.bn : opt.en;
  };

  const getGenderLabel = (value: string) => {
    const opt = GENDER_OPTIONS.find((o) => o.value === value);
    if (!opt) return value;
    return language === "bn" ? opt.bn : opt.en;
  };

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Users className="h-10 w-10 opacity-40" />
        <p>{language === "bn" ? "আপনার টেনান্ট রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে লগ আউট করে আবার লগ ইন করুন অথবা সাপোর্টে যোগাযোগ করুন।" : "Your tenant record was not found. Please log out and log back in, or contact support."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("tenant.family_members")}</h1>
        {!showForm && (
          <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t("tenant.add_member")}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{editingId ? t("common.edit") : t("tenant.add_member")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {form.photo_url && <AvatarImage src={form.photo_url} alt={form.name} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                      {form.name?.charAt(0)?.toUpperCase() || <Camera className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => photoCamRef.current?.click()} disabled={uploading}>
                    <Camera className="h-4 w-4 mr-1" />
                    {language === "bn" ? "ক্যামেরা" : "Camera"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => photoRef.current?.click()} disabled={uploading}>
                    <ImagePlus className="h-4 w-4 mr-1" />
                    {language === "bn" ? "গ্যালারি" : "Gallery"}
                  </Button>
                </div>
                <input ref={photoCamRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("tenant.member_name")}</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.relation")}</Label>
                  <Select value={form.relation} onValueChange={(v) => setForm((f) => ({ ...f, relation: v }))}>
                    <SelectTrigger><SelectValue placeholder={language === "bn" ? "সম্পর্ক নির্বাচন" : "Select relation"} /></SelectTrigger>
                    <SelectContent>
                      {RELATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{language === "bn" ? o.bn : o.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{language === "bn" ? "বয়স" : "Age"}</Label>
                  <Input type="number" min="0" max="150" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{language === "bn" ? "লিঙ্গ" : "Gender"}</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{language === "bn" ? g.bn : g.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.phone")}</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.nid")}</Label>
                  <Input value={form.nid} onChange={(e) => setForm((f) => ({ ...f, nid: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{language === "bn" ? "পেশা" : "Occupation"}</Label>
                  <Input value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{language === "bn" ? "ডকুমেন্ট (NID/জন্ম সনদ)" : "Document (NID/Birth Cert)"}</Label>
                  <div className="flex items-center gap-2">
                    {form.doc_url ? (
                      <div className="relative w-20 h-14 rounded border overflow-hidden group">
                        <img src={form.doc_url} alt="Doc" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setForm((f) => ({ ...f, doc_url: "" }))} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => docRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                        {language === "bn" ? "আপলোড" : "Upload"}
                      </Button>
                    )}
                    <input ref={docRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0])} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>{t("common.cancel")}</Button>
                <Button type="submit" disabled={addMutation.isPending}>{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : !members?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p>{language === "bn" ? "কোনো পরিবারের সদস্য যোগ করা হয়নি" : "No family members added yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {m.photo_url && <AvatarImage src={m.photo_url} alt={m.name} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                      {m.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{m.name}</p>
                      {m.status === "approved" ? (
                        <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{t("tenant.approved")}</Badge>
                      ) : m.status === "rejected" ? (
                        <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />{t("tenant.rejected")}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{t("tenant.pending_approval")}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getRelationLabel(m.relation)}
                      {m.age ? ` · ${language === "bn" ? "বয়স" : "Age"}: ${m.age}` : ""}
                      {m.gender ? ` · ${getGenderLabel(m.gender)}` : ""}
                      {m.phone ? ` · ${m.phone}` : ""}
                      {m.nid ? ` · NID: ${m.nid}` : ""}
                      {m.occupation ? ` · ${m.occupation}` : ""}
                    </p>
                    {m.doc_url && (
                      <a href={m.doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                        {language === "bn" ? "ডকুমেন্ট দেখুন" : "View Document"}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {m.status !== "approved" && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(m)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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

export default TenantFamily;
