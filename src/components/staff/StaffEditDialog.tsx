import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface StaffEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: any[];
  editForm: {
    full_name: string;
    phone: string;
    preset_id: string;
    is_active: boolean;
    permanent_address: string;
    present_address: string;
    nid_number: string;
    doc_type: string;
    date_of_birth: string;
    salary: string;
    joining_date: string;
  };
  setEditForm: (form: any) => void;
  onSave: () => void;
  isPending: boolean;
  email?: string;
}

const StaffEditDialog = ({ open, onOpenChange, presets, editForm, setEditForm, onSave, isPending, email }: StaffEditDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>স্টাফ সম্পাদনা / Edit Staff</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Basic */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">মৌলিক তথ্য / Basic Info</p>
          <div>
            <Label>নাম / Name</Label>
            <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>মোবাইল / Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>ইমেইল / Email</Label>
              <Input value={email || ""} disabled className="bg-muted" />
            </div>
          </div>
          <div>
            <Label>পদবী / Role</Label>
            <Select value={editForm.preset_id} onValueChange={(v) => setEditForm({ ...editForm, preset_id: v })}>
              <SelectTrigger><SelectValue placeholder="রোল নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {presets.map((preset: any) => (
                  <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personal */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">ব্যক্তিগত তথ্য / Personal Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>জন্ম তারিখ / Date of Birth</Label>
              <Input type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label>যোগদান / Joining Date</Label>
              <Input type="date" value={editForm.joining_date} onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ডকুমেন্ট টাইপ</Label>
              <Select value={editForm.doc_type} onValueChange={(v) => setEditForm({ ...editForm, doc_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nid">NID / জাতীয় পরিচয়পত্র</SelectItem>
                  <SelectItem value="birth_certificate">জন্ম নিবন্ধন</SelectItem>
                  <SelectItem value="passport">পাসপোর্ট</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ডকুমেন্ট নম্বর</Label>
              <Input value={editForm.nid_number} onChange={(e) => setEditForm({ ...editForm, nid_number: e.target.value })} />
            </div>
          </div>

          {/* Address */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">ঠিকানা / Address</p>
          <div>
            <Label>স্থায়ী ঠিকানা</Label>
            <Textarea value={editForm.permanent_address} onChange={(e) => setEditForm({ ...editForm, permanent_address: e.target.value })} className="min-h-[60px]" />
          </div>
          <div>
            <Label>বর্তমান ঠিকানা</Label>
            <Textarea value={editForm.present_address} onChange={(e) => setEditForm({ ...editForm, present_address: e.target.value })} className="min-h-[60px]" />
          </div>

          {/* Salary */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">বেতন / Salary</p>
          <div>
            <Label>মাসিক বেতন (৳)</Label>
            <Input type="number" value={editForm.salary} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">সক্রিয় / Active</Label>
              <p className="text-xs text-muted-foreground">
                {editForm.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </p>
            </div>
            <Switch
              checked={editForm.is_active}
              onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
            />
          </div>

          <Button
            className="w-full"
            onClick={onSave}
            disabled={isPending || !editForm.full_name || !editForm.preset_id}
          >
            {isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন / Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffEditDialog;
