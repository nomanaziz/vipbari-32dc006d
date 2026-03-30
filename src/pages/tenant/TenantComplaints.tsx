import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  { value: "lift", en: "Lift / Elevator", bn: "লিফট" },
  { value: "plumbing", en: "Plumbing", bn: "প্লাম্বিং" },
  { value: "electrical", en: "Electrical", bn: "ইলেকট্রিক্যাল" },
  { value: "gas", en: "Gas", bn: "গ্যাস" },
  { value: "water", en: "Water Supply", bn: "পানি সরবরাহ" },
  { value: "parking", en: "Parking", bn: "পার্কিং" },
  { value: "cleaning", en: "Cleaning", bn: "পরিষ্কার-পরিচ্ছন্নতা" },
  { value: "security", en: "Security", bn: "নিরাপত্তা" },
  { value: "noise", en: "Noise / Neighbor Issues", bn: "শব্দ / প্রতিবেশী সমস্যা" },
  { value: "internet", en: "Internet / Cable", bn: "ইন্টারনেট / ক্যাবল" },
  { value: "pest_control", en: "Pest Control", bn: "কীটপতঙ্গ নিয়ন্ত্রণ" },
  { value: "structural", en: "Structural / Wall / Ceiling", bn: "কাঠামোগত / দেয়াল / ছাদ" },
  { value: "maintenance", en: "General Maintenance", bn: "সাধারণ রক্ষণাবেক্ষণ" },
  { value: "other", en: "Other", bn: "অন্যান্য" },
];

const PRIORITIES = [
  { value: "low", en: "Low", bn: "কম" },
  { value: "medium", en: "Medium", bn: "মাঝারি" },
  { value: "high", en: "High", bn: "উচ্চ" },
  { value: "urgent", en: "Urgent", bn: "জরুরি" },
];

const emptyForm = { title: "", description: "", category: "other", priority: "medium" };

const TenantComplaints = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, owner_id, room_id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: acceptedRequest } = useQuery({
    queryKey: ["tenant-accepted-request-for-complaints", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tolet_requests")
        .select("landlord_user_id, room_id")
        .eq("tenant_user_id", user!.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const { data: complaints, isLoading } = useQuery({
    queryKey: ["tenant-complaints", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tenant-complaints", tenant?.id] });

  const addMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const effectiveOwnerId = (tenant!.owner_id === user!.id && acceptedRequest?.landlord_user_id)
        ? acceptedRequest.landlord_user_id
        : tenant!.owner_id;
      const { error } = await supabase.from("complaints").insert({
        tenant_id: tenant!.id,
        owner_id: effectiveOwnerId,
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
      toast.success(t("tenant.complaint_submitted"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: typeof emptyForm }) => {
      const { error } = await supabase.from("complaints").update({
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
      toast.success(language === "bn" ? "অভিযোগ আপডেট হয়েছে" : "Complaint updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("complaints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast.success(language === "bn" ? "অভিযোগ মুছে ফেলা হয়েছে" : "Complaint deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ title: c.title || "", description: c.description || "", category: c.category || "other", priority: c.priority || "medium" });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, values: form });
    } else {
      addMutation.mutate(form);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "resolved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{t("tenant.status_resolved")}</Badge>;
    if (status === "in_progress") return <Badge variant="secondary">{t("tenant.status_in_progress")}</Badge>;
    return <Badge variant="destructive">{t("tenant.status_pending")}</Badge>;
  };

  const priorityBadge = (priority: string) => {
    const p = PRIORITIES.find(p => p.value === priority);
    const label = p ? (language === "bn" ? p.bn : p.en) : priority;
    if (priority === "urgent") return <Badge className="bg-red-500/10 text-red-600 border-red-200">{label}</Badge>;
    if (priority === "high") return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">{label}</Badge>;
    if (priority === "low") return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">{label}</Badge>;
    return <Badge variant="outline">{label}</Badge>;
  };

  const getCategoryLabel = (val: string) => {
    const c = CATEGORIES.find(c => c.value === val);
    return c ? (language === "bn" ? c.bn : c.en) : val;
  };

  const { data: room } = useQuery({
    queryKey: ["my-room", tenant?.room_id],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("room_number").eq("id", tenant!.room_id!).maybeSingle();
      return data;
    },
    enabled: !!tenant?.room_id,
  });

  const isUnlinked = tenant && tenant.owner_id === user?.id && !acceptedRequest;

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <AlertTriangle className="h-10 w-10 opacity-40" />
        <p>{language === "bn" ? "আপনাকে এখনো কোনো রুমে অ্যাসাইন করা হয়নি। অনুগ্রহ করে আপনার বাড়িওয়ালার সাথে যোগাযোগ করুন।" : "You are not assigned to any room yet. Please contact your landlord."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isUnlinked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {language === "bn"
              ? "আপনার অ্যাকাউন্ট এখনো কোনো বাড়িওয়ালার সাথে লিংক হয়নি। তবুও আপনি অভিযোগ জমা দিতে পারবেন। লিংক হওয়ার পর বাড়িওয়ালা এটি দেখতে পারবেন।"
              : "Your account is not linked to a landlord yet. You can still submit complaints, and your landlord will be able to see them after your account is linked."}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("tenant.complaints")}</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else { setEditingId(null); setForm(emptyForm); setDialogOpen(true); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("tenant.add_complaint")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? (language === "bn" ? "অভিযোগ সম্পাদনা" : "Edit Complaint") : t("tenant.add_complaint")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {room && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "ফ্ল্যাট/রুম" : "Flat/Room"}: <span className="font-medium text-foreground">{room.room_number}</span></p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{t("tenant.complaint_title")}</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("tenant.complaint_category")}</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{language === "bn" ? c.bn : c.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{language === "bn" ? "অগ্রাধিকার" : "Priority"}</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{language === "bn" ? p.bn : p.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tenant.complaint_desc")}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
                <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                  {editingId ? (language === "bn" ? "আপডেট" : "Update") : t("common.save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : !complaints?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p>{language === "bn" ? "কোনো অভিযোগ নেই" : "No complaints yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold">{c.title}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="text-muted-foreground">{getCategoryLabel(c.category)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    {c.description && <p className="text-sm mt-1">{c.description}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {statusBadge(c.status)}
                    {priorityBadge(c.priority || "medium")}
                    {c.status === "pending" && (
                      <div className="flex gap-1 mt-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "bn" ? "অভিযোগ মুছে ফেলবেন?" : "Delete Complaint?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "bn" ? "এই অভিযোগটি স্থায়ীভাবে মুছে ফেলা হবে।" : "This complaint will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {language === "bn" ? "মুছুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TenantComplaints;
