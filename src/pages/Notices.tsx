import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
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
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, Paperclip, Megaphone, Pin, Calendar, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

const Notices = () => {
  const { language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_type: "all", target_id: "", is_pinned: false });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const { data: notices, isLoading } = useQuery({
    queryKey: ["landlord-notices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("owner_id", effectiveOwnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: properties } = useQuery({
    queryKey: ["my-properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tenants } = useQuery({
    queryKey: ["my-tenants-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, full_name, user_id");
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase.from("notices").insert({
        owner_id: effectiveOwnerId!,
        title: values.title,
        description: values.description,
        target_type: values.target_type,
        target_id: values.target_type === "all" ? null : values.target_id || null,
        is_pinned: values.is_pinned,
      });
      if (error) throw error;

      let targetTenants: { user_id: string | null }[] = [];
      if (values.target_type === "all") {
        targetTenants = tenants || [];
      } else if (values.target_type === "property" && values.target_id) {
        const { data } = await supabase
          .from("rooms")
          .select("tenant_id")
          .eq("property_id", values.target_id)
          .not("tenant_id", "is", null);
        if (data) {
          const tenantIds = data.map((r: any) => r.tenant_id);
          const { data: tList } = await supabase.from("tenants").select("user_id").in("id", tenantIds);
          targetTenants = tList || [];
        }
      } else if (values.target_type === "tenant" && values.target_id) {
        const t = tenants?.find((t: any) => t.id === values.target_id);
        if (t) targetTenants = [{ user_id: t.user_id }];
      }

      const notifs = targetTenants
        .filter((t: any) => t.user_id)
        .map((t: any) => ({
          user_id: t.user_id,
          title: language === "bn" ? "নতুন নোটিশ" : "New Notice",
          body: values.title,
          type: "new_notice",
        }));

      if (notifs.length) {
        await supabase.from("notifications").insert(notifs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-notices"] });
      setForm({ title: "", description: "", target_type: "all", target_id: "", is_pinned: false });
      setDialogOpen(false);
      setEditingId(null);
      toast.success(editingId ? L("Notice updated", "নোটিশ আপডেট হয়েছে") : L("Notice created", "নোটিশ তৈরি হয়েছে"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: typeof form }) => {
      const { error } = await supabase.from("notices").update({
        title: values.title,
        description: values.description,
        target_type: values.target_type,
        target_id: values.target_type === "all" ? null : values.target_id || null,
        is_pinned: values.is_pinned,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-notices"] });
      setForm({ title: "", description: "", target_type: "all", target_id: "", is_pinned: false });
      setDialogOpen(false);
      setEditingId(null);
      toast.success(L("Notice updated", "নোটিশ আপডেট হয়েছে"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-notices"] });
      toast.success(L("Notice deleted", "নোটিশ মুছে ফেলা হয়েছে"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, values: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (n: any) => {
    setForm({
      title: n.title || "",
      description: n.description || "",
      target_type: n.target_type || "all",
      target_id: n.target_id || "",
      is_pinned: n.is_pinned || false,
    });
    setEditingId(n.id);
    setDialogOpen(true);
  };

  const targetLabel = (type: string, targetId: string | null) => {
    if (type === "all") return L("Global", "সবার জন্য");
    if (type === "property") {
      const p = properties?.find((p: any) => p.id === targetId);
      return p ? p.name : L("Property", "প্রপার্টি");
    }
    if (type === "tenant") {
      const t = tenants?.find((t: any) => t.id === targetId);
      return t ? t.full_name : L("Tenant", "ভাড়াটিয়া");
    }
    return type;
  };

  const targetColor = (type: string) => {
    if (type === "all") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (type === "property") return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (type === "tenant") return "bg-purple-500/10 text-purple-600 border-purple-200";
    return "bg-muted text-muted-foreground";
  };

  const pinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("notices").update({ is_pinned: pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-notices"] });
    },
  });

  const pinnedNotices = notices?.filter((n: any) => n.is_pinned) || [];
  const unpinnedNotices = notices?.filter((n: any) => !n.is_pinned) || [];

  const NoticeCard = ({ n, index, isPinned = false }: { n: any; index?: number; isPinned?: boolean }) => {
    const isExpanded = expandedId === n.id;
    return (
      <Card className={`group relative overflow-hidden hover:shadow-lg transition-all duration-300 ${isPinned ? "border-primary/30 shadow-md" : ""}`}>
        {typeof index === "number" && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
            #{index + 1}
          </div>
        )}
        {isPinned && (
          <div className="absolute top-2 right-2">
            <Pin className="h-4 w-4 text-primary fill-primary" />
          </div>
        )}
        <CardContent className={`${isPinned ? "p-5" : "p-4"}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <h3 className={`font-semibold text-foreground ${isPinned ? "text-lg" : "text-sm"} line-clamp-2`}>
                {n.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {isPinned && (
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                    {L("Pinned", "পিন করা")}
                  </Badge>
                )}
                <Badge className={`text-xs ${targetColor(n.target_type)}`}>
                  {targetLabel(n.target_type, n.target_id)}
                </Badge>
              </div>
              {n.description && (
                <p className={`text-sm text-muted-foreground ${isExpanded ? "" : isPinned ? "line-clamp-3" : "line-clamp-2"}`}>
                  {n.description}
                </p>
              )}
              {n.attachment_url && (
                <a href={n.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {L("Attachment", "সংযুক্তি")}
                </a>
              )}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(n.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
                <div className="flex items-center gap-1">
                  {n.description && n.description.length > 100 && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary gap-1" onClick={() => setExpandedId(isExpanded ? null : n.id)}>
                      <Eye className="h-3 w-3" />
                      {isExpanded ? L("Show less", "সংক্ষেপে") : L("Read more", "বিস্তারিত দেখুন")}
                    </Button>
                  )}
                   <Button variant="ghost" size="icon" className={`h-7 w-7 transition-opacity ${n.is_pinned ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} onClick={() => pinMutation.mutate({ id: n.id, pinned: !n.is_pinned })} title={n.is_pinned ? L("Unpin", "আনপিন") : L("Pin", "পিন করুন")}>
                     <Pin className={`h-3.5 w-3.5 ${n.is_pinned ? "fill-primary" : ""}`} />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(n)}>
                     <Pencil className="h-3.5 w-3.5" />
                   </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(n.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            {L("Notice Board", "নোটিশ বোর্ড")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {L("All your important notices in one place", "আপনার সকল গুরুত্বপূর্ণ ঘোষণা এখানে দেখুন")}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm({ title: "", description: "", target_type: "all", target_id: "", is_pinned: false }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />{L("Create Notice", "নোটিশ তৈরি করুন")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? L("Edit Notice", "নোটিশ সম্পাদনা") : L("New Notice", "নতুন নোটিশ")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>{L("Title", "শিরোনাম")}</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>{L("Description", "বিবরণ")}</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>{L("Visibility", "দৃশ্যমানতা")}</Label>
                <Select value={form.target_type} onValueChange={v => setForm(f => ({ ...f, target_type: v, target_id: "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{L("Global (All Tenants)", "সবার জন্য (সকল ভাড়াটিয়া)")}</SelectItem>
                    <SelectItem value="property">{L("By Property", "প্রপার্টি ভিত্তিক")}</SelectItem>
                    <SelectItem value="tenant">{L("Individual Tenant", "নির্দিষ্ট ভাড়াটিয়া")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.target_type === "property" && (
                <div className="space-y-1.5">
                  <Label>{L("Select Property", "প্রপার্টি নির্বাচন করুন")}</Label>
                  <Select value={form.target_id} onValueChange={v => setForm(f => ({ ...f, target_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={L("Choose property", "প্রপার্টি বাছুন")} /></SelectTrigger>
                    <SelectContent>
                      {properties?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.target_type === "tenant" && (
                <div className="space-y-1.5">
                  <Label>{L("Select Tenant", "ভাড়াটিয়া নির্বাচন করুন")}</Label>
                  <Select value={form.target_id} onValueChange={v => setForm(f => ({ ...f, target_id: v }))}>
                    <SelectTrigger><SelectValue placeholder={L("Choose tenant", "ভাড়াটিয়া বাছুন")} /></SelectTrigger>
                    <SelectContent>
                      {tenants?.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_pinned" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="h-4 w-4 rounded border-primary text-primary" />
                <Label htmlFor="is_pinned" className="text-sm cursor-pointer">{L("Pin this notice (sticky)", "পিন করুন (স্টিকি)")}</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{L("Cancel", "বাতিল")}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? L("Update", "আপডেট করুন") : L("Create", "তৈরি করুন")}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</p>
      ) : !notices?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">{L("No notices yet", "কোনো নোটিশ নেই")}</p>
            <p className="text-sm">{L("Create your first notice to get started", "শুরু করতে আপনার প্রথম নোটিশ তৈরি করুন")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pinnedNotices.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {L("Pinned Notices", "পিন করা নোটিশ")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedNotices.map((n: any) => (
                  <NoticeCard key={n.id} n={n} isPinned />
                ))}
              </div>
            </div>
          )}

          {unpinnedNotices.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {L("All Notices", "সকল ঘোষণা")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unpinnedNotices.map((n: any, i: number) => (
                  <NoticeCard key={n.id} n={n} index={i} />
                ))}
              </div>
            </div>
          )}
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

const NoticesPage = () => (
  <PermissionGuard permission="manage_notices">
    <Notices />
  </PermissionGuard>
);

export default NoticesPage;
