import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Zap, Droplets, Flame, Wifi, Shield, Settings2 } from "lucide-react";

interface UtilityItem {
  key: string;
  labelBn: string;
  labelEn: string;
  icon: React.ReactNode;
  unit: string;
  enabled: boolean;
  rate: string;
}

const defaultUtilities: UtilityItem[] = [
  { key: "electricity", labelBn: "বিদ্যুৎ বিল", labelEn: "Electricity Bill", icon: <Zap className="h-4 w-4" />, unit: "৳/unit", enabled: false, rate: "" },
  { key: "water", labelBn: "পানি বিল", labelEn: "Water Bill", icon: <Droplets className="h-4 w-4" />, unit: "৳/month", enabled: false, rate: "" },
  { key: "gas", labelBn: "গ্যাস বিল", labelEn: "Gas Bill", icon: <Flame className="h-4 w-4" />, unit: "৳/month", enabled: false, rate: "" },
  { key: "wifi", labelBn: "ওয়াইফাই বিল", labelEn: "WiFi/Internet", icon: <Wifi className="h-4 w-4" />, unit: "৳/month", enabled: false, rate: "" },
  { key: "generator", labelBn: "জেনারেটর বিল", labelEn: "Generator Bill", icon: <Zap className="h-4 w-4" />, unit: "৳/month", enabled: false, rate: "" },
  { key: "security", labelBn: "সিকিউরিটি গার্ড", labelEn: "Security Guard", icon: <Shield className="h-4 w-4" />, unit: "৳/month", enabled: false, rate: "" },
  { key: "other", labelBn: "অন্যান্য চার্জ", labelEn: "Other Charges", icon: <Settings2 className="h-4 w-4" />, unit: "৳/month", enabled: false, rate: "" },
];

const UtilitySettingsTab = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [utilities, setUtilities] = useState<UtilityItem[]>(defaultUtilities);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("landlord_settings")
        .select("value")
        .eq("owner_id", user.id)
        .eq("key", "utility_config")
        .maybeSingle();

      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        const saved = data.value as Record<string, { enabled: boolean; rate: string }>;
        setUtilities((prev) =>
          prev.map((u) => ({
            ...u,
            enabled: saved[u.key]?.enabled ?? u.enabled,
            rate: saved[u.key]?.rate ?? u.rate,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleUtility = (key: string, checked: boolean) => {
    setUtilities((prev) => prev.map((u) => (u.key === key ? { ...u, enabled: checked } : u)));
  };

  const updateRate = (key: string, rate: string) => {
    setUtilities((prev) => prev.map((u) => (u.key === key ? { ...u, rate } : u)));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const config: Record<string, { enabled: boolean; rate: string }> = {};
      utilities.forEach((u) => {
        config[u.key] = { enabled: u.enabled, rate: u.rate };
      });

      const { error } = await supabase
        .from("landlord_settings")
        .upsert(
          { owner_id: user.id, key: "utility_config", value: config as any, updated_at: new Date().toISOString() },
          { onConflict: "owner_id,key" }
        );

      if (error) throw error;
      toast.success(language === "bn" ? "ইউটিলিটি সেটিংস সেভ হয়েছে" : "Utility settings saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "bn" ? "ইউটিলিটি বিল কনফিগারেশন" : "Utility Bill Configuration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {utilities.map((u) => (
            <div key={u.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:min-w-[180px]">
                <div className="flex items-center gap-2">
                  {u.icon}
                  <Label className="font-medium text-sm">{language === "bn" ? u.labelBn : u.labelEn}</Label>
                </div>
                <Switch checked={u.enabled} onCheckedChange={(c) => toggleUtility(u.key, c)} className="scale-75" />
              </div>
              <div className="flex items-center gap-2 w-full sm:flex-1">
                <Input
                  type="number"
                  placeholder="0"
                  value={u.rate}
                  onChange={(e) => updateRate(u.key, e.target.value)}
                  disabled={!u.enabled}
                  className="w-full sm:max-w-[120px]"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{u.unit}</span>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="mt-4">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Save className="h-4 w-4 mr-2" />
            {language === "bn" ? "সেভ করুন" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilitySettingsTab;
