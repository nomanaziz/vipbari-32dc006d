import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Receipt, Wallet, XCircle, ChevronDown, ChevronUp, Printer } from "lucide-react";
import TenantPayDialog from "@/components/bills/TenantPayDialog";
import RentReceipt from "@/components/bills/RentReceipt";
import { toast } from "sonner";

const TenantPayments = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [payBill, setPayBill] = useState<any>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [printBill, setPrintBill] = useState<any>(null);

  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, owner_id, user_id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const landlordId = tenant && tenant.owner_id !== tenant.user_id ? tenant.owner_id : null;

  const { data: fallbackLandlord } = useQuery({
    queryKey: ["fallback-landlord", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tolet_requests")
        .select("landlord_user_id")
        .eq("tenant_user_id", user!.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.landlord_user_id || null;
    },
    enabled: !!user && !landlordId,
  });

  const effectiveLandlordId = landlordId || fallbackLandlord;

  const { data: landlordProfile } = useQuery({
    queryKey: ["landlord-profile-for-receipt", effectiveLandlordId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("user_id", effectiveLandlordId!).maybeSingle();
      return data;
    },
    enabled: !!effectiveLandlordId,
  });

  const { data: paymentAccount } = useQuery({
    queryKey: ["landlord-payment-account", effectiveLandlordId],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_accounts")
        .select("*")
        .eq("owner_id", effectiveLandlordId!)
        .maybeSingle();
      return data;
    },
    enabled: !!effectiveLandlordId,
  });

  const { data: bills, isLoading } = useQuery({
    queryKey: ["tenant-bills", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const { data: payments } = useQuery({
    queryKey: ["tenant-payments", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant,
  });

  const cancelMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.from("payments").update({ status: "cancelled" } as any).eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      toast.success(language === "bn" ? "পেমেন্ট বাতিল হয়েছে" : "Payment cancelled");
    },
    onError: () => toast.error(language === "bn" ? "ত্রুটি হয়েছে" : "Error cancelling payment"),
  });

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Receipt className="h-10 w-10 opacity-40" />
        <p>{language === "bn" ? "আপনাকে এখনো কোনো রুমে অ্যাসাইন করা হয়নি।" : "You are not assigned to any room yet."}</p>
      </div>
    );
  }

  const billStatusBadge = (status: string) => {
    if (status === "paid") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{t("bill.paid")}</Badge>;
    if (status === "partial") return <Badge variant="secondary">{t("bill.partial")}</Badge>;
    return <Badge variant="destructive">{t("bill.unpaid")}</Badge>;
  };

  const paymentStatusBadge = (p: any) => {
    const s = p.status || (p.verified ? "accepted" : "pending");
    if (s === "accepted") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{language === "bn" ? "গৃহীত" : "Accepted"}</Badge>;
    if (s === "rejected") return <Badge variant="destructive">{language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}</Badge>;
    if (s === "cancelled") return <Badge variant="outline" className="text-muted-foreground">{language === "bn" ? "বাতিল" : "Cancelled"}</Badge>;
    return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200">{language === "bn" ? "অপেক্ষমাণ" : "Pending"}</Badge>;
  };

  const handlePaySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["tenant-bills"] });
    queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("tenant.payment_history")}</h1>

      {/* Bills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Receipt className="h-5 w-5" />{t("nav.bills")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          ) : !bills?.length ? (
            <p className="text-center text-muted-foreground py-8">{language === "bn" ? "কোনো বিল নেই" : "No bills yet"}</p>
          ) : (
            <div className="space-y-3">
              {bills.map((bill: any) => {
                const due = Number(bill.total_amount) - Number(bill.received_amount || 0);
                const isUnpaid = bill.status === "unpaid" || bill.status === "partial";
                const isExpanded = expandedBillId === bill.id;
                const breakdownItems = [
                  { label: language === "bn" ? "বাড়ি ভাড়া" : "House Rent", value: Number(bill.rent_amount || 0) },
                  { label: language === "bn" ? "বিদ্যুৎ" : "Electricity", value: Number(bill.electricity_charge || 0) },
                  { label: language === "bn" ? "পানি" : "Water", value: Number(bill.water_charge || 0) },
                  { label: language === "bn" ? "গ্যাস" : "Gas", value: Number(bill.gas_charge || 0) },
                  { label: language === "bn" ? "সার্ভিস চার্জ" : "Service Charge", value: Number(bill.service_charge || 0) },
                  { label: language === "bn" ? "গ্যারেজ" : "Garage", value: Number(bill.garage_charge || 0) },
                  { label: language === "bn" ? "অন্যান্য" : "Other", value: Number(bill.other_charges || 0) },
                  { label: language === "bn" ? "ভ্যাট" : "VAT", value: Number(bill.vat || 0) },
                  { label: language === "bn" ? "অগ্রিম" : "Advance", value: Number(bill.advance || 0) },
                ].filter(item => item.value > 0);
                return (
                  <div key={bill.id} className="rounded-lg border bg-muted/30 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 gap-2 cursor-pointer"
                      onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <div>
                          <p className="font-medium">{bill.month}</p>
                          <p className="text-sm text-muted-foreground">
                            {language === "bn" ? "মোট" : "Total"}: ৳{Number(bill.total_amount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        <p className="font-semibold">৳{Number(bill.total_amount).toLocaleString()}</p>
                        {billStatusBadge(bill.status)}
                        {isUnpaid && due > 0 && (
                          <Button size="sm" variant="default" className="mt-1" onClick={(e) => { e.stopPropagation(); setPayBill(bill); }}>
                             <Wallet className="h-3.5 w-3.5 mr-1" />
                             {language === "bn" ? "পে করুন" : "Pay Now"}
                           </Button>
                         )}
                         <Button size="sm" variant="outline" className="mt-1" onClick={(e) => { e.stopPropagation(); setPrintBill(bill); setTimeout(() => window.print(), 300); }}>
                           <Printer className="h-3.5 w-3.5 mr-1" />
                           {language === "bn" ? "রশিদ" : "Receipt"}
                         </Button>
                       </div>
                    </div>
                    {isExpanded && breakdownItems.length > 0 && (
                      <div className="border-t bg-muted/20 p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {breakdownItems.map((item) => (
                            <div key={item.label} className="flex flex-col rounded-md border bg-background p-2">
                              <span className="text-xs text-muted-foreground">{item.label}</span>
                              <span className="font-semibold text-sm">৳{item.value.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex flex-col rounded-md border border-primary/30 bg-primary/5 p-2">
                            <span className="text-xs text-muted-foreground">{language === "bn" ? "মোট" : "Total"}</span>
                            <span className="font-bold text-sm text-primary">৳{Number(bill.total_amount).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" />{t("nav.payments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments?.length ? (
            <p className="text-center text-muted-foreground py-8">{language === "bn" ? "কোনো পেমেন্ট নেই" : "No payments yet"}</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p: any) => {
                const isPending = (p.status || (p.verified ? "accepted" : "pending")) === "pending";
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium">৳{Number(p.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(p.payment_date).toLocaleDateString()} · {p.payment_method}
                      </p>
                      {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                      {(p as any).rejection_note && <p className="text-xs text-destructive">{language === "bn" ? "কারণ: " : "Reason: "}{(p as any).rejection_note}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {paymentStatusBadge(p)}
                      {isPending && (
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => cancelMutation.mutate(p.id)} disabled={cancelMutation.isPending}>
                          <XCircle className="h-4 w-4 mr-1" />{language === "bn" ? "বাতিল" : "Cancel"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {payBill && (
        <TenantPayDialog
          open={!!payBill}
          onOpenChange={(o) => !o && setPayBill(null)}
          bill={payBill}
          tenantId={tenant.id}
          paymentAccount={paymentAccount || null}
          onSuccess={handlePaySuccess}
        />
      )}

      {/* Hidden print-only receipt */}
      {printBill && <RentReceipt bills={[{ ...printBill, landlordName: landlordProfile?.full_name, landlordPhone: landlordProfile?.phone }]} showLandlordCopy={false} />}
    </div>
  );
};

export default TenantPayments;
