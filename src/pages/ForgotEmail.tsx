import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Phone, ArrowLeft, CalendarDays, Mail, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ForgotEmail = () => {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !dateOfBirth) {
      toast.error(t("auth.all_fields_required") || "All fields are required");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("forgot-email", {
        body: { phone: phone.trim(), date_of_birth: format(dateOfBirth, "yyyy-MM-dd") },
      });

      if (error || data?.error) {
        toast.error(data?.error || t("auth.no_account_found") || "No account found matching this information.");
        setLoading(false);
        return;
      }

      setFoundEmail(data.email);
      setMaskedEmail(data.maskedEmail);
      setFullName(data.fullName);
      toast.success(t("auth.email_found") || "Email found!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const copyEmail = () => {
    if (foundEmail) {
      navigator.clipboard.writeText(foundEmail);
      toast.success(t("common.copied") || "Copied to clipboard!");
    }
  };

  if (foundEmail) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/30">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-primary/10">
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                {t("auth.email_found_title") || "Email Found!"}
              </CardTitle>
              <CardDescription>
                {fullName && <span className="block font-medium text-foreground mb-1">{fullName}</span>}
                {t("auth.email_found_desc") || "Your registered email address is:"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-sm flex-1">{foundEmail}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyEmail}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Link to="/login" className="block">
                <Button className="w-full h-11 text-base font-semibold">
                  {t("auth.login_now") || "Login Now"}
                </Button>
              </Link>

              <Link to="/forgot-password" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary">
                {t("auth.forgot_pin_link") || "Forgot PIN?"}
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
              {t("auth.forgot_email_title") || "Forgot Email?"}
            </CardTitle>
            <CardDescription>
              {t("auth.forgot_email_desc") || "Enter your phone number and date of birth to recover your registered email."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("auth.date_of_birth")} <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateOfBirth && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {dateOfBirth ? format(dateOfBirth, "dd/MM/yyyy") : t("auth.select_dob")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="center">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={setDateOfBirth}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1920-01-01")
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      captionLayout="dropdown-buttons"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      classNames={{
                        caption: "flex justify-center pt-1 relative items-center gap-1",
                        caption_dropdowns: "flex gap-1",
                        dropdown: "text-xs px-1 py-0.5 rounded border bg-background",
                        dropdown_month: "mr-1",
                        vhidden: "hidden",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? t("common.loading") : (t("auth.recover_email_btn") || "Recover Email")}
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

export default ForgotEmail;
