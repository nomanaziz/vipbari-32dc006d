import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bill: any;
}

export function QuickPaymentDialog({ open, onOpenChange, bill }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [useAdvance, setUseAdvance] = useState(false);

  // Fetch tenant advance balance
  const { data: tenantData } = useQuery({
    queryKey: ["tenant-advance", bill?.tenant_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tenants")
        .select("advance_balance")
        .eq("id", bill.tenant_id)
        .single();
      return data;
    },
    enabled: !!bill?.tenant_id && open,
  });

  const advanceBalance = Number(tenantData?.advance_balance || 0);
  const due = bill ? Number(bill.total_amount) - Number(bill.received_amount || 0) : 0;
  const advanceToApply = useAdvance ? Math.min(advanceBalance, due) : 0;
  const remainingDue = due - advanceToApply;

  // Reset useAdvance when dialog opens
  useEffect(() => {
    if (open && advanceBalance > 0) {
      setUseAdvance(true);
    } else {
      setUseAdvance(false);
    }
  }, [open, advanceBalance]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payAmount = Number(amount);
      const discountAmount = Number(discount) || 0;
      
      // Allow zero pay amount if advance covers it
      if (!useAdvance && (!payAmount || payAmount <= 0)) throw new Error("Invalid amount");
      if (payAmount < 0) throw new Error("Invalid amount");

      const isCash = method === "cash";
      const totalCredit = payAmount + discountAmount + advanceToApply;

      // Insert payment record (for the cash/online amount, not advance)
      if (payAmount > 0) {
        const { error: pErr } = await supabase.from("payments").insert({
          bill_id: bill.id,
          tenant_id: bill.tenant_id,
          owner_id: user!.id,
          amount: payAmount,
          payment_method: method,
          notes: [
            discountAmount > 0 ? `Discount: ৳${discountAmount}` : null,
            advanceToApply > 0 ? `Advance applied: ৳${advanceToApply}` : null,
            notes || null,
          ].filter(Boolean).join(" | ") || null,
          status: isCash ? "accepted" : "pending",
          verified: isCash,
          verified_at: isCash ? new Date().toISOString() : null,
          verified_by: isCash ? user!.id : null,
        });
        if (pErr) throw pErr;
      }

      // For cash (or advance-only): update bill immediately
      if (isCash || (payAmount === 0 && advanceToApply > 0)) {
        const effectiveCredit = (isCash ? payAmount : 0) + discountAmount + advanceToApply;
        const newReceived = Number(bill.received_amount || 0) + effectiveCredit;
        const newStatus = newReceived >= Number(bill.total_amount) ? "paid" : "partial";
        const { error: bErr } = await supabase.from("bills").update({
          received_amount: newReceived,
          status: newStatus,
        }).eq("id", bill.id);
        if (bErr) throw bErr;
      }

      // Deduct advance from tenant
      if (advanceToApply > 0) {
        const newAdvance = Math.max(0, advanceBalance - advanceToApply);
        await supabase.from("tenants").update({
          advance_balance: newAdvance,
        }).eq("id", bill.tenant_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["all-payments-for-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-advance"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-detail"] });
      onOpenChange(false);
      setAmount(""); setDiscount(""); setNotes(""); setUseAdvance(false);
      toast.success(L("Payment recorded", "পেমেন্ট রেকর্ড হয়েছে"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{L("Record Payment", "পেমেন্ট রেকর্ড")}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-2">
          {bill.tenants?.full_name} — {L("Due", "বকেয়া")}: ৳{due.toLocaleString()}
        </div>

        {/* Advance balance info */}
        {advanceBalance > 0 && (
          <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/30 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-400 font-medium">
                {L("Available Advance", "উপলব্ধ অগ্রিম")}: ৳{advanceBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-advance"
                checked={useAdvance}
                onCheckedChange={(v) => setUseAdvance(!!v)}
              />
              <label htmlFor="use-advance" className="text-sm text-blue-700 dark:text-blue-400 cursor-pointer">
                {L(`Apply ৳${advanceToApply.toLocaleString()} from advance`, `অগ্রিম থেকে ৳${advanceToApply.toLocaleString()} প্রয়োগ করুন`)}
              </label>
            </div>
            {useAdvance && remainingDue > 0 && (
              <div className="text-xs text-blue-600 dark:text-blue-300">
                {L(`Remaining due after advance: ৳${remainingDue.toLocaleString()}`, `অগ্রিমের পর অবশিষ্ট: ৳${remainingDue.toLocaleString()}`)}
              </div>
            )}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{L("Amount", "পরিমাণ")} (৳)</Label>
            <Input
              type="number"
              min={advanceToApply >= due ? "0" : "1"}
              max={remainingDue}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required={advanceToApply < due}
              placeholder={remainingDue > 0 ? `${L("Max", "সর্বোচ্চ")}: ৳${remainingDue.toLocaleString()}` : "0"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{L("Discount", "ছাড়")} (৳)</Label>
            <Input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>{L("Method", "পদ্ধতি")}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{L("Cash", "নগদ")}</SelectItem>
                <SelectItem value="bkash">{L("bKash", "বিকাশ")}</SelectItem>
                <SelectItem value="nagad">{L("Nagad", "নগদ")}</SelectItem>
                <SelectItem value="bank">{L("Bank Transfer", "ব্যাংক ট্রান্সফার")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{L("Notes", "নোট")}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{L("Cancel", "বাতিল")}</Button>
            <Button type="submit" disabled={mutation.isPending}>{L("Save Payment", "পেমেন্ট সেভ করুন")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
