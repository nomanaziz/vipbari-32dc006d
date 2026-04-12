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

const PRIORITIES = [
  { value: "low", bn: "কম", en: "Low" },
  { value: "medium", bn: "মাঝারি", en: "Medium" },
  { value: "high", bn: "জরুরি", en: "High" },
  { value: "urgent", bn: "অতি জরুরি", en: "Urgent" },
];

const STATUSES = [
  { value: "pending", bn: "বাকি", en: "Pending" },
  { value: "in_progress", bn: "চলমান", en: "In Progress" },
  { value: "resolved", bn: "সমাধান হয়েছে", en: "Resolved" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: any;
  onSuccess: () => void;
}

export function IssueFormDialog({ open, onOpenChange, issue, onSuccess }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [assetId, setAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      supabase.from("assets").select("id, name").eq("owner_id", user.id).then(({ data }) => setAssets(data || []));
    }
  }, [open, user]);

  useEffect(() => {
    if (issue) {
      setAssetId(issue.asset_id || "");
      setTitle(issue.title || "");
      setDescription(issue.description || "");
      setPriority(issue.priority || "medium");
      setStatus(issue.status || "pending");
    } else {
      setAssetId(""); setTitle(""); setDescription(""); setPriority("medium"); setStatus("pending");
    }
  }, [issue, open]);

  const handleSubmit = async () => {
    if (!assetId || !title.trim() || !user) return;
    setLoading(true);
    const payload = {
      owner_id: user.id,
      asset_id: assetId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      reported_by: user.id,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    };

    let error;
    if (issue) {
      ({ error } = await supabase.from("asset_issues").update(payload).eq("id", issue.id));
    } else {
      ({ error } = await supabase.from("asset_issues").insert(payload));
    }
    setLoading(false);
    if (error) {
      toast.error(L("Failed to save", "সংরক্ষণ ব্যর্থ"));
    } else {
      toast.success(issue ? L("Updated", "আপডেট হয়েছে") : L("Reported", "রিপোর্ট হয়েছে"));
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{issue ? L("Edit Issue", "সমস্যা সম্পাদনা") : L("Report Issue", "সমস্যা রিপোর্ট")}</DialogTitle>
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
          <div>
            <Label>{L("Issue Title", "সমস্যার শিরোনাম")} *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Priority", "অগ্রাধিকার")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{language === "bn" ? p.bn : p.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Status", "অবস্থা")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{language === "bn" ? s.bn : s.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{L("Description", "বিবরণ")}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !assetId || !title.trim()} className="w-full">
            {loading ? L("Saving...", "সংরক্ষণ হচ্ছে...") : issue ? L("Update", "আপডেট") : L("Report", "রিপোর্ট করুন")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
