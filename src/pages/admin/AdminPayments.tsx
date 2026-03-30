import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Trash2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const AdminPayments = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [rejectPayment, setRejectPayment] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, tenants(full_name), bills(month, owner_id, rooms(room_number))")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

  const acceptMutation = useMutation({
    mutationFn: async (payment: any) => {
      const { error } = await supabase.from("payments").update({
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        status: "accepted",
      }).eq("id", payment.id);
      if (error) throw error;

      const { data: bill } = await supabase.from("bills").select("received_amount, total_amount").eq("id", payment.bill_id).single();
      if (bill) {
        const newReceived = Number(bill.received_amount || 0) + Number(payment.amount);
        const newStatus = newReceived >= Number(bill.total_amount) ? "paid" : "partial";
        await supabase.from("bills").update({ received_amount: newReceived, status: newStatus }).eq("id", payment.bill_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success(t("admin.payment_verified"));
    },
    onError: () => toast.error(t("admin.payment_verify_error")),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: string; note: string }) => {
      const { error } = await supabase.from("payments").update({
        status: "rejected",
        rejection_note: note || null,
      } as any).eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      toast.success(language === "bn" ? "পেমেন্ট প্রত্যাখ্যাত" : "Payment rejected");
      setRejectPayment(null);
      setRejectionNote("");
    },
    onError: () => toast.error(language === "bn" ? "ত্রুটি হয়েছে" : "Error rejecting payment"),
  });

  const handleBulkDelete = async () => {
    for (const id of selectedIds) { await supabase.from("payments").delete().eq("id", id); }
    queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const statusBadge = (p: any) => {
    const s = p.status || (p.verified ? "accepted" : "pending");
    if (s === "accepted") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{language === "bn" ? "গৃহীত" : "Accepted"}</Badge>;
    if (s === "rejected") return <Badge variant="destructive">{language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}</Badge>;
    if (s === "cancelled") return <Badge variant="outline" className="text-muted-foreground">{language === "bn" ? "বাতিল" : "Cancelled"}</Badge>;
    return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200">{language === "bn" ? "অপেক্ষমাণ" : "Pending"}</Badge>;
  };

  const sq = search.toLowerCase();
  const filtered = payments?.filter((p: any) => {
    const s = p.status || (p.verified ? "accepted" : "pending");
    if (filter !== "all" && s !== filter) return false;
    if (!sq) return true;
    const owner = profileMap.get(p.bills?.owner_id || p.owner_id) || "";
    return [owner, p.tenants?.full_name, p.bills?.rooms?.room_number, p.bills?.month, p.payment_method].some(v => v?.toString().toLowerCase().includes(sq));
  });

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === (filtered?.length || 0) ? new Set() : new Set(filtered?.map((p: any) => p.id) || []));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.payments")}</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              {language === "bn" ? `নির্বাচিত মুছুন (${selectedIds.size})` : `Delete Selected (${selectedIds.size})`}
            </Button>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.all")}</SelectItem>
              <SelectItem value="pending">{language === "bn" ? "অপেক্ষমাণ" : "Pending"}</SelectItem>
              <SelectItem value="accepted">{language === "bn" ? "গৃহীত" : "Accepted"}</SelectItem>
              <SelectItem value="rejected">{language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={language === "bn" ? "খুঁজুন..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={filtered?.length ? selectedIds.size === filtered.length : false} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>{language === "bn" ? "মালিক" : "Owner"}</TableHead>
              <TableHead>{t("tenant.name")}</TableHead>
              <TableHead>{language === "bn" ? "ফ্ল্যাট" : "Flat"}</TableHead>
              <TableHead>{t("bill.month")}</TableHead>
              <TableHead>{t("bill.total")}</TableHead>
              <TableHead>{t("admin.payment_method")}</TableHead>
              <TableHead>{t("admin.payment_date")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : filtered?.map((payment: any) => {
              const isPending = (payment.status || (payment.verified ? "accepted" : "pending")) === "pending";
              return (
                <TableRow key={payment.id}>
                  <TableCell><Checkbox checked={selectedIds.has(payment.id)} onCheckedChange={() => toggleSelect(payment.id)} /></TableCell>
                  <TableCell>{profileMap.get(payment.bills?.owner_id || payment.owner_id) || "—"}</TableCell>
                  <TableCell className="font-medium">{payment.tenants?.full_name || "—"}</TableCell>
                  <TableCell>{payment.bills?.rooms?.room_number || "—"}</TableCell>
                  <TableCell>{payment.bills?.month || "—"}</TableCell>
                  <TableCell>৳{Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                  <TableCell className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell>{statusBadge(payment)}</TableCell>
                  <TableCell>
                    {isPending && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => acceptMutation.mutate(payment)} disabled={acceptMutation.isPending}>
                          <CheckCircle className="h-4 w-4 mr-1" />{language === "bn" ? "গ্রহণ" : "Accept"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejectPayment(payment)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-4 w-4 mr-1" />{language === "bn" ? "বাতিল" : "Reject"}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && !filtered?.length && (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{t("admin.no_payments")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectPayment} onOpenChange={(o) => { if (!o) { setRejectPayment(null); setRejectionNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "পেমেন্ট প্রত্যাখ্যান" : "Reject Payment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{language === "bn" ? "কারণ লিখুন (ঐচ্ছিক):" : "Enter reason (optional):"}</p>
            <Input value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder={language === "bn" ? "প্রত্যাখ্যানের কারণ..." : "Reason for rejection..."} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectPayment(null); setRejectionNote(""); }}>{language === "bn" ? "বাতিল" : "Cancel"}</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ paymentId: rejectPayment.id, note: rejectionNote })} disabled={rejectMutation.isPending}>
              {language === "bn" ? "প্রত্যাখ্যান করুন" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)} onConfirm={handleBulkDelete} title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"} description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`} />
    </div>
  );
};

export default AdminPayments;
