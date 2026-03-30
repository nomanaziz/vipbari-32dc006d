import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
};

const REMEMBER_KEY = "admin_remembered_email";

const AdminLogin = () => {
  const { signInWithEmail, user, loading: authLoading, role, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && (role === "admin" || role === "employee")) {
      navigate("/admin", { replace: true });
    }
  }, [user, authLoading, role, navigate]);

  useEffect(() => {
    if (!authLoading && user && role && role !== "admin" && role !== "employee") {
      toast.error(t("admin.not_admin_error"));
      signOut();
    }
  }, [user, authLoading, role]);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  }, []);

  if (authLoading) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) return;

    // Validate captcha
    if (parseInt(captchaInput) !== captcha.answer) {
      toast.error(t("admin.captcha_error"));
      refreshCaptcha();
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(email, pin);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      refreshCaptcha();
    } else {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Shield className="h-8 w-8 text-slate-900" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {t("admin.login_title")}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {t("admin.login_desc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-slate-300">{t("auth.pin")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            {/* Math Captcha */}
            <div className="space-y-2">
              <Label className="text-slate-300">{t("admin.captcha")}</Label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 px-4 py-2 rounded-md bg-slate-700 text-amber-400 font-mono text-lg font-bold select-none tracking-wider">
                  {captcha.a} + {captcha.b} = ?
                </div>
                <Input
                  type="number"
                  placeholder="?"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="w-20 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 text-center"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={refreshCaptcha}
                  className="text-slate-400 hover:text-amber-400 shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
                className="border-slate-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <Label htmlFor="remember" className="text-slate-400 text-sm cursor-pointer">
                {t("admin.remember_me")}
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900"
              disabled={loading}
            >
              {loading ? t("common.loading") : t("admin.login_title")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
