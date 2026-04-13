import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save } from "lucide-react";
import AdvanceSettingsTab from "@/components/settings/AdvanceSettingsTab";

const defaultSettings = {
  app_name: "VIP Bari",
  support_email: "support@vipbari.com",
  support_phone: "+880 1700-000000",
  sms_api_key: "",
  sms_sender_id: "",
  payment_bkash: "",
  payment_nagad: "",
  payment_rocket: "",
  payment_upay: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_branch: "",
  bank_routing_number: "",
  maintenance_mode: "false",
  announcement: "",
  product_room_enabled: "true",
  product_tolet_enabled: "true",
  product_sale_listing_enabled: "true",
  product_boost_enabled: "true",
  product_sms_enabled: "false",
};

const AdminSettings = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(defaultSettings);

  const { data: dbSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      return data || [];
    },
  });

  useEffect(() => {
    if (dbSettings) {
      const merged = { ...defaultSettings };
      dbSettings.forEach((s: any) => {
        if (s.key in merged) {
          (merged as any)[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
        }
      });
      setSettings(merged);
    }
  }, [dbSettings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(settings)) {
        const existing = dbSettings?.find((s: any) => s.key === key);
        if (existing) {
          await supabase.from("site_settings").update({ value: value as any }).eq("id", existing.id);
        } else {
          await supabase.from("site_settings").insert({ key, value: value as any });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(t("admin.settings_saved"));
    },
    onError: () => toast.error(t("admin.settings_error")),
  });

  const update = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.settings")}</h1>
        <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
          <Save className="mr-2 h-4 w-4" />{t("common.save")}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>{t("admin.general_settings")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label>{t("admin.app_name")}</Label>
              <Input value={settings.app_name} onChange={(e) => update("app_name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("admin.support_email")}</Label>
                <Input value={settings.support_email} onChange={(e) => update("support_email", e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.support_phone")}</Label>
                <Input value={settings.support_phone} onChange={(e) => update("support_phone", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{t("admin.announcement")}</Label>
              <Textarea value={settings.announcement} onChange={(e) => update("announcement", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("admin.sms_config")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("admin.sms_api_key")}</Label>
                <Input type="password" value={settings.sms_api_key} onChange={(e) => update("sms_api_key", e.target.value)} />
              </div>
              <div>
                <Label>{t("admin.sms_sender")}</Label>
                <Input value={settings.sms_sender_id} onChange={(e) => update("sms_sender_id", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("admin.payment_config")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Mobile Banking</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>bKash {t("admin.merchant_number")}</Label>
                <Input value={settings.payment_bkash} onChange={(e) => update("payment_bkash", e.target.value)} />
              </div>
              <div>
                <Label>Nagad {t("admin.merchant_number")}</Label>
                <Input value={settings.payment_nagad} onChange={(e) => update("payment_nagad", e.target.value)} />
              </div>
              <div>
                <Label>Rocket {t("admin.merchant_number")}</Label>
                <Input value={settings.payment_rocket} onChange={(e) => update("payment_rocket", e.target.value)} />
              </div>
              <div>
                <Label>Upay {t("admin.merchant_number")}</Label>
                <Input value={settings.payment_upay} onChange={(e) => update("payment_upay", e.target.value)} />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground mt-4">Bank Account</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input value={settings.bank_name} onChange={(e) => update("bank_name", e.target.value)} />
              </div>
              <div>
                <Label>Account Name</Label>
                <Input value={settings.bank_account_name} onChange={(e) => update("bank_account_name", e.target.value)} />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input value={settings.bank_account_number} onChange={(e) => update("bank_account_number", e.target.value)} />
              </div>
              <div>
                <Label>Branch Name</Label>
                <Input value={settings.bank_branch} onChange={(e) => update("bank_branch", e.target.value)} />
              </div>
              <div>
                <Label>Routing Number</Label>
                <Input value={settings.bank_routing_number} onChange={(e) => update("bank_routing_number", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Control */}
        <Card>
          <CardHeader><CardTitle>{language === "bn" ? "প্রোডাক্ট নিয়ন্ত্রণ" : "Product Control"}</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-muted-foreground">
              {language === "bn" ? "যে প্রোডাক্ট বন্ধ করবেন সেটা গ্রাহকের সাবস্ক্রিপশন পেজে দেখাবে না।" : "Disabled products will be hidden from the subscription page."}
            </p>
            {[
              { key: "product_room_enabled", label: "Room/Flat", labelBn: "রুম/ফ্ল্যাট" },
              { key: "product_tolet_enabled", label: "To-Let", labelBn: "টু-লেট" },
              { key: "product_sale_listing_enabled", label: "Sale Listing", labelBn: "বিক্রয় লিস্টিং" },
              { key: "product_boost_enabled", label: "Boost", labelBn: "বুস্ট" },
              { key: "product_sms_enabled", label: "SMS (API)", labelBn: "SMS (API)" },
            ].map((product) => (
              <div key={product.key} className="flex items-center justify-between">
                <Label>{language === "bn" ? product.labelBn : product.label}</Label>
                <Switch
                  checked={settings[product.key as keyof typeof settings] === "true"}
                  onCheckedChange={(checked) => update(product.key, checked ? "true" : "false")}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Backup & Restore */}
        <AdvanceSettingsTab isAdmin />
      </div>
    </div>
  );
};

export default AdminSettings;
