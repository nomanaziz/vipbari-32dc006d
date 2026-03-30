import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Banknote } from "lucide-react";
import { toast } from "sonner";

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

const STATUSES = [
  { value: "pending", en: "Pending", bn: "অমীমাংসিত" },
  { value: "in_progress", en: "In Progress", bn: "প্রক্রিয়াধীন" },
  { value: "resolved", en: "Resolved", bn: "সমাধান হয়েছে" },
];

const CATEGORY_TO_EXPENSE: Record<string, string> = {
  plumbing: "plumbing",
  electrical: "repair",
  maintenance: "maintenance",
  cleaning: "cleaning",
  security: "security",
  lift: "maintenance",
  gas: "repair",
  water: "maintenance",
  parking: "maintenance",
  noise: "other_expense",
  internet: "repair",
  pest_control: "maintenance",
  structural: "repair",
  other: "other_expense",
};

const Complaints = () => {
  const { language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [resolveCost, setResolveCost] = useState("");
  const [resolveDesc, setResolveDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["landlord-complaints", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, tenants!inner(full_name, phone, room_id, owner_id, user_id, rooms(room_number))")
        .eq("owner_id", effectiveOwnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch expense records linked to complaints via description matching
  const { data: expenseRecords } = useQuery({
    queryKey: ["complaint-expenses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_entries")
        .select("*")
        .eq("owner_id", effectiveOwnerId!)
        .eq("type", "expense")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlord-complaints"] });
      toast.success(language === "bn" ? "স্ট্যাটাস আপডেট হয়েছে" : "Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleStatusChange = (newStatus: string, complaint: any) => {
    if (newStatus === "resolved") {
      const tenantName = (complaint.tenants as any)?.full_name || "";
      const roomNumber = (complaint.tenants as any)?.rooms?.room_number || "";
      setResolveTarget(complaint);
      setResolveCost("");
      setResolveDesc(
        `${complaint.title} — ${getCategoryLabel(complaint.category)}` +
        (tenantName ? ` | ${tenantName}` : "") +
        (roomNumber ? ` | ${language === "bn" ? "ফ্ল্যাট" : "Flat"}: ${roomNumber}` : "")
      );
    } else {
      updateStatusMutation.mutate({ id: complaint.id, status: newStatus });
    }
  };

  const handleResolve = async (withExpense: boolean) => {
    if (!resolveTarget || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("complaints").update({ status: "resolved" }).eq("id", resolveTarget.id);
      if (error) throw error;

      const amount = parseFloat(resolveCost) || 0;
      if (withExpense && amount > 0) {
        const { error: expErr } = await supabase.from("accounting_entries").insert({
          owner_id: user.id,
          type: "expense",
          category: CATEGORY_TO_EXPENSE[resolveTarget.category] || "other_expense",
          amount,
          description: resolveDesc || resolveTarget.title,
          entry_date: new Date().toISOString().split("T")[0],
        });
        if (expErr) throw expErr;
        toast.success(language === "bn" ? "সমাধান + খরচ সংরক্ষিত" : "Resolved + expense saved");
        queryClient.invalidateQueries({ queryKey: ["complaint-expenses"] });
      } else {
        toast.success(language === "bn" ? "সমাধান হয়েছে" : "Resolved");
      }

      queryClient.invalidateQueries({ queryKey: ["landlord-complaints"] });
      setResolveTarget(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (val: string) => {
    const c = CATEGORIES.find(c => c.value === val);
    return c ? (language === "bn" ? c.bn : c.en) : val;
  };

  const priorityBadge = (priority: string) => {
    const p = PRIORITIES.find(p => p.value === priority);
    const label = p ? (language === "bn" ? p.bn : p.en) : priority;
    if (priority === "urgent") return <Badge className="bg-red-500/10 text-red-600 border-red-200">{label}</Badge>;
    if (priority === "high") return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">{label}</Badge>;
    if (priority === "low") return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">{label}</Badge>;
    return <Badge variant="outline">{label}</Badge>;
  };

  const statusBadge = (status: string) => {
    const s = STATUSES.find(s => s.value === status);
    const label = s ? (language === "bn" ? s.bn : s.en) : status;
    if (status === "pending") return <Badge className="bg-red-500/15 text-red-600 border-red-300">{label}</Badge>;
    if (status === "in_progress") return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">{label}</Badge>;
    if (status === "resolved") return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-300">{label}</Badge>;
    return <Badge variant="outline">{label}</Badge>;
  };

  // Find expense record for a complaint by matching description containing the title
  const findExpenseForComplaint = (complaint: any) => {
    if (!expenseRecords) return null;
    return expenseRecords.find((e: any) => e.description?.includes(complaint.title));
  };

  const filtered = statusFilter === "all" ? complaints : complaints?.filter((c: any) => c.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{language === "bn" ? "অভিযোগ ব্যবস্থাপনা" : "Complaint Management"}</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === "bn" ? "সব" : "All"}</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{language === "bn" ? s.bn : s.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p>{language === "bn" ? "কোনো অভিযোগ নেই" : "No complaints found"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const expense = findExpenseForComplaint(c);
            const tenantName = (c.tenants as any)?.full_name || "—";
            const roomNumber = (c.tenants as any)?.rooms?.room_number || "—";

            return (
              <Card key={c.id} className={
                c.status === "pending" ? "border-l-4 border-l-red-400" :
                c.status === "in_progress" ? "border-l-4 border-l-yellow-400" :
                c.status === "resolved" ? "border-l-4 border-l-emerald-400" : ""
              }>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{c.title}</p>
                        {statusBadge(c.status)}
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="font-medium text-foreground">{tenantName}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{language === "bn" ? "ফ্ল্যাট" : "Flat"}: {roomNumber}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{getCategoryLabel(c.category)}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      {c.description && <p className="text-sm mt-1 text-muted-foreground">{c.description}</p>}

                      {/* Expense tracking record */}
                      {expense && (
                        <div className="mt-2 flex items-center gap-2 text-xs bg-muted/50 rounded-md px-3 py-1.5">
                          <Banknote className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="text-muted-foreground">
                            {language === "bn" ? "খরচ:" : "Cost:"}{" "}
                            <span className="font-semibold text-foreground">৳{Number(expense.amount).toLocaleString()}</span>
                            {" · "}
                            {tenantName} · {language === "bn" ? "ফ্ল্যাট" : "Flat"}: {roomNumber}
                            {" · "}
                            {new Date(expense.entry_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {priorityBadge(c.priority || "medium")}
                      {c.status === "resolved" ? (
                        statusBadge(c.status)
                      ) : (
                        <Select
                          value={c.status}
                          onValueChange={(v) => handleStatusChange(v, c)}
                        >
                          <SelectTrigger className={`w-[140px] h-8 text-xs ${
                            c.status === "pending" ? "border-red-300 text-red-600" :
                            c.status === "in_progress" ? "border-yellow-300 text-yellow-700" : ""
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value}>{language === "bn" ? s.bn : s.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolve Cost Dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "সমাধানের খরচ" : "Resolution Cost"}</DialogTitle>
            <DialogDescription>
              {resolveTarget && (
                <>
                  <span className="font-medium">{(resolveTarget.tenants as any)?.full_name}</span>
                  {" · "}
                  {language === "bn" ? "ফ্ল্যাট" : "Flat"}: {(resolveTarget.tenants as any)?.rooms?.room_number || "—"}
                  {" — "}
                  {language === "bn" ? "এই সমস্যা সমাধানে কত টাকা খরচ হয়েছে?" : "How much did it cost to resolve?"}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "bn" ? "খরচের পরিমাণ (৳)" : "Amount (৳)"}</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={resolveCost}
                onChange={(e) => setResolveCost(e.target.value)}
              />
            </div>
            <div>
              <Label>{language === "bn" ? "বিবরণ" : "Description"}</Label>
              <Textarea
                value={resolveDesc}
                onChange={(e) => setResolveDesc(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={saving} onClick={() => handleResolve(false)}>
              {language === "bn" ? "খরচ ছাড়া সমাধান" : "Skip & Resolve"}
            </Button>
            <Button disabled={saving} onClick={() => handleResolve(true)}>
              {language === "bn" ? "খরচসহ সংরক্ষণ" : "Save with Cost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ComplaintsPage = () => (
  <PermissionGuard permission="manage_complaints">
    <Complaints />
  </PermissionGuard>
);

export default ComplaintsPage;
