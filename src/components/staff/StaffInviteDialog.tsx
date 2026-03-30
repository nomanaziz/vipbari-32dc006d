import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

const STAFF_TYPES = ["general", "caretaker", "security", "electrician", "cleaner", "plumber"] as const;

interface StaffInviteDialogProps {
  presets: any[];
  onInvite: (form: any) => void;
  isPending: boolean;
}

const StaffInviteDialog = ({ presets, onInvite, isPending }: StaffInviteDialogProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", preset_id: "", staff_type: "general",
  });

  const handleSubmit = () => {
    onInvite(form);
    setOpen(false);
    setForm({ full_name: "", email: "", phone: "", password: "", preset_id: "", staff_type: "general" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />{t("staff.add_staff")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("staff.add_staff")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("staff.add_desc")}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("auth.name")} *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("auth.phone")} *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>{t("auth.pin")} *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6+ digit PIN" />
          </div>
          <div>
            <Label>{t("staff.position")}</Label>
            <Select value={form.staff_type} onValueChange={(v) => setForm({ ...form, staff_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAFF_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{t(`staff.type_${type}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("staff.role_preset")} *</Label>
            <Select value={form.preset_id} onValueChange={(v) => setForm({ ...form, preset_id: v })}>
              <SelectTrigger><SelectValue placeholder={t("staff.select_role")} /></SelectTrigger>
              <SelectContent>
                {presets.map((preset: any) => (
                  <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending || !form.full_name || !form.phone || !form.password || !form.preset_id}
          >
            {isPending ? t("common.loading") : t("staff.add_staff")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffInviteDialog;
