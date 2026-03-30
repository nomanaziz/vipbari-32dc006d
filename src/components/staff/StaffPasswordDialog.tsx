import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StaffPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  staffUserId: string;
}

const generatePin = () => String(Math.floor(100000 + Math.random() * 900000));

const StaffPasswordDialog = ({ open, onOpenChange, staffName, staffUserId }: StaffPasswordDialogProps) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState(generatePin());
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setPassword(generatePin());
    setCopied(false);
  };

  const handleSetPassword = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-staff-password", {
        body: { staff_user_id: staffUserId, new_password: password },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(t("staff.password_set"));
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (v) { setPassword(generatePin()); setCopied(false); } } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.set_password")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{staffName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("staff.password_min")}</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono text-lg tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy} title="Copy">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleRegenerate} title="Regenerate">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            💡 {t("staff.password_hint")}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSetPassword} disabled={loading || password.length < 6}>
            {loading ? t("common.loading") : t("staff.set_password")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffPasswordDialog;
