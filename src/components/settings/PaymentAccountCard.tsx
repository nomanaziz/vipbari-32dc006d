import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function PaymentAccountCard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = (en: string, bn: string) => (language === "bn" ? bn : en);

  const [bkash, setBkash] = useState("");
  const [nagad, setNagad] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchName, setBranchName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payment_accounts")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBkash(data.bkash_number);
          setNagad(data.nagad_number);
          setBankName(data.bank_name);
          setAccountName(data.account_name);
          setAccountNumber(data.account_number);
          setBranchName(data.branch_name);
          setRoutingNumber(data.routing_number);
        }
        setLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id,
        bkash_number: bkash,
        nagad_number: nagad,
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        branch_name: branchName,
        routing_number: routingNumber,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("payment_accounts")
        .upsert(payload, { onConflict: "owner_id" });
      if (error) throw error;
      toast.success(t("Payment info saved", "পেমেন্ট তথ্য সংরক্ষিত"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          {t("Payment Information", "পেমেন্ট তথ্য")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("Your tenants will see this info when paying bills.", "আপনার ভাড়াটিয়ারা বিল পরিশোধের সময় এই তথ্য দেখবে।")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>bKash {t("Number", "নম্বর")}</Label>
            <Input value={bkash} onChange={(e) => setBkash(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label>Nagad {t("Number", "নম্বর")}</Label>
            <Input value={nagad} onChange={(e) => setNagad(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium">{t("Bank Account", "ব্যাংক অ্যাকাউন্ট")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("Bank Name", "ব্যাংকের নাম")}</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Account Name", "অ্যাকাউন্টের নাম")}</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Account Number", "অ্যাকাউন্ট নম্বর")}</Label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Branch Name", "শাখার নাম")}</Label>
              <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Routing Number", "রাউটিং নম্বর")}</Label>
              <Input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {t("Save Payment Info", "পেমেন্ট তথ্য সংরক্ষণ করুন")}
        </Button>
      </CardContent>
    </Card>
  );
}
