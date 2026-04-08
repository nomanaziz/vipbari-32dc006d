import { useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, UserPlus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const RELATION_OPTIONS = [
  { value: "Husband", en: "Husband", bn: "স্বামী" },
  { value: "Wife", en: "Wife", bn: "স্ত্রী" },
  { value: "Son", en: "Son", bn: "ছেলে" },
  { value: "Daughter", en: "Daughter", bn: "মেয়ে" },
  { value: "Father", en: "Father", bn: "বাবা" },
  { value: "Mother", en: "Mother", bn: "মা" },
  { value: "Brother", en: "Brother", bn: "ভাই" },
  { value: "Sister", en: "Sister", bn: "বোন" },
  { value: "Grandfather", en: "Grandfather", bn: "দাদা/নানা" },
  { value: "Grandmother", en: "Grandmother", bn: "দাদী/নানী" },
  { value: "Uncle", en: "Uncle", bn: "চাচা/মামা" },
  { value: "Aunt", en: "Aunt", bn: "চাচী/খালা" },
  { value: "Nephew", en: "Nephew", bn: "ভাতিজা/ভাগ্নে" },
  { value: "Niece", en: "Niece", bn: "ভাতিজি/ভাগ্নি" },
  { value: "Cousin", en: "Cousin", bn: "চাচাতো/মামাতো ভাই/বোন" },
  { value: "Father-in-law", en: "Father-in-law", bn: "শ্বশুর" },
  { value: "Mother-in-law", en: "Mother-in-law", bn: "শাশুড়ি" },
  { value: "Brother-in-law", en: "Brother-in-law", bn: "দেবর/ভাসুর" },
  { value: "Sister-in-law", en: "Sister-in-law", bn: "ননদ/জা" },
  { value: "Relative", en: "Relative", bn: "আত্মীয়" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

interface Props {
  tenant: any;
  onClose: () => void;
}

const emptyMember = { name: "", relation: "", phone: "", nid: "" };

const FamilyMembersDialog = ({ tenant, onClose }: Props) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyMember);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["tenant-members", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const addMutation = useMutation({
    mutationFn: async (values: typeof emptyMember) => {
      const { error } = await supabase.from("tenant_members").insert({
        tenant_id: tenant.id,
        name: values.name,
        relation: values.relation,
        phone: values.phone || "",
        nid: values.nid || "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-members", tenant?.id] });
      setForm(emptyMember);
      setShowForm(false);
      toast.success(t("tenant.member_added") || "Member added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-members", tenant?.id] });
      toast.success(t("tenant.member_deleted") || "Member deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tenant_members").update({
        status,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-members", tenant?.id] });
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-member-counts"] });
      toast.success(language === "bn" ? "আপডেট হয়েছে" : "Updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMutation.mutate(form);
  };

  const getRelationLabel = (value: string) => {
    const opt = RELATION_OPTIONS.find(o => o.value === value);
    if (!opt) return value;
    return language === "bn" ? opt.bn : opt.en;
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{language === "bn" ? "অনুমোদিত" : "Approved"}</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />{language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}</Badge>;
    return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{language === "bn" ? "অনুমোদনের অপেক্ষায়" : "Pending Approval"}</Badge>;
  };

  return (
    <Dialog open={!!tenant} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{language === "bn" ? "পরিবারের সদস্য" : "Family Members"} — {tenant?.full_name}</DialogTitle>
          {members && members.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {language === "bn" ? "মোট সদস্য" : "Total members"}: {members.length} | {language === "bn" ? "অনুমোদিত" : "Approved"}: {members.filter((m: any) => m.status === "approved").length}
            </p>
          )}
        </DialogHeader>

        {/* Members list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : members?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No family members added yet.</p>
          ) : (
            members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{m.name}</p>
                    {getStatusBadge(m.status || "pending")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getRelationLabel(m.relation)}{m.phone ? ` · ${m.phone}` : ""}{m.nid ? ` · NID: ${m.nid}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  {(m.status === "pending" || !m.status) && (
                     <>
                       <Button variant="outline" size="sm" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => verifyMutation.mutate({ id: m.id, status: "approved" })}>
                         <CheckCircle2 className="h-3 w-3 mr-1" />{language === "bn" ? "অনুমোদন" : "Approve"}
                       </Button>
                       <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => verifyMutation.mutate({ id: m.id, status: "rejected" })}>
                         <XCircle className="h-3 w-3 mr-1" />{language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                       </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add member form */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("tenant.member_name")}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tenant.relation")}</Label>
                <Select value={form.relation} onValueChange={(value) => setForm(f => ({ ...f, relation: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "bn" ? "সম্পর্ক নির্বাচন করুন" : "Select relation"} />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {language === "bn" ? opt.bn : opt.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("tenant.phone")}</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tenant.nid")}</Label>
                <Input value={form.nid} onChange={e => setForm(f => ({ ...f, nid: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              <Button type="submit" size="sm" disabled={addMutation.isPending}>{t("common.save")}</Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4" />
            {t("tenant.add_member")}
          </Button>
        )}
        <DeleteConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
          isPending={deleteMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FamilyMembersDialog;
