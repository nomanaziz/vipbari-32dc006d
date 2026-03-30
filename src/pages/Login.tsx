import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, User, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { signIn, signInWithEmail, user, loading: authLoading, role } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isLoggingIn) {
      toast.info("You are already logged in");
      const target = (role === "admin" || role === "employee") ? "/admin" : "/dashboard";
      navigate(target, { replace: true });
    }
  }, [user, authLoading, role, navigate, isLoggingIn]);

  if (authLoading || (user && !isLoggingIn)) return null;

  const isEmail = (value: string) => value.includes("@");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !pin) return;
    setIsLoggingIn(true);
    setLoading(true);
    setShowResendVerification(false);

    let result: { error: string | null };
    if (isEmail(identifier)) {
      result = await signInWithEmail(identifier, pin);
    } else {
      result = await signIn(identifier, pin);
    }

    if (!result.error) {
      // Check if user is admin/employee — block them from regular login
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id);
        const isAdminOrEmployee = roles?.some(r => ["admin", "employee"].includes(r.role));
        if (isAdminOrEmployee) {
          await supabase.auth.signOut();
          setLoading(false);
          setIsLoggingIn(false);
          toast.error("This account is not allowed to log in here. Please use the admin panel.");
          return;
        }
      }
    }

    setLoading(false);
    setIsLoggingIn(false);
    if (result.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setShowResendVerification(true);
        toast.error(t("auth.email_not_verified") || "Your email is not yet verified. Please check your inbox and verify your email first.");
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleResendVerification = async () => {
    const email = isEmail(identifier) ? identifier : "";
    if (!email) {
      toast.error(t("auth.enter_email_to_resend") || "Please enter your email address to resend the verification email.");
      return;
    }
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("auth.verification_resent") || "Verification email has been resent. Please check your inbox.");
      }
    } catch {
      toast.error("Failed to resend verification email.");
    }
    setResendingEmail(false);
  };

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
              {t("app.name")}
            </CardTitle>
            <CardDescription>{t("auth.welcome_desc")}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">{t("auth.email_or_mobile")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    placeholder="email@example.com / 01XXXXXXXXX"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">{t("auth.pin")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
              >
              {loading ? t("common.loading") : t("auth.login_btn")}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">{t("auth.or") || "Or"}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                disabled={loading}
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin + "/dashboard" },
                  });
                  if (error) toast.error(error.message);
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("auth.sign_in_with_google") || "Sign in with Google"}
              </Button>

              {showResendVerification && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm space-y-2">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{t("auth.email_not_verified_msg") || "Your email is not verified yet. Please check your inbox or resend the verification email."}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                  >
                    {resendingEmail
                      ? (t("common.loading") || "Sending...")
                      : (t("auth.resend_verification") || "Resend Verification Email")}
                  </Button>
                </div>
              )}
            </form>

            <div className="flex items-center justify-center gap-4 mt-4">
              <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                {t("auth.forgot_pin_link")}
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link to="/forgot-email" className="text-sm text-primary font-medium hover:underline">
                {t("auth.forgot_email_link") || "Forgot Email?"}
              </Link>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("auth.no_account")}{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                {t("auth.register")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
