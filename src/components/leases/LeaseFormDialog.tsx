import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface LeaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: any;
  properties: any[];
}

export function LeaseFormDialog({ open, onOpenChange, editData, properties }: LeaseFormDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;
  const isEdit = !!editData;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenant_name: "",
    property_id: "",
    unit_flat: "",
    monthly_rent: "",
    security_deposit: "",
    advance_amount: "",
    start_date: "",
    end_date: "",
    notice_period: "2 Months",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        tenant_name: editData.tenant_name || "",
        property_id: editData.property_id || "",
        unit_flat: editData.unit_flat || "",
        monthly_rent: String(editData.monthly_rent || ""),
        security_deposit: String(editData.security_deposit || ""),
        advance_amount: String(editData.advance_amount || ""),
        start_date: editData.start_date || "",
        end_date: editData.end_date || "",
        notice_period: editData.notice_period || "2 Months",
        status: editData.status || "active",
        notes: editData.notes || "",
      });
    } else {
      setForm({
        tenant_name: "", property_id: "", unit_flat: "", monthly_rent: "",
        security_deposit: "", advance_amount: "", start_date: "", end_date: "",
        notice_period: "2 Months", status: "active", notes: "",
      });
    }
  }, [editData, open]);

  const handleSubmit = async () => {
    if (!form.tenant_name.trim()) {
      toast.error(L("Tenant name is required", "ভাড়াটিয়ার নাম প্রয়োজন"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        owner_id: user!.id,
        tenant_name: form.tenant_name.trim(),
        property_id: form.property_id || null,
        unit_flat: form.unit_flat,
        monthly_rent: Number(form.monthly_rent) || 0,
        security_deposit: Number(form.security_deposit) || 0,
        advance_amount: Number(form.advance_amount) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        notice_period: form.notice_period,
        status: form.status,
        notes: form.notes,
      };

      if (isEdit) {
        const { error } = await supabase.from("leases").update(payload).eq("id", editData.id);
        if (error) throw error;
        toast.success(L("Lease updated", "লিজ আপডেট হয়েছে"));
      } else {
        const { error } = await supabase.from("leases").insert(payload);
        if (error) throw error;
        toast.success(L("Lease created", "লিজ তৈরি হয়েছে"));
      }
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || L("Something went wrong", "কিছু সমস্যা হয়েছে"));
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? L("Edit Lease", "লিজ সম্পাদনা") : L("Create New Lease", "নতুন লিজ তৈরি করুন")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{L("Tenant Name", "ভাড়াটিয়ার নাম")} *</Label>
            <Input placeholder="e.g. Rahim Uddin" value={form.tenant_name} onChange={(e) => update("tenant_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Property", "সম্পত্তি")}</Label>
              <Select value={form.property_id} onValueChange={(v) => update("property_id", v)}>
                <SelectTrigger><SelectValue placeholder={L("Select", "নির্বাচন করুন")} /></SelectTrigger>
                <SelectContent>
                  {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Unit / Flat", "ইউনিট / ফ্ল্যাট")}</Label>
              <Input placeholder="e.g. 3A" value={form.unit_flat} onChange={(e) => update("unit_flat", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Monthly Rent (৳)", "মাসিক ভাড়া (৳)")}</Label>
              <Input type="number" placeholder="0" value={form.monthly_rent} onChange={(e) => update("monthly_rent", e.target.value)} />
            </div>
            <div>
              <Label>{L("Security Deposit (৳)", "সিকিউরিটি ডিপোজিট (৳)")}</Label>
              <Input type="number" placeholder="0" value={form.security_deposit} onChange={(e) => update("security_deposit", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Start Date", "শুরুর তারিখ")}</Label>
              <Input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
            </div>
            <div>
              <Label>{L("End Date", "শেষ তারিখ")}</Label>
              <Input type="date" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Notice Period", "নোটিশ পিরিয়ড")}</Label>
              <Select value={form.notice_period} onValueChange={(v) => update("notice_period", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Month">{L("1 Month", "১ মাস")}</SelectItem>
                  <SelectItem value="2 Months">{L("2 Months", "২ মাস")}</SelectItem>
                  <SelectItem value="3 Months">{L("3 Months", "৩ মাস")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div>
                <Label>{L("Status", "অবস্থা")}</Label>
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{L("Active", "সক্রিয়")}</SelectItem>
                    <SelectItem value="expired">{L("Expired", "মেয়াদোত্তীর্ণ")}</SelectItem>
                    <SelectItem value="terminated">{L("Terminated", "বাতিল")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{L("Cancel", "বাতিল")}</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? L("Saving...", "সেভ হচ্ছে...") : isEdit ? L("Update Lease", "লিজ আপডেট") : L("Create Lease", "লিজ তৈরি")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
