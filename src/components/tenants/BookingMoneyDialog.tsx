import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Home, Banknote, Wallet } from "lucide-react";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any;
}

const TX_TYPES = [
  { value: "deposit", en: "Deposit", bn: "জমা", icon: Plus, color: "text-green-600" },
  { value: "rent_deduct", en: "Rent Deduction", bn: "ভাড়া কর্তন", icon: Home, color: "text-orange-600" },
  { value: "cash_refund", en: "Cash Refund", bn: "ক্যাশ ফেরত", icon: Banknote, color: "text-red-600" },
  { value: "full_refund", en: "Full Refund", bn: "পূর্ণ ফেরত", icon: Banknote, color: "text-red-600" },
];

export default function BookingMoneyDialog({ open, onOpenChange, tenant }: Props) {
  const { language } = useLanguage();
  const { effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  const tenantId = tenant?.id;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["booking_transactions", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_transactions")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && open,
  });

  const balance = transactions.reduce((sum: number, tx: any) => {
    if (tx.type === "deposit") return sum + Number(tx.amount);
    return sum - Number(tx.amount);
  }, 0);

  const addMutation = useMutation({
    mutationFn: async () => {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Invalid amount");

      // Insert booking transaction
      const { error } = await supabase.from("booking_transactions").insert({
        owner_id: effectiveOwnerId!,
        tenant_id: tenantId!,
        type: txType,
        amount: amt,
        description,
        transaction_date: txDate,
      });
      if (error) throw error;

      // Auto accounting entry
      const isDebit = txType === "deposit";
      const categoryMap: Record<string, string> = {
        deposit: "advance_payment",
        rent_deduct: "booking_rent_deduct",
        cash_refund: "booking_refund",
        full_refund: "booking_refund",
      };
      const tenantName = tenant?.full_name || "";
      const descMap: Record<string, string> = {
        deposit: `বুকিং জমা: ${tenantName}`,
        rent_deduct: `ভাড়া কর্তন (বুকিং): ${tenantName}`,
        cash_refund: `ক্যাশ ফেরত (বুকিং): ${tenantName}`,
        full_refund: `পূর্ণ ফেরত (বুকিং): ${tenantName}`,
      };

      await supabase.from("accounting_entries").insert({
        owner_id: effectiveOwnerId!,
        type: isDebit ? "income" : "expense",
        category: categoryMap[txType],
        amount: amt,
        entry_date: txDate,
        description: description || descMap[txType],
      });

      // Update tenant advance_balance
      const newBalance = isDebit ? balance + amt : balance - amt;
      await supabase.from("tenants").update({ advance_balance: Math.max(0, newBalance) }).eq("id", tenantId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking_transactions", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["accounting_entries"] });
      toast.success(language === "bn" ? "সফলভাবে যোগ হয়েছে" : "Transaction added");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setTxType("deposit");
    setAmount("");
    setDescription("");
    setTxDate(new Date().toISOString().split("T")[0]);
  };

  const getTypeInfo = (type: string) => TX_TYPES.find(t => t.value === type) || TX_TYPES[0];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {language === "bn" ? "বুকিং মানি" : "Booking Money"}
            {tenant && <span className="text-sm font-normal text-muted-foreground">— {tenant.full_name}</span>}
          </DialogTitle>
        </DialogHeader>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-0">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">{language === "bn" ? "বর্তমান ব্যালেন্স" : "Current Balance"}</p>
            <p className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : ""}`}>
              ৳{balance.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {!showForm && (
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" className="flex-col h-auto py-3 gap-1" onClick={() => { setTxType("deposit"); setShowForm(true); }}>
              <Plus className="h-4 w-4 text-green-600" />
              <span className="text-[11px]">{language === "bn" ? "জমা" : "Deposit"}</span>
            </Button>
            <Button size="sm" variant="outline" className="flex-col h-auto py-3 gap-1" onClick={() => { setTxType("rent_deduct"); setShowForm(true); }}>
              <Home className="h-4 w-4 text-orange-600" />
              <span className="text-[11px]">{language === "bn" ? "ভাড়া কাটুন" : "Rent Deduct"}</span>
            </Button>
            <Button size="sm" variant="outline" className="flex-col h-auto py-3 gap-1" onClick={() => { setTxType("cash_refund"); setShowForm(true); }}>
              <Banknote className="h-4 w-4 text-red-600" />
              <span className="text-[11px]">{language === "bn" ? "ফেরত" : "Refund"}</span>
            </Button>
          </div>
        )}

        {/* Transaction Form */}
        {showForm && (
          <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-3 border rounded-lg p-3">
            <div>
              <Label className="text-xs">{language === "bn" ? "ধরন" : "Type"}</Label>
              <Select value={txType} onValueChange={setTxType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TX_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{language === "bn" ? t.bn : t.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{language === "bn" ? "পরিমাণ (৳)" : "Amount (৳)"}</Label>
              <Input type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">{language === "bn" ? "তারিখ" : "Date"}</Label>
              <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />
            </div>
            <div>
              <Label className="text-xs">{language === "bn" ? "বিবরণ" : "Description"}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={resetForm}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button type="submit" size="sm" className="flex-1" disabled={addMutation.isPending}>
                {addMutation.isPending ? (language === "bn" ? "সংরক্ষণ..." : "Saving...") : (language === "bn" ? "সংরক্ষণ" : "Save")}
              </Button>
            </div>
          </form>
        )}

        {/* Transaction History */}
        <div>
          <h4 className="text-sm font-medium mb-2">{language === "bn" ? "লেনদেনের ইতিহাস" : "Transaction History"}</h4>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{language === "bn" ? "কোনো লেনদেন নেই" : "No transactions"}</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {transactions.map((tx: any) => {
                const info = getTypeInfo(tx.type);
                const isDeposit = tx.type === "deposit";
                return (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{language === "bn" ? info.bn : info.en}</Badge>
                      </div>
                      {tx.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{tx.description}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.transaction_date), "dd MMM yyyy")}</p>
                    </div>
                    <span className={`font-semibold text-sm ${isDeposit ? "text-green-600" : "text-red-600"}`}>
                      {isDeposit ? "+" : "-"}৳{Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
