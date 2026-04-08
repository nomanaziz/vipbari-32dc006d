import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BillEditDialog } from "@/components/bills/BillEditDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Pencil, FileText, CreditCard, User, AlertTriangle, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";

interface TenantDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}

export function TenantDetailDialog({ open, onOpenChange, tenantId }: TenantDetailDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;
  const [editBill, setEditBill] = useState<any>(null);
  const [detailTab, setDetailTab] = useState("billing");
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const { data: tenant } = useQuery({
    queryKey: ["tenant-detail", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select("*, rooms(room_number, rent_amount, property_id, properties(name, division, district, thana, area, house_number, road_number, postal_code))")
        .eq("id", tenantId!)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantId && open,
  });

  const { data: tenantBills } = useQuery({
    queryKey: ["tenant-bills", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bills")
        .select("*, rooms(room_number, properties(name))")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantId && open,
  });

  const { data: tenantPayments } = useQuery({
    queryKey: ["tenant-payments", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantId && open,
  });

  const { data: tenantComplaints } = useQuery({
    queryKey: ["tenant-complaints", tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenantId && open,
  });

  // Delete last payment mutation
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      // Get the payment details first
      const payment = tenantPayments?.find((p: any) => p.id === paymentId);
      if (!payment) throw new Error("Payment not found");

      // Delete the payment
      const { error: delErr } = await supabase.from("payments").delete().eq("id", paymentId);
      if (delErr) throw delErr;

      // Reverse bill received_amount
      const { data: bill } = await supabase.from("bills").select("received_amount, total_amount").eq("id", payment.bill_id).single();
      if (bill) {
        const newReceived = Math.max(0, Number(bill.received_amount || 0) - Number(payment.amount));
        const newStatus = newReceived <= 0 ? "unpaid" : newReceived >= Number(bill.total_amount) ? "paid" : "partial";
        const { error: bErr } = await supabase.from("bills").update({
          received_amount: newReceived,
          status: newStatus,
        }).eq("id", payment.bill_id);
        if (bErr) throw bErr;

        // If the payment had a discount note, check if it contributed to advance
        // For now, just check if received was > total (overpayment scenario)
        const oldReceived = Number(bill.received_amount || 0);
        const totalAmt = Number(bill.total_amount);
        if (oldReceived > totalAmt) {
          // There was overpayment that went to advance, reverse it
          const overpaymentToReverse = Math.min(Number(payment.amount), oldReceived - totalAmt);
          if (overpaymentToReverse > 0 && tenantId) {
            const currentAdvance = Number(tenant?.advance_balance || 0);
            await supabase.from("tenants").update({
              advance_balance: Math.max(0, currentAdvance - overpaymentToReverse),
            }).eq("id", tenantId);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenant-bills", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenant-detail", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments-for-stats"] });
      setDeletePaymentId(null);
      toast.success(L("Payment deleted & bill reversed", "পেমেন্ট মুছে ফেলা হয়েছে ও বিল সংশোধিত"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!tenantId) return null;

  const statusColor = (s: string) => {
    if (s === "paid" || s === "accepted" || s === "resolved") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (s === "partial" || s === "pending" || s === "in_progress") return "bg-amber-500/10 text-amber-600 border-amber-200";
    return "bg-red-500/10 text-red-600 border-red-200";
  };

  // Determine the latest (most recent) payment ID — only this one is deletable
  const latestPaymentId = tenantPayments && tenantPayments.length > 0 ? tenantPayments[0].id : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {tenant?.full_name || L("Tenant Details", "ভাড়াটিয়ার বিবরণ")}
            </DialogTitle>
          </DialogHeader>

          {tenant && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-2">
              <div><span className="text-muted-foreground">{L("Phone", "ফোন")}:</span> {tenant.phone}</div>
              <div><span className="text-muted-foreground">{L("Room", "রুম")}:</span> {tenant.rooms?.room_number || "—"}</div>
              <div><span className="text-muted-foreground">{L("Property", "প্রপার্টি")}:</span> {tenant.rooms?.properties?.name || "—"}</div>
              <div><span className="text-muted-foreground">{L("Advance", "অগ্রিম")}:</span> <span className="font-medium text-primary">৳{Number(tenant.advance_balance || 0).toLocaleString()}</span></div>
            </div>
          )}

          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="billing" className="text-xs gap-1"><FileText className="h-3 w-3" />{L("Bills", "বিল")}</TabsTrigger>
              <TabsTrigger value="payments" className="text-xs gap-1"><CreditCard className="h-3 w-3" />{L("Payments", "পেমেন্ট")}</TabsTrigger>
              <TabsTrigger value="info" className="text-xs gap-1"><User className="h-3 w-3" />{L("Info", "তথ্য")}</TabsTrigger>
              <TabsTrigger value="complaints" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />{L("Complaints", "অভিযোগ")}</TabsTrigger>
            </TabsList>

            {/* Billing Tab */}
            <TabsContent value="billing" className="mt-3 space-y-2">
              {tenantBills && tenantBills.length > 0 ? tenantBills.map((bill: any) => {
                const balance = Number(bill.total_amount) - Number(bill.received_amount || 0);
                return (
                  <Card key={bill.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{bill.month}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColor(bill.status)}>{bill.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBill(bill)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>{L("Total", "মোট")}: <strong>৳{Number(bill.total_amount).toLocaleString()}</strong></div>
                        <div>{L("Received", "প্রাপ্ত")}: <strong className="text-emerald-600">৳{Number(bill.received_amount || 0).toLocaleString()}</strong></div>
                        <div>{L("Due", "বকেয়া")}: <strong className="text-destructive">{balance > 0 ? `৳${balance.toLocaleString()}` : "—"}</strong></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <p className="text-center text-muted-foreground text-sm py-6">{L("No bills found", "কোনো বিল পাওয়া যায়নি")}</p>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-3 space-y-2">
              {tenantPayments && tenantPayments.length > 0 ? tenantPayments.map((p: any) => {
                const isLatest = p.id === latestPaymentId;
                return (
                  <Card key={p.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">৳{Number(p.amount).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{p.payment_date} • {p.payment_method}</div>
                        {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor(p.status)}>{p.status}</Badge>
                        {isLatest && (p.status === "accepted" || p.status === "pending") ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeletePaymentId(p.id)}
                            title={L("Delete", "মুছুন")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="h-7 w-7 flex items-center justify-center text-muted-foreground/40" title={L("Cannot delete older payments", "পুরানো পেমেন্ট মোছা যাবে না")}>
                            <Ban className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <p className="text-center text-muted-foreground text-sm py-6">{L("No payments found", "কোনো পেমেন্ট পাওয়া যায়নি")}</p>
              )}
            </TabsContent>

            {/* Personal Info Tab */}
            <TabsContent value="info" className="mt-3">
              {tenant ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    [L("Full Name", "পুরো নাম"), tenant.full_name],
                    [L("Phone", "ফোন"), tenant.phone],
                    [L("Secondary Phone", "দ্বিতীয় ফোন"), tenant.secondary_phone],
                    [L("NID", "জাতীয় পরিচয়পত্র"), tenant.nid],
                    [L("Gender", "লিঙ্গ"), tenant.gender],
                    [L("Occupation", "পেশা"), tenant.occupation],
                    [L("Date of Birth", "জন্ম তারিখ"), tenant.date_of_birth],
                    [L("Move-in Date", "প্রবেশের তারিখ"), tenant.move_in_date],
                    [L("Emergency Contact", "জরুরি যোগাযোগ"), tenant.emergency_contact],
                    [L("Document Type", "ডকুমেন্ট"), tenant.doc_type],
                    [L("Document No", "ডকুমেন্ট নং"), tenant.doc_number],
                    [L("Permanent Address", "স্থায়ী ঠিকানা"), [tenant.permanent_village, tenant.permanent_thana, tenant.permanent_district, tenant.permanent_division].filter(Boolean).join(", ")],
                    [L("Present Address", "বর্তমান ঠিকানা"), [tenant.present_village, tenant.present_thana, tenant.present_district, tenant.present_division].filter(Boolean).join(", ")],
                    [L("Advance Balance", "অগ্রিম ব্যালেন্স"), `৳${Number(tenant.advance_balance || 0).toLocaleString()}`],
                    [L("Billing Type", "বিলিং ধরন"), tenant.billing_type],
                    [L("Status", "স্ট্যাটাস"), tenant.status],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex flex-col border rounded-md p-2">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="font-medium">{(value as string) || "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-6">{L("Loading...", "লোড হচ্ছে...")}</p>
              )}
            </TabsContent>

            {/* Complaints Tab */}
            <TabsContent value="complaints" className="mt-3 space-y-2">
              {tenantComplaints && tenantComplaints.length > 0 ? tenantComplaints.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{c.title || L("Complaint", "অভিযোগ")}</span>
                      <Badge className={statusColor(c.status)}>{c.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{c.category}</Badge>
                      <Badge variant="outline" className="text-xs">{c.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-center text-muted-foreground text-sm py-6">{L("No complaints found", "কোনো অভিযোগ পাওয়া যায়নি")}</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BillEditDialog open={!!editBill} onOpenChange={(v) => { if (!v) setEditBill(null); }} bill={editBill} />

      <DeleteConfirmDialog
        open={!!deletePaymentId}
        onOpenChange={(v) => { if (!v) setDeletePaymentId(null); }}
        onConfirm={() => deletePaymentId && deletePayment.mutate(deletePaymentId)}
        title={L("Delete Payment", "পেমেন্ট মুছুন")}
        description={L(
          "This will delete the payment and reverse the bill amount. This action cannot be undone.",
          "এটি পেমেন্ট মুছে ফেলবে এবং বিলের পরিমাণ সংশোধন করবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
        )}
      />
    </>
  );
}
