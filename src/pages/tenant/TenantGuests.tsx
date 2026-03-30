import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { GuestQRCard } from "@/components/guests/GuestQRCard";


const emptyForm = { guest_name: "", phone: "", visit_date: new Date().toISOString().split("T")[0], duration_days: "1", notes: "", visitor_type: "guest", expires_at: "" };

const TenantGuests = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: guests, isLoading } = useQuery({
    queryKey: ["tenant-guests", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof emptyForm) => {
      const payload: any = {
        tenant_id: tenant!.id,
        guest_name: values.guest_name,
        phone: values.phone,
        visit_date: values.visit_date,
        duration_days: parseInt(values.duration_days) || 1,
        notes: values.notes || null,
        visitor_type: values.visitor_type || "guest",
        expires_at: values.expires_at || null,
      };
      if (editingId) {
        const { error } = await supabase.from("guests").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-guests", tenant?.id] });
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      toast.success(editingId ? t("tenant.guest_updated") : t("tenant.guest_added"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-guests", tenant?.id] });
      toast.success(t("common.delete"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-guests", tenant?.id] });
      toast.success(language === "bn" ? "অতিথি নিষ্ক্রিয় করা হয়েছে" : "Guest deactivated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 1);
      const { error } = await supabase.from("guests").update({ status: "approved", expires_at: newExpiry.toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-guests", tenant?.id] });
      toast.success(language === "bn" ? "অতিথি পুনরায় সক্রিয় করা হয়েছে" : "Guest reactivated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateQR = useMutation({
    mutationFn: async (id: string) => {
      const qrCode = crypto.randomUUID();
      const { error } = await supabase.from("guests").update({ qr_code: qrCode }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-guests", tenant?.id] });
      toast.success(language === "bn" ? "QR কোড তৈরি হয়েছে" : "QR code generated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleEdit = (g: any) => {
    setForm({
      guest_name: g.guest_name,
      phone: g.phone,
      visit_date: g.visit_date,
      duration_days: String(g.duration_days),
      notes: g.notes || "",
      visitor_type: g.visitor_type || "guest",
      expires_at: g.expires_at ? new Date(g.expires_at).toISOString().slice(0, 16) : "",
    });
    setEditingId(g.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guest_name.trim()) return;
    saveMutation.mutate(form);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Users className="h-10 w-10 opacity-40" />
        <p>{L("You are not assigned to any room yet. Please contact your landlord.", "আপনাকে এখনো কোনো রুমে অ্যাসাইন করা হয়নি। অনুগ্রহ করে আপনার বাড়িওয়ালার সাথে যোগাযোগ করুন।")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("tenant.guests")}</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t("tenant.add_guest")}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{editingId ? t("common.edit") : t("tenant.add_guest")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("tenant.guest_name")}</Label>
                  <Input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.phone")}</Label>
                  <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{L("Visitor Type", "ভিজিটর ধরন")}</Label>
                  <Select value={form.visitor_type} onValueChange={v => setForm(f => ({ ...f, visitor_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">{L("Guest", "অতিথি")}</SelectItem>
                      <SelectItem value="family">{L("Family", "পরিবার")}</SelectItem>
                      <SelectItem value="delivery">{L("Delivery", "ডেলিভারি")}</SelectItem>
                      <SelectItem value="worker">{L("Worker", "কর্মী")}</SelectItem>
                      <SelectItem value="other">{L("Other", "অন্যান্য")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.visit_date")}</Label>
                  <Input type="date" value={form.visit_date} onChange={e => {
                    const visitDate = e.target.value;
                    const days = parseInt(form.duration_days) || 1;
                    const expiry = new Date(visitDate);
                    expiry.setDate(expiry.getDate() + days);
                    setForm(f => ({ ...f, visit_date: visitDate, expires_at: expiry.toISOString().slice(0, 16) }));
                  }} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("tenant.duration_days")}</Label>
                  <Input type="number" min="1" value={form.duration_days} onChange={e => {
                    const days = parseInt(e.target.value) || 1;
                    const visitDate = form.visit_date || new Date().toISOString().split("T")[0];
                    const expiry = new Date(visitDate);
                    expiry.setDate(expiry.getDate() + days);
                    setForm(f => ({ ...f, duration_days: e.target.value, expires_at: expiry.toISOString().slice(0, 16) }));
                  }} />
                </div>
                <div className="space-y-1.5">
                  <Label>{L("Expires At", "মেয়াদ শেষ")}</Label>
                  <Input type="datetime-local" value={form.expires_at} onChange={e => {
                    const expiresAt = e.target.value;
                    if (expiresAt && form.visit_date) {
                      const diff = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - new Date(form.visit_date).getTime()) / (1000 * 60 * 60 * 24)));
                      setForm(f => ({ ...f, expires_at: expiresAt, duration_days: String(diff) }));
                    } else {
                      setForm(f => ({ ...f, expires_at: expiresAt }));
                    }
                  }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("tenant.guest_notes")}</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>{t("common.cancel")}</Button>
                <Button type="submit" disabled={saveMutation.isPending}>{t("common.save")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : !guests?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p>{L("No guest entries yet", "কোনো অতিথি যোগ করা হয়নি")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {guests.map((g: any) => (
            <GuestQRCard
              key={g.id}
              guest={g}
              language={language}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onGenerateQR={(id) => generateQR.mutate(id)}
              onDeactivate={(id) => deactivateMutation.mutate(id)}
              onReactivate={(id) => reactivateMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantGuests;
