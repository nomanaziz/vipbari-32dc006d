import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the redirect link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check if we already have a recovery session (hash params)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPin.length < 6) {
      toast.error(t("auth.pin_min_length"));
      return;
    }

    if (newPin !== confirmPin) {
      toast.error(t("auth.pin_mismatch"));
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPin });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("auth.pin_reset_success"));
    navigate("/login");
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-primary/10">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Home className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                {t("auth.reset_pin")}
              </CardTitle>
              <CardDescription>{t("auth.reset_link_invalid")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/forgot-password" className="block">
                <Button className="w-full">{t("auth.request_new_link")}</Button>
              </Link>
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4 hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
                {t("auth.back_to_login")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/30">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-primary/10">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Home className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t("auth.reset_pin")}
            </CardTitle>
            <CardDescription>{t("auth.enter_new_pin")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPin">{t("auth.new_pin")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPin"
                    type="password"
                    placeholder="••••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPin">{t("auth.confirm_pin")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPin"
                    type="password"
                    placeholder="••••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? t("common.loading") : t("auth.reset_pin_btn")}
              </Button>
            </form>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6 hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              {t("auth.back_to_login")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
