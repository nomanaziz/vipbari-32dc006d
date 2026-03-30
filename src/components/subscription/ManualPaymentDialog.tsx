import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle2, Banknote, Smartphone } from "lucide-react";

interface ManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: "room_management" | "tolet" | "boost" | "sale_listing";
  roomCount: number;
  toletCount: number;
  durationMonths: number;
  discountPercent: number;
  couponCode: string;
  totalPrice: number;
  onSuccess: () => void;
  boostType?: "3_day" | "7_day";
  boostCount?: number;
}

type AdminPaymentInfo = {
  payment_bkash: string;
  payment_nagad: string;
  payment_rocket: string;
  payment_upay: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_routing_number: string;
};

const ManualPaymentDialog = ({
  open, onOpenChange, productType, roomCount, toletCount,
  durationMonths, discountPercent, couponCode, totalPrice, onSuccess,
  boostType, boostCount,
}: ManualPaymentDialogProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [adminInfo, setAdminInfo] = useState<AdminPaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (open) {
      fetchAdminPaymentInfo();
      setPaymentMethod("");
      setTransactionId("");
    }
  }, [open]);

  const fetchAdminPaymentInfo = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "payment_bkash", "payment_nagad", "payment_rocket", "payment_upay",
        "bank_name", "bank_account_name", "bank_account_number", "bank_branch", "bank_routing_number",
      ]);

    if (data) {
      const info: any = {};
      data.forEach((s: any) => {
        info[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
      });
      setAdminInfo(info);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSubmit = async () => {
    if (!user || !paymentMethod || !transactionId.trim()) {
      toast.error(language === "bn" ? "পেমেন্ট মেথড এবং ট্রানজেকশন আইডি দিন" : "Please select payment method and enter transaction ID");
      return;
    }

    setSubmitting(true);
    try {
      const insertPayload: any = {
        user_id: user.id,
        product_type: productType === "boost" ? "boost" : productType,
        room_count: productType === "room_management" ? roomCount : 0,
        tolet_count: productType === "tolet" ? toletCount : 0,
        duration_months: productType === "boost" ? 0 : durationMonths,
        discount_percent: productType === "boost" ? 0 : discountPercent,
        coupon_code: couponCode || null,
        amount: totalPrice,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        status: "manual_pending",
      };

      if (productType === "boost") {
        insertPayload.metadata = { boost_type: boostType, boost_count: boostCount };
      }

      const { error } = await supabase.from("subscription_payments").insert(insertPayload);

      if (error) throw error;

      toast.success(language === "bn"
        ? "ম্যানুয়াল পেমেন্ট সাবমিট হয়েছে! এডমিন অনুমোদনের জন্য অপেক্ষা করুন।"
        : "Manual payment submitted! Please wait for admin approval.");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const mobileMethods = [
    { key: "bkash", label: "bKash", number: adminInfo?.payment_bkash, color: "text-pink-600" },
    { key: "nagad", label: "Nagad", number: adminInfo?.payment_nagad, color: "text-orange-600" },
    { key: "rocket", label: "Rocket", number: adminInfo?.payment_rocket, color: "text-purple-600" },
    { key: "upay", label: "Upay", number: adminInfo?.payment_upay, color: "text-green-600" },
  ].filter(m => m.number && m.number.replace(/"/g, "").trim());

  const hasBank = adminInfo?.bank_account_number && adminInfo.bank_account_number.replace(/"/g, "").trim();

  const cleanVal = (v: string) => v?.replace(/^"|"$/g, "").trim() || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Manual Payment"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Amount */}
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "পরিশোধযোগ্য পরিমাণ" : "Amount to Pay"}
              </p>
              <p className="text-3xl font-bold text-primary">৳{totalPrice}</p>
            </div>

            {/* Mobile Banking Numbers */}
            {mobileMethods.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {language === "bn" ? "মোবাইল ব্যাংকিং নম্বর" : "Mobile Banking Numbers"}
                </h3>
                <div className="grid gap-2">
                  {mobileMethods.map(m => (
                    <div key={m.key} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <div>
                        <span className={`font-semibold text-sm ${m.color}`}>{m.label}</span>
                        <p className="text-sm font-mono">{cleanVal(m.number!)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cleanVal(m.number!), m.key)}
                      >
                        {copied === m.key ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bank Account */}
            {hasBank && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  {language === "bn" ? "ব্যাংক একাউন্ট" : "Bank Account"}
                </h3>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  {adminInfo?.bank_name && <p><span className="text-muted-foreground">Bank:</span> {cleanVal(adminInfo.bank_name)}</p>}
                  {adminInfo?.bank_account_name && <p><span className="text-muted-foreground">Name:</span> {cleanVal(adminInfo.bank_account_name)}</p>}
                  <div className="flex items-center justify-between">
                    <p><span className="text-muted-foreground">A/C:</span> {cleanVal(adminInfo!.bank_account_number)}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(cleanVal(adminInfo!.bank_account_number), "bank")}>
                      {copied === "bank" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {adminInfo?.bank_branch && <p><span className="text-muted-foreground">Branch:</span> {cleanVal(adminInfo.bank_branch)}</p>}
                  {adminInfo?.bank_routing_number && <p><span className="text-muted-foreground">Routing:</span> {cleanVal(adminInfo.bank_routing_number)}</p>}
                </div>
              </div>
            )}

            {mobileMethods.length === 0 && !hasBank && (
              <p className="text-center text-muted-foreground py-4">
                {language === "bn" ? "পেমেন্ট তথ্য এখনো সেটআপ হয়নি।" : "Payment information not configured yet."}
              </p>
            )}

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label>{language === "bn" ? "পেমেন্ট মেথড" : "Payment Method"}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "bn" ? "মেথড নির্বাচন করুন" : "Select method"} />
                </SelectTrigger>
                <SelectContent>
                  {mobileMethods.map(m => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                  {hasBank && <SelectItem value="bank_transfer">Bank Transfer</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction ID */}
            <div className="space-y-2">
              <Label>{language === "bn" ? "ট্রানজেকশন আইডি / রেফারেন্স" : "Transaction ID / Reference"}</Label>
              <Input
                placeholder={language === "bn" ? "TRX আইডি লিখুন" : "Enter TRX ID"}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !paymentMethod || !transactionId.trim()}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />{language === "bn" ? "সাবমিট হচ্ছে..." : "Submitting..."}</>
              ) : (
                language === "bn" ? "পেমেন্ট সাবমিট করুন" : "Submit Payment"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {language === "bn"
                ? "সাবমিটের পর এডমিন আপনার পেমেন্ট যাচাই করে সাবস্ক্রিপশন অ্যাক্টিভ করবেন।"
                : "After submission, admin will verify your payment and activate your subscription."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentDialog;
