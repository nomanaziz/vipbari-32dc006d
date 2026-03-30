import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Upload, Database, Loader2, Globe, Users, Home, FileText } from "lucide-react";

interface BackupStats {
  tenants: number;
  rooms: number;
  bills: number;
  totalAmount: number;
}

interface AdvanceSettingsTabProps {
  isAdmin?: boolean;
}

const AdvanceSettingsTab = ({ isAdmin = false }: AdvanceSettingsTabProps) => {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<BackupStats>({ tenants: 0, rooms: 0, bills: 0, totalAmount: 0 });
  const [dataType, setDataType] = useState("all");
  const [format, setFormat] = useState("json");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      const ownerFilter = isAdmin ? {} : { owner_id: user.id };

      const [tenantsRes, roomsRes, billsRes] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }).match(ownerFilter),
        isAdmin
          ? supabase.from("rooms").select("id", { count: "exact", head: true })
          : supabase.from("rooms").select("id, property_id, properties!inner(owner_id)", { count: "exact", head: true }).eq("properties.owner_id", user.id),
        supabase.from("bills").select("total_amount").match(ownerFilter),
      ]);

      const totalAmount = (billsRes.data || []).reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);
      setStats({
        tenants: tenantsRes.count || 0,
        rooms: roomsRes.count || 0,
        bills: (billsRes.data || []).length,
        totalAmount,
      });
      setLoadingStats(false);
    };
    loadStats();
  }, [user, isAdmin]);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/export-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ data_type: dataType, format }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${dataType}_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(language === "bn" ? "ডাটা ডাউনলোড হয়েছে" : "Data exported successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/import-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ backup: json }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }

      toast.success(language === "bn" ? "ডাটা রিস্টোর হয়েছে" : "Data restored successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Language */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              {language === "bn" ? "ভাষা সেটিংস" : "Language Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant={language === "bn" ? "default" : "outline"}
                onClick={() => setLanguage("bn")}
              >
                বাংলা
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            {language === "bn" ? "ডাটা ব্যাকআপ" : "Data Backup"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          {loadingStats ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{stats.tenants}</p>
                <p className="text-xs text-muted-foreground">{language === "bn" ? "ভাড়াটিয়া" : "Tenants"}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <Home className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{stats.rooms}</p>
                <p className="text-xs text-muted-foreground">{language === "bn" ? "রুম/ফ্ল্যাট" : "Rooms"}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{stats.bills}</p>
                <p className="text-xs text-muted-foreground">{language === "bn" ? "বিল" : "Bills"}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <span className="text-lg font-bold text-primary">৳</span>
                <p className="text-lg font-bold">{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{language === "bn" ? "মোট টাকা" : "Total Amount"}</p>
              </div>
            </div>
          )}

          {/* Export controls */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label>{language === "bn" ? "ডাটার ধরণ" : "Data Type"}</Label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "bn" ? "সব" : "All"}</SelectItem>
                  <SelectItem value="tenants">{language === "bn" ? "ভাড়াটিয়া" : "Tenants"}</SelectItem>
                  <SelectItem value="rooms">{language === "bn" ? "রুম" : "Rooms"}</SelectItem>
                  <SelectItem value="bills">{language === "bn" ? "বিল" : "Bills"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{language === "bn" ? "ফরম্যাট" : "Format"}</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {language === "bn" ? "ডাউনলোড" : "Download"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            {language === "bn" ? "ডাটা রিস্টোর" : "Data Restore"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "আগে ডাউনলোড করা JSON ব্যাকআপ ফাইল আপলোড করুন।"
              : "Upload a previously downloaded JSON backup file to restore data."}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {language === "bn" ? "ফাইল আপলোড করুন" : "Upload File"}
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvanceSettingsTab;
