import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, Phone, Building2, Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface PaymentAccount {
  bkash_number: string;
  nagad_number: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch_name: string;
  routing_number: string;
}

interface TenantPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: any;
  tenantId: string;
  paymentAccount: PaymentAccount | null;
  onSuccess: () => void;
}

export default function TenantPayDialog({
  open, onOpenChange, bill, tenantId, paymentAccount, onSuccess,
}: TenantPayDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = (en: string, bn: string) => (language === "bn" ? bn : en);

  const [method, setMethod] = useState("bkash");
  const [trxId, setTrxId] = useState("");
  const [amount, setAmount] = useState(
    String(Number(bill?.total_amount || 0) - Number(bill?.received_amount || 0))
  );
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const dueAmount = Number(bill?.total_amount || 0) - Number(bill?.received_amount || 0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/payment-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("tenant-documents").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("tenant-documents").getPublicUrl(path);
      setScreenshotUrl(urlData.publicUrl);
      toast.success(t("Screenshot uploaded", "স্ক্রিনশট আপলোড হয়েছে"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!trxId.trim()) {
      toast.error(t("Please enter TRX ID", "অনুগ্রহ করে TRX ID দিন"));
      return;
    }
    if (Number(amount) <= 0 || Number(amount) > dueAmount) {
      toast.error(t("Invalid amount", "অবৈধ পরিমাণ"));
      return;
    }
    setSubmitting(true);
    try {
      const notes = `${method.toUpperCase()} TRX: ${trxId}${screenshotUrl ? ` | Receipt: ${screenshotUrl}` : ""}`;
      const { error } = await supabase.from("payments").insert({
        bill_id: bill.id,
        tenant_id: tenantId,
        owner_id: bill.owner_id,
        amount: Number(amount),
        payment_method: method,
        notes,
        verified: false,
      });
      if (error) throw error;
      toast.success(t("Payment submitted! Awaiting verification.", "পেমেন্ট জমা দেওয়া হয়েছে! যাচাই অপেক্ষমাণ।"));
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Pay Bill", "বিল পরিশোধ")}</DialogTitle>
          <DialogDescription>
            {t(`Due: ৳${dueAmount.toLocaleString()} for ${bill?.month}`, `বকেয়া: ৳${dueAmount.toLocaleString()} — ${bill?.month}`)}
          </DialogDescription>
        </DialogHeader>

        {/* Landlord Payment Info */}
        {paymentAccount && (
          <Card className="border-dashed">
            <CardContent className="p-3 space-y-2 text-sm">
              <p className="font-medium text-foreground">{t("Payment Details", "পেমেন্ট তথ্য")}</p>
              {paymentAccount.bkash_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-pink-500" />
                  <span className="text-muted-foreground">bKash:</span>
                  <span className="font-medium">{paymentAccount.bkash_number}</span>
                </div>
              )}
              {paymentAccount.nagad_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-muted-foreground">Nagad:</span>
                  <span className="font-medium">{paymentAccount.nagad_number}</span>
                </div>
              )}
              {paymentAccount.bank_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  <div>
                    <span className="text-muted-foreground">{paymentAccount.bank_name}</span>
                    {paymentAccount.account_number && <span className="ml-1 font-medium">A/C: {paymentAccount.account_number}</span>}
                    {paymentAccount.account_name && <span className="ml-1 text-muted-foreground">({paymentAccount.account_name})</span>}
                  </div>
                </div>
              )}
              {!paymentAccount.bkash_number && !paymentAccount.nagad_number && !paymentAccount.bank_name && (
                <p className="text-muted-foreground">{t("Landlord has not added payment info yet.", "বাড়িওয়ালা এখনো পেমেন্ট তথ্য যোগ করেননি।")}</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t("Payment Method", "পেমেন্ট পদ্ধতি")}</Label>
            <RadioGroup value={method} onValueChange={setMethod} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="bkash" id="bkash" />
                <Label htmlFor="bkash" className="cursor-pointer">bKash</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="nagad" id="nagad" />
                <Label htmlFor="nagad" className="cursor-pointer">Nagad</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="bank" id="bank" />
                <Label htmlFor="bank" className="cursor-pointer">{t("Bank", "ব্যাংক")}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>{t("Amount (৳)", "পরিমাণ (৳)")}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          {/* TRX ID */}
          <div className="space-y-1.5">
            <Label>{t("Transaction ID (TRX ID)", "ট্রান্সেকশন আইডি (TRX ID)")}</Label>
            <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="e.g. 8N7DK2JF9A" />
          </div>

          {/* Screenshot */}
          <div className="space-y-1.5">
            <Label>{t("Payment Screenshot (optional)", "পেমেন্ট স্ক্রিনশট (ঐচ্ছিক)")}</Label>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {screenshotUrl ? t("Uploaded ✓", "আপলোড হয়েছে ✓") : t("Upload", "আপলোড")}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("Submit Payment", "পেমেন্ট জমা দিন")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
