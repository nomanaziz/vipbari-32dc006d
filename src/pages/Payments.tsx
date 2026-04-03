import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, CheckCircle, XCircle, TrendingUp, CheckCircle2, AlertTriangle, Receipt } from "lucide-react";
import { toast } from "sonner";

const Payments = () => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  // Received Bill filters
  const [filter, setFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rejectPayment, setRejectPayment] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  // --- Queries ---
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, tenants(full_name), bills(month)")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tenants } = useQuery({
    queryKey: ["rent-tenants", effectiveOwnerId],
    queryFn: async () => {
      const { data: owned, error: ownedError } = await supabase
        .from("tenants")
        .select("id, full_name, phone, user_id, room_id, rooms!tenants_room_id_fkey(room_number, rent_amount, property_id, properties(name))")
        .eq("owner_id", effectiveOwnerId!)
        .eq("status", "active");
      if (ownedError) throw ownedError;

      const { data: requests, error: requestsError } = await supabase
        .from("tolet_requests")
        .select("tenant_user_id, room_id, rooms(id, room_number, rent_amount, property_id, properties(name))")
        .eq("landlord_user_id", effectiveOwnerId!)
        .eq("status", "accepted");
      if (requestsError) throw requestsError;

      const tenantMap = new Map<string, any>();
      (owned || []).forEach((t: any) => tenantMap.set(t.id, t));

      if (requests && requests.length > 0) {
        const requestUserIds = requests
          .map((r: any) => r.tenant_user_id)
          .filter((uid: string) => ![...tenantMap.values()].some((t: any) => t.user_id === uid));

        if (requestUserIds.length > 0) {
          const { data: reqTenants, error: reqTenantsError } = await supabase
            .from("tenants")
            .select("id, full_name, phone, user_id, room_id, rooms!tenants_room_id_fkey(room_number, rent_amount, property_id, properties(name))")
            .in("user_id", requestUserIds)
            .eq("status", "active");
          if (reqTenantsError) throw reqTenantsError;

          (reqTenants || []).forEach((t: any) => {
            if (!tenantMap.has(t.id)) {
              const req = requests.find((r: any) => r.tenant_user_id === t.user_id);
              if (!t.rooms && req?.rooms) {
                t.rooms = req.rooms;
                t.room_id = req.room_id;
              }
              tenantMap.set(t.id, t);
            }
          });
        }
      }

      return Array.from(tenantMap.values());
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: bills } = useQuery({
    queryKey: ["rent-bills", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("id, tenant_id, room_id, month, total_amount, status, due_date")
        .eq("owner_id", effectiveOwnerId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  // --- Mutations ---
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
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(L("Payment accepted", "পেমেন্ট গৃহীত হয়েছে"));
    },
    onError: () => toast.error(L("Error accepting payment", "ত্রুটি হয়েছে")),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: string; note: string }) => {
      const { error } = await supabase.from("payments").update({ status: "rejected", rejection_note: note || null }).eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(L("Payment rejected", "পেমেন্ট প্রত্যাখ্যাত"));
      setRejectPayment(null);
      setRejectionNote("");
    },
    onError: () => toast.error(L("Error rejecting payment", "ত্রুটি হয়েছে")),
  });

  // --- Received Bill filtering ---
  const statusBadge = (p: any) => {
    const s = p.status || (p.verified ? "accepted" : "pending");
    if (s === "accepted") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{L("Accepted", "গৃহীত")}</Badge>;
    if (s === "rejected") return <Badge variant="destructive">{L("Rejected", "প্রত্যাখ্যাত")}</Badge>;
    if (s === "cancelled") return <Badge variant="outline" className="text-muted-foreground">{L("Cancelled", "বাতিল")}</Badge>;
    return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200">{L("Pending", "অপেক্ষমাণ")}</Badge>;
  };

  const filtered = payments?.filter((p: any) => {
    const s = p.status || (p.verified ? "accepted" : "pending");
    if (filter !== "all" && s !== filter) return false;
    if (methodFilter !== "all" && p.payment_method?.toLowerCase() !== methodFilter) return false;
    if (fromDate && p.payment_date < fromDate) return false;
    if (toDate && p.payment_date > toDate) return false;
    return true;
  });

  // --- Stats ---
  const now = new Date();
  const totalRent = tenants?.reduce((s: number, t: any) => s + (Number(t.rooms?.rent_amount) || 0), 0) || 0;
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthBills = bills?.filter((b: any) => b.month === thisMonth) || [];
  const paidAmount = thisMonthBills.filter((b: any) => b.status === "paid").reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const dueAmount = thisMonthBills.filter((b: any) => b.status !== "paid").reduce((s: number, b: any) => s + Number(b.total_amount), 0);
  const overdueCount = bills?.filter((b: any) => b.status === "unpaid" && b.due_date && new Date(b.due_date) < now).length || 0;

  const stats = [
    { label: L("Total Rent", "মোট ভাড়া"), value: `৳${totalRent.toLocaleString()}`, icon: Receipt, gradientBg: "from-blue-50 to-blue-100", iconBg: "bg-blue-500" },
    { label: L("Received", "সংগৃহীত"), value: `৳${paidAmount.toLocaleString()}`, icon: CheckCircle2, gradientBg: "from-emerald-50 to-emerald-100", iconBg: "bg-emerald-500" },
    { label: L("Due", "বকেয়া"), value: `৳${dueAmount.toLocaleString()}`, icon: TrendingUp, gradientBg: "from-orange-50 to-orange-100", iconBg: "bg-orange-500" },
    { label: L("Overdue", "মেয়াদোত্তীর্ণ"), value: String(overdueCount), icon: AlertTriangle, gradientBg: "from-red-50 to-red-100", iconBg: "bg-red-500" },
  ];

  const paymentMethods = [
    { value: "all", label: L("All Methods", "সব মাধ্যম") },
    { value: "cash", label: L("Cash", "ক্যাশ") },
    { value: "bkash", label: "bKash" },
    { value: "nagad", label: "Nagad" },
    { value: "bank", label: L("Bank", "ব্যাংক") },
    { value: "rocket", label: "Rocket" },
    { value: "other", label: L("Other", "অন্যান্য") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.payments")}</h1>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.gradientBg} border-0 shadow-sm`}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">{L("Received Bill", "বিল সংগ্রহ")}</TabsTrigger>
          <TabsTrigger value="overview">{L("Apartment Overview", "এপার্টমেন্ট ওভারভিউ")}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Received Bill */}
        <TabsContent value="received" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("payments.from_date")}</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("payments.to_date")}</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("payments.payment_method")}</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{L("Status", "অবস্থা")}</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{L("All", "সব")}</SelectItem>
                  <SelectItem value="pending">{L("Pending", "অপেক্ষমাণ")}</SelectItem>
                  <SelectItem value="accepted">{L("Accepted", "গৃহীত")}</SelectItem>
                  <SelectItem value="rejected">{L("Rejected", "প্রত্যাখ্যাত")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted" /></Card>)}
            </div>
          ) : !filtered?.length ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{L("No payments found", "কোনো পেমেন্ট নেই")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((p: any) => {
                const isPending = (p.status || (p.verified ? "accepted" : "pending")) === "pending";
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <h3 className="font-semibold">{p.tenants?.full_name || "—"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {p.bills?.month || ""} · {p.payment_method} · {new Date(p.payment_date).toLocaleDateString()}
                          </p>
                          {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
                          {p.rejection_note && <p className="text-xs text-destructive mt-0.5">{L("Reason: ", "কারণ: ")}{p.rejection_note}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <span className="font-bold text-primary">৳{Number(p.amount).toLocaleString()}</span>
                          {statusBadge(p)}
                          
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Apartment Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tenants?.map((t: any) => {
              const tBills = bills?.filter((b: any) => b.tenant_id === t.id) || [];
              const totalPaid = tBills.filter((b: any) => b.status === "paid").length;
              const totalUnpaid = tBills.filter((b: any) => b.status !== "paid").length;
              return (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{t.rooms?.room_number || "—"}</span>
                      <Badge variant="outline">{t.rooms?.properties?.name}</Badge>
                    </div>
                    <p className="text-sm">{t.full_name}</p>
                    <p className="text-sm text-muted-foreground">{t.phone}</p>
                    <div className="flex gap-3 mt-3 text-xs">
                      <span className="text-emerald-600">{totalPaid} {L("paid", "পরিশোধিত")}</span>
                      <span className="text-destructive">{totalUnpaid} {L("due", "বকেয়া")}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">৳{Number(t.rooms?.rent_amount || 0).toLocaleString()}/{L("month", "মাস")}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!rejectPayment} onOpenChange={(o) => { if (!o) { setRejectPayment(null); setRejectionNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{L("Reject Payment", "পেমেন্ট প্রত্যাখ্যান")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{L("Enter reason (optional):", "কারণ লিখুন (ঐচ্ছিক):")}</p>
            <Input value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder={L("Reason for rejection...", "প্রত্যাখ্যানের কারণ...")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectPayment(null); setRejectionNote(""); }}>{L("Cancel", "বাতিল")}</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ paymentId: rejectPayment.id, note: rejectionNote })} disabled={rejectMutation.isPending}>
              {L("Reject", "প্রত্যাখ্যান করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PaymentsPage = () => (
  <PermissionGuard permission="view_payments">
    <Payments />
  </PermissionGuard>
);

export default PaymentsPage;
