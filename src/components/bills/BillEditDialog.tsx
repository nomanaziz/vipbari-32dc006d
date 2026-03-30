import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BillEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: any;
}

export function BillEditDialog({ open, onOpenChange, bill }: BillEditDialogProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [charges, setCharges] = useState({
    rent_amount: 0, electricity_charge: 0, water_charge: 0,
    gas_charge: 0, service_charge: 0, garage_charge: 0, other_charges: 0,
    wifi_charge: 0, generator_charge: 0, security_charge: 0,
    vat: 0, advance: 0,
  });
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (bill) {
      setCharges({
        rent_amount: Number(bill.rent_amount || 0),
        electricity_charge: Number(bill.electricity_charge || 0),
        water_charge: Number(bill.water_charge || 0),
        gas_charge: Number(bill.gas_charge || 0),
        service_charge: Number(bill.service_charge || 0),
        garage_charge: Number(bill.garage_charge || 0),
        other_charges: Number(bill.other_charges || 0),
        wifi_charge: Number(bill.wifi_charge || 0),
        generator_charge: Number(bill.generator_charge || 0),
        security_charge: Number(bill.security_charge || 0),
        vat: Number(bill.vat || 0),
        advance: Number(bill.advance || 0),
      });
      setDueDate(bill.due_date || "");
    }
  }, [bill]);

  const total = Object.values(charges).reduce((a, b) => a + (Number(b) || 0), 0);

  const updateBill = useMutation({
    mutationFn: async () => {
      const received = Number(bill.received_amount || 0);
      const oldTotal = Number(bill.total_amount || 0);
      let newReceivedAmount = received;
      let advanceDelta = 0;

      // Case 1: Total reduced below received → overpayment goes to advance
      if (total < received) {
        const overpayment = received - total;
        advanceDelta = overpayment;
        newReceivedAmount = total; // cap received at new total
      }
      // Case 2: Total increased → try to use tenant advance
      else if (total > oldTotal && received < total) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("advance_balance")
          .eq("id", bill.tenant_id)
          .single();
        
        const currentAdvance = Number(tenantData?.advance_balance || 0);
        if (currentAdvance > 0) {
          const newDue = total - received;
          const advanceToUse = Math.min(currentAdvance, newDue);
          advanceDelta = -advanceToUse;
          newReceivedAmount = received + advanceToUse;
        }
      }

      // Determine new status
      const newStatus = newReceivedAmount <= 0 ? "unpaid" : newReceivedAmount >= total ? "paid" : "partial";

      const { error } = await supabase.from("bills").update({
        ...charges,
        total_amount: total,
        received_amount: newReceivedAmount,
        status: newStatus,
        due_date: dueDate || null,
      } as any).eq("id", bill.id);
      if (error) throw error;

      // Update tenant advance balance if needed
      if (advanceDelta !== 0) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("advance_balance")
          .eq("id", bill.tenant_id)
          .single();
        
        const currentAdvance = Number(tenantData?.advance_balance || 0);
        const newAdvance = Math.max(0, currentAdvance + advanceDelta);
        
        await supabase.from("tenants").update({
          advance_balance: newAdvance,
        }).eq("id", bill.tenant_id);
      }

      return { advanceDelta };
    },
    onSuccess: ({ advanceDelta }) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-bills"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-detail"] });
      onOpenChange(false);
      
      let msg = L("Bill updated successfully", "বিল সফলভাবে আপডেট হয়েছে");
      if (advanceDelta > 0) {
        msg += ` | ${L(`৳${advanceDelta.toLocaleString()} added to advance`, `৳${advanceDelta.toLocaleString()} অগ্রিমে যোগ হয়েছে`)}`;
      } else if (advanceDelta < 0) {
        msg += ` | ${L(`৳${Math.abs(advanceDelta).toLocaleString()} deducted from advance`, `৳${Math.abs(advanceDelta).toLocaleString()} অগ্রিম থেকে কাটা হয়েছে`)}`;
      }
      toast.success(msg);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!bill) return null;

  const received = Number(bill.received_amount || 0);
  const overpayment = total < received ? received - total : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{L("Edit Bill", "বিল সম্পাদনা")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground mb-2">
          <p><strong>{L("Tenant", "ভাড়াটিয়া")}:</strong> {bill.tenants?.full_name || "—"}</p>
          <p><strong>{L("Month", "মাস")}:</strong> {bill.month}</p>
          <p><strong>{L("Room", "রুম")}:</strong> {bill.rooms?.room_number || "—"}</p>
          <p><strong>{L("Received", "প্রাপ্ত")}:</strong> ৳{received.toLocaleString()}</p>
        </div>

        {overpayment > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-400">
            ⚠️ {L(
              `Received (৳${received.toLocaleString()}) exceeds new total (৳${total.toLocaleString()}). ৳${overpayment.toLocaleString()} will be added to tenant's advance balance.`,
              `প্রাপ্ত (৳${received.toLocaleString()}) নতুন মোটের (৳${total.toLocaleString()}) বেশি। ৳${overpayment.toLocaleString()} ভাড়াটিয়ার অগ্রিমে যোগ হবে।`
            )}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); updateBill.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{L("Due Date", "পরিশোধের তারিখ")}</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "rent_amount", en: "Rent", bn: "ভাড়া" },
              { key: "electricity_charge", en: "Electricity", bn: "বিদ্যুৎ" },
              { key: "water_charge", en: "Water", bn: "পানি" },
              { key: "gas_charge", en: "Gas", bn: "গ্যাস" },
              { key: "wifi_charge", en: "WiFi/Internet", bn: "ওয়াইফাই" },
              { key: "generator_charge", en: "Generator", bn: "জেনারেটর" },
              { key: "security_charge", en: "Security", bn: "সিকিউরিটি" },
              { key: "service_charge", en: "Service", bn: "সার্ভিস" },
              { key: "garage_charge", en: "Garage", bn: "গ্যারেজ" },
              { key: "other_charges", en: "Other", bn: "অন্যান্য" },
              { key: "vat", en: "VAT", bn: "ভ্যাট" },
              { key: "advance", en: "Advance", bn: "অগ্রিম" },
            ].map(({ key, en, bn }) => (
              <div key={key} className="space-y-1.5">
                <Label>{L(en, bn)} (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={charges[key as keyof typeof charges]}
                  onChange={e => setCharges(c => ({ ...c, [key]: Number(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="font-medium">{L("Total", "মোট")}</span>
            <span className="text-lg font-bold text-primary">৳{total.toLocaleString()}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{L("Cancel", "বাতিল")}</Button>
            <Button type="submit" disabled={updateBill.isPending}>{L("Update Bill", "বিল আপডেট")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
