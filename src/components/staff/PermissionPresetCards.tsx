import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, KeyRound, Shield, Wallet, Eye, Pencil, Plus, Trash2, ChevronDown, ChevronUp, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomPresetDialog from "./CustomPresetDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PERMISSION_GROUPS } from "@/lib/permissionGroups";

interface Preset {
  id: string;
  name: string;
  permissions: any;
  created_by?: string | null;
}

const PRESET_META: Record<string, { icon: React.ElementType; descKey: string; color: string }> = {
  Manager: { icon: Crown, descKey: "staff.preset_manager_desc", color: "text-amber-500" },
  Caretaker: { icon: KeyRound, descKey: "staff.preset_caretaker_desc", color: "text-blue-500" },
  "Guard/Security": { icon: Shield, descKey: "staff.preset_guard_desc", color: "text-green-500" },
  "Rent Collector": { icon: Wallet, descKey: "staff.preset_collector_desc", color: "text-purple-500" },
  Editor: { icon: Pencil, descKey: "staff.preset_editor_desc", color: "text-orange-500" },
  Viewer: { icon: Eye, descKey: "staff.preset_viewer_desc", color: "text-cyan-500" },
  Collector: { icon: Wallet, descKey: "staff.preset_collector_desc", color: "text-purple-500" },
};

interface PermissionPresetCardsProps {
  presets: Preset[];
  selectedId: string;
  onSelect: (id: string) => void;
  showAllPermissions?: boolean;
}

const PermissionPresetCards = ({ presets, selectedId, onSelect, showAllPermissions }: PermissionPresetCardsProps) => {
  const { t, language } = useLanguage();
  const [customOpen, setCustomOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<{ id: string; name: string; permissions: string[] } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("permission_presets").delete().eq("id", deleteId);
      if (error) throw error;
      if (selectedId === deleteId) onSelect("");
      queryClient.invalidateQueries({ queryKey: ["permission-presets"] });
      toast.success(t("staff.delete_preset"));
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (preset: Preset) => {
    const perms = Array.isArray(preset.permissions) ? preset.permissions : [];
    setEditingPreset({ id: preset.id, name: preset.name, permissions: perms });
    setCustomOpen(true);
  };

  const lang = language === "bn" ? "bn" : "en";

  return (
    <div className="space-y-2">
      {!showAllPermissions && (
        <>
          <label className="text-sm font-medium">{t("staff.permissions")}</label>
          <p className="text-xs text-muted-foreground">{t("staff.default_preset")}</p>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        {presets.map((preset) => {
          const meta = PRESET_META[preset.name] || { icon: Eye, descKey: "", color: "text-muted-foreground" };
          const Icon = meta.icon;
          const perms: string[] = Array.isArray(preset.permissions) ? preset.permissions : [];
          const permCount = perms.length;
          const isSelected = selectedId === preset.id;
          const isCustom = !!preset.created_by;
          const isExpanded = expandedId === preset.id;

          return (
            <div key={preset.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => onSelect(preset.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                {isCustom && (
                  <div className="absolute top-1 right-1 flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(preset)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteId(preset.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2 w-full">
                  <div className={cn("rounded-md bg-muted p-1.5", meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{preset.name}</span>
                </div>
                {meta.descKey && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{t(meta.descKey)}</p>
                )}
                <div className="flex items-center gap-2 w-full">
                  <Badge variant="secondary" className="text-xs">
                    {permCount} {t("staff.permissions_count")}
                  </Badge>
                  {showAllPermissions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-muted-foreground ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : preset.id);
                      }}
                    >
                      {t("staff.all_permissions")}
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </Button>
                  )}
                </div>
              </button>
              {showAllPermissions && isExpanded && (
                <div className="mt-1 p-3 rounded-md bg-muted/50 border space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupPerms = group.permissions;
                    const hasAny = groupPerms.some((p) => perms.includes(p.key));
                    if (!hasAny && groupPerms.every((p) => !perms.includes(p.key))) {
                      // Show group but all unchecked
                    }
                    return (
                      <div key={group.key}>
                        <p className="text-xs font-semibold text-foreground mb-1">
                          {lang === "bn" ? group.label_bn : group.label_en}
                        </p>
                        <div className="space-y-0.5 pl-2">
                          {groupPerms.map((perm) => {
                            const has = perms.includes(perm.key);
                            return (
                              <div key={perm.key} className="flex items-center gap-2 text-xs">
                                {has ? (
                                  <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                )}
                                <span className={cn(has ? "text-foreground" : "text-muted-foreground")}>
                                  {lang === "bn" ? perm.label_bn : perm.label_en}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => { setEditingPreset(null); setCustomOpen(true); }}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-3 text-center transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md"
        >
          <div className="rounded-md bg-muted p-1.5">
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium text-sm text-muted-foreground">{t("staff.create_preset")}</span>
        </button>
      </div>

      <CustomPresetDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["permission-presets"] })}
        editingPreset={editingPreset}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("staff.delete_preset")}
        description={t("staff.delete_preset_confirm")}
        isPending={deleting}
      />
    </div>
  );
};

export default PermissionPresetCards;
