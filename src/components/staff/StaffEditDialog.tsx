import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const STAFF_TYPES = ["general", "caretaker", "security", "electrician", "cleaner", "plumber"] as const;

interface StaffEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: any[];
  editForm: {
    full_name: string;
    phone: string;
    preset_id: string;
    staff_type: string;
    is_active: boolean;
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("staff.edit")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("auth.name")}</Label>
            <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("auth.phone")}</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>{t("auth.email")}</Label>
              <Input value={email || ""} disabled className="bg-muted" />
            </div>
          </div>
          <div>
            <Label>{t("staff.position")}</Label>
            <Select value={editForm.staff_type} onValueChange={(v) => setEditForm({ ...editForm, staff_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAFF_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{t(`staff.type_${type}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("staff.role_preset")}</Label>
            <Select value={editForm.preset_id} onValueChange={(v) => setEditForm({ ...editForm, preset_id: v })}>
              <SelectTrigger><SelectValue placeholder={t("staff.select_role")} /></SelectTrigger>
              <SelectContent>
                {presets.map((preset: any) => (
                  <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">{t("staff.active")}</Label>
              <p className="text-xs text-muted-foreground">
                {editForm.is_active ? t("staff.active") : t("staff.inactive")}
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
            {isPending ? t("common.loading") : (t("common.save") || "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffEditDialog;
