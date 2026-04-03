import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VerifyEmail = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem("pending_verification_email") || "");

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email sent! Please check your inbox.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/30">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-primary/10 text-center">
          <CardHeader className="space-y-3">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {t("auth.verify_email_title")}
            </CardTitle>
            <CardDescription>{t("auth.verify_email_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("auth.verify_email_info")}
            </p>

            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
              />
              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={handleResend}
                disabled={resending}
              >
                <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>

            <Link to="/login">
              <Button variant="outline" className="w-full mt-2">
                {t("auth.back_to_login")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
