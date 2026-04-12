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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any;
  onSuccess: () => void;
}

export function ClockEntryDialog({ open, onOpenChange, entry, onSuccess }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [serviceId, setServiceId] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      supabase.from("services").select("id, contact_name, service_type").eq("owner_id", user.id).then(({ data }) => setServices(data || []));
    }
  }, [open, user]);

  useEffect(() => {
    if (entry) {
      setServiceId(entry.service_id || "");
      setClockIn(entry.clock_in ? new Date(entry.clock_in).toISOString().slice(0, 16) : "");
      setClockOut(entry.clock_out ? new Date(entry.clock_out).toISOString().slice(0, 16) : "");
      setNotes(entry.notes || "");
    } else {
      setServiceId(""); setClockIn(""); setClockOut(""); setNotes("");
    }
  }, [entry, open]);

  const handleSubmit = async () => {
    if (!serviceId || !clockIn || !user) return;
    setLoading(true);
    const payload = {
      owner_id: user.id,
      service_id: serviceId,
      clock_in: new Date(clockIn).toISOString(),
      clock_out: clockOut ? new Date(clockOut).toISOString() : null,
      notes: notes.trim(),
    };

    let error;
    if (entry) {
      ({ error } = await supabase.from("service_clock_entries").update(payload).eq("id", entry.id));
    } else {
      ({ error } = await supabase.from("service_clock_entries").insert(payload));
    }
    setLoading(false);
    if (error) {
      toast.error(L("Failed to save", "সংরক্ষণ ব্যর্থ"));
    } else {
      toast.success(entry ? L("Updated", "আপডেট হয়েছে") : L("Added", "যোগ হয়েছে"));
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? L("Edit Entry", "এন্ট্রি সম্পাদনা") : L("Add Clock Entry", "ক্লক এন্ট্রি যোগ")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{L("Service Person", "সেবা প্রদানকারী")} *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger><SelectValue placeholder={L("Select", "নির্বাচন")} /></SelectTrigger>
              <SelectContent>
                {services.map(s => <SelectItem key={s.id} value={s.id}>{s.contact_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Clock In", "প্রবেশ")} *</Label>
              <Input type="datetime-local" value={clockIn} onChange={e => setClockIn(e.target.value)} />
            </div>
            <div>
              <Label>{L("Clock Out", "প্রস্থান")}</Label>
              <Input type="datetime-local" value={clockOut} onChange={e => setClockOut(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{L("Notes", "নোট")}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !serviceId || !clockIn} className="w-full">
            {loading ? L("Saving...", "সংরক্ষণ হচ্ছে...") : entry ? L("Update", "আপডেট") : L("Add", "যোগ করুন")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
