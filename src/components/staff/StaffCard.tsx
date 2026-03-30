import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { KeyRound, Pencil, Trash2 } from "lucide-react";

interface StaffCardProps {
  staff: any;
  onEdit: () => void;
  onPassword: () => void;
  onDelete: () => void;
}

const StaffCard = ({ staff, onEdit, onPassword, onDelete }: StaffCardProps) => {
  const { t } = useLanguage();
  const profile = staff.profile;
  const initials = (profile?.full_name || "?").slice(0, 2).toUpperCase();
  const permCount = Array.isArray(staff.permission_presets?.permissions) ? staff.permission_presets.permissions.length : 0;
  const permissions = Array.isArray(staff.permission_presets?.permissions) ? staff.permission_presets.permissions : [];
  const isActive = profile?.is_active !== false;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{profile?.full_name || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.phone || profile?.email || "—"}</p>
          </div>
          <Badge variant={isActive ? "default" : "destructive"} className="text-xs shrink-0">
            {isActive ? t("staff.active") : t("staff.inactive")}
          </Badge>
        </div>

        {/* Type & Preset */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {t(`staff.type_${staff.staff_type || "general"}`)}
          </Badge>
          {staff.permission_presets?.name && (
            <Badge variant="secondary" className="text-xs">
              {staff.permission_presets.name}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {permCount} {t("staff.permissions_count")}
          </span>
        </div>

        {/* Permission badges */}
        {permissions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {permissions.slice(0, 3).map((p: string) => (
              <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 font-normal capitalize">
                {p.replace(/_/g, " ")}
              </Badge>
            ))}
            {permissions.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                +{permissions.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1 border-t">
          <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1" onClick={onPassword}>
            <KeyRound className="h-3.5 w-3.5" />
            {t("staff.password")}
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            {t("staff.edit")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive text-xs gap-1">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("staff.remove_confirm")}</AlertDialogTitle>
                <AlertDialogDescription>{t("staff.remove_desc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffCard;
