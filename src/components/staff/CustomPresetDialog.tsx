import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PERMISSION_GROUPS } from "@/lib/permissionGroups";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditingPreset {
  id: string;
  name: string;
  permissions: string[];
}

interface CustomPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  editingPreset?: EditingPreset | null;
}

const CustomPresetDialog = ({ open, onOpenChange, onCreated, editingPreset }: CustomPresetDialogProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const lang = language === "bn" ? "bn" : "en";

  useEffect(() => {
    if (open && editingPreset) {
      setName(editingPreset.name);
      setSelected(editingPreset.permissions);
      setExpandedGroups(PERMISSION_GROUPS.map((g) => g.key));
    } else if (open && !editingPreset) {
      setName("");
      setSelected([]);
      setExpandedGroups(PERMISSION_GROUPS.map((g) => g.key));
    } else if (!open) {
      setName("");
      setSelected([]);
      setExpandedGroups([]);
    }
  }, [open, editingPreset]);

  const toggle = (perm: string) => {
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroup = (groupKey: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.key === groupKey);
    if (!group) return;
    const groupKeys = group.permissions.map((p) => p.key);
    const allSelected = groupKeys.every((k) => selected.includes(k));
    if (allSelected) {
      setSelected((prev) => prev.filter((p) => !groupKeys.includes(p)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...groupKeys])]);
    }
  };

  const toggleExpand = (groupKey: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    try {
      if (editingPreset) {
        const { error } = await supabase.from("permission_presets").update({
          name: name.trim(),
          permissions: selected,
        } as any).eq("id", editingPreset.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("permission_presets").insert({
          name: name.trim(),
          permissions: selected,
          scope: "landlord",
          created_by: user!.id,
        } as any);
        if (error) throw error;
      }
      toast.success(t("staff.save_preset"));
      onCreated();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save preset");
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!editingPreset;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("staff.edit_preset") : t("staff.create_preset")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("staff.preset_name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("staff.preset_name")} />
          </div>
          <div>
            <Label className="mb-2 block">{t("staff.permissions")}</Label>
            <div className="space-y-1 rounded-lg border">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key);
                const allChecked = groupKeys.every((k) => selected.includes(k));
                const someChecked = groupKeys.some((k) => selected.includes(k));
                const isExpanded = expandedGroups.includes(group.key);

                return (
                  <div key={group.key} className="border-b last:border-b-0">
                    <div
                      className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(group.key)}
                    >
                      <Checkbox
                        checked={allChecked}
                        // @ts-ignore
                        indeterminate={someChecked && !allChecked}
                        onCheckedChange={(e) => {
                          e; // prevent propagation handled below
                          toggleGroup(group.key);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                      <span className="font-medium text-sm flex-1">
                        {lang === "bn" ? group.label_bn : group.label_en}
                      </span>
                      <Badge count={`${groupKeys.filter((k) => selected.includes(k)).length}/${groupKeys.length}`} />
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {isExpanded && (
                      <div className="pl-8 pr-3 pb-2 space-y-1">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-2 rounded-md p-1.5 cursor-pointer hover:bg-muted/50 text-sm"
                          >
                            <Checkbox
                              checked={selected.includes(perm.key)}
                              onCheckedChange={() => toggle(perm.key)}
                            />
                            <span>{lang === "bn" ? perm.label_bn : perm.label_en}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} disabled={loading || !name.trim() || selected.length === 0}>
            {loading ? t("common.loading") : t("staff.save_preset")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Small helper for count badge
function Badge({ count }: { count: string }) {
  return (
    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
      {count}
    </span>
  );
}

export default CustomPresetDialog;
