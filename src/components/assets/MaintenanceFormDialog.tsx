import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SCHEDULE_TYPES = [
  { value: "one_time", bn: "একবার", en: "One Time" },
  { value: "monthly", bn: "মাসিক", en: "Monthly" },
  { value: "quarterly", bn: "ত্রৈমাসিক", en: "Quarterly" },
  { value: "half_year", bn: "ছয় মাসে", en: "Half Yearly" },
  { value: "yearly", bn: "বার্ষিক", en: "Yearly" },
];

const STATUSES = [
  { value: "pending", bn: "বাকি", en: "Pending" },
  { value: "completed", bn: "সম্পন্ন", en: "Completed" },
  { value: "overdue", bn: "মেয়াদ উত্তীর্ণ", en: "Overdue" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: any;
  onSuccess: () => void;
}

export function MaintenanceFormDialog({ open, onOpenChange, record, onSuccess }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [assetId, setAssetId] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleType, setScheduleType] = useState("one_time");
  const [status, setStatus] = useState("pending");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      supabase.from("assets").select("id, name").eq("owner_id", user.id).then(({ data }) => setAssets(data || []));
    }
  }, [open, user]);

  useEffect(() => {
    if (record) {
      setAssetId(record.asset_id || "");
      setMaintenanceDate(record.maintenance_date || new Date().toISOString().split("T")[0]);
      setScheduleType(record.schedule_type || "one_time");
      setStatus(record.status || "pending");
      setAmount(record.amount || 0);
      setDescription(record.description || "");
    } else {
      setAssetId(""); setMaintenanceDate(new Date().toISOString().split("T")[0]);
      setScheduleType("one_time"); setStatus("pending"); setAmount(0); setDescription("");
    }
  }, [record, open]);

  const handleSubmit = async () => {
    if (!assetId || !user) return;
    setLoading(true);
    const payload = {
      owner_id: user.id,
      asset_id: assetId,
      maintenance_date: maintenanceDate,
      schedule_type: scheduleType,
      status,
      amount,
      description: description.trim(),
      completed_at: status === "completed" ? new Date().toISOString() : null,
    };

    let error;
    if (record) {
      ({ error } = await supabase.from("asset_maintenance").update(payload).eq("id", record.id));
    } else {
      ({ error } = await supabase.from("asset_maintenance").insert(payload));
    }
    setLoading(false);
    if (error) {
      toast.error(L("Failed to save", "সংরক্ষণ ব্যর্থ"));
    } else {
      toast.success(record ? L("Updated", "আপডেট হয়েছে") : L("Added", "যোগ হয়েছে"));
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{record ? L("Edit Maintenance", "রক্ষণাবেক্ষণ সম্পাদনা") : L("Add Maintenance", "রক্ষণাবেক্ষণ যোগ করুন")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{L("Asset", "সম্পদ")} *</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue placeholder={L("Select asset", "সম্পদ নির্বাচন")} /></SelectTrigger>
              <SelectContent>
                {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Date", "তারিখ")}</Label>
              <Input type="date" value={maintenanceDate} onChange={e => setMaintenanceDate(e.target.value)} />
            </div>
            <div>
              <Label>{L("Schedule", "সময়সূচী")}</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{language === "bn" ? s.bn : s.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Status", "অবস্থা")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{language === "bn" ? s.bn : s.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Amount (৳)", "খরচ (৳)")}</Label>
              <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>{L("Description", "বিবরণ")}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !assetId} className="w-full">
            {loading ? L("Saving...", "সংরক্ষণ হচ্ছে...") : record ? L("Update", "আপডেট") : L("Add", "যোগ করুন")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
