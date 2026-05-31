import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Phone, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ForgotPassword = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);

    try {
      // Look up real email from phone (purpose=reset blocks placeholder emails)
      const { data, error } = await supabase.functions.invoke("login-with-phone", {
        body: { phone, purpose: "reset" },
      });

      if (data?.error === "NO_REAL_EMAIL") {
        toast.error(
          data.message ||
            "এই মোবাইল নাম্বারে কোনো বৈধ ইমেইল যুক্ত নেই। PIN পরিবর্তনের জন্য আপনার বাড়িওয়ালা বা অ্যাডমিনের সাথে যোগাযোগ করুন।"
        );
        setLoading(false);
        return;
      }

      if (error || !data?.email) {
        toast.error(t("auth.no_account_phone"));
        setLoading(false);
        return;
      }

      // Use Supabase built-in password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        toast.error(resetError.message);
      } else {
        setSent(true);
        toast.success(t("auth.reset_link_sent"));
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success(t("auth.reset_link_sent"));
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-primary/10">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                {t("auth.check_email")}
              </CardTitle>
              <CardDescription>{t("auth.reset_link_sent_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2 hover:text-primary">
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
              {t("auth.forgot_pin")}
            </CardTitle>
            <CardDescription>{t("auth.forgot_pin_desc_new")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="phone" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="phone">{t("auth.login_phone")}</TabsTrigger>
                <TabsTrigger value="email">{t("auth.login_email")}</TabsTrigger>
              </TabsList>

              <TabsContent value="phone">
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("auth.phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="01XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                    {loading ? t("common.loading") : t("auth.send_reset_link")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                    {loading ? t("common.loading") : t("auth.send_reset_link")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

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

export default ForgotPassword;
