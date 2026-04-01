import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface StaffInviteDialogProps {
  presets: any[];
  onInvite: (form: any) => void;
  isPending: boolean;
}

const StaffInviteDialog = ({ presets, onInvite, isPending }: StaffInviteDialogProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", preset_id: "",
    permanent_address: "", present_address: "", nid_number: "", doc_type: "nid",
    date_of_birth: "", salary: "", joining_date: "",
  });

  const handleSubmit = () => {
    onInvite(form);
    setOpen(false);
    setForm({
      full_name: "", email: "", phone: "", password: "", preset_id: "",
      permanent_address: "", present_address: "", nid_number: "", doc_type: "nid",
      date_of_birth: "", salary: "", joining_date: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />স্টাফ যোগ করুন</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>স্টাফ যোগ করুন / Add Staff</DialogTitle>
          <p className="text-sm text-muted-foreground">স্টাফের সম্পূর্ণ তথ্য দিন</p>
        </DialogHeader>
        <div className="space-y-4">
          {/* Basic Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">মৌলিক তথ্য / Basic Info</p>
          <div>
            <Label>নাম / Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>মোবাইল / Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>ইমেইল / Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>পিন / PIN *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6+ digit PIN" />
            </div>
            <div>
              <Label>পদবী / Role *</Label>
              <Select value={form.preset_id} onValueChange={(v) => setForm({ ...form, preset_id: v })}>
                <SelectTrigger><SelectValue placeholder="রোল নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {presets.map((preset: any) => (
                    <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal Details */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">ব্যক্তিগত তথ্য / Personal Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>জন্ম তারিখ / Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label>যোগদানের তারিখ / Joining Date</Label>
              <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ডকুমেন্ট টাইপ / Doc Type</Label>
              <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nid">NID / জাতীয় পরিচয়পত্র</SelectItem>
                  <SelectItem value="birth_certificate">জন্ম নিবন্ধন / Birth Certificate</SelectItem>
                  <SelectItem value="passport">পাসপোর্ট / Passport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ডকুমেন্ট নম্বর / Doc Number</Label>
              <Input value={form.nid_number} onChange={(e) => setForm({ ...form, nid_number: e.target.value })} placeholder="NID / Birth / Passport No." />
            </div>
          </div>

          {/* Address */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">ঠিকানা / Address</p>
          <div>
            <Label>স্থায়ী ঠিকানা / Permanent Address</Label>
            <Textarea value={form.permanent_address} onChange={(e) => setForm({ ...form, permanent_address: e.target.value })} className="min-h-[60px]" />
          </div>
          <div>
            <Label>বর্তমান ঠিকানা / Present Address</Label>
            <Textarea value={form.present_address} onChange={(e) => setForm({ ...form, present_address: e.target.value })} className="min-h-[60px]" />
          </div>

          {/* Salary */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">বেতন / Salary</p>
          <div>
            <Label>মাসিক বেতন / Monthly Salary (৳)</Label>
            <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="0" />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending || !form.full_name || !form.phone || !form.password || !form.preset_id}
          >
            {isPending ? "প্রক্রিয়াকরণ..." : "স্টাফ যোগ করুন / Add Staff"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffInviteDialog;
