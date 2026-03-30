import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Phone, Lock, User, Mail, Building2, Users, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Register = () => {
  const { signUp, user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("role") === "tenant" ? "tenant" : "landlord";

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      toast.info("You are already logged in");
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || user) return null;

  const checkDuplicate = async (): Promise<boolean> => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-registration", {
        body: { email: email.trim(), phone: phone.trim() },
      });
      if (error) {
        setChecking(false);
        return true; // allow registration if check fails
      }
      if (data?.emailExists) {
        toast.error(t("auth.email_already_registered") || "This email is already registered. Please login instead.");
        setChecking(false);
        return false;
      }
      if (data?.phoneExists) {
        toast.error(t("auth.phone_already_registered") || "This phone number is already registered. Please login instead.");
        setChecking(false);
        return false;
      }
      setChecking(false);
      return true;
    } catch {
      setChecking(false);
      return true;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin || !name || !email || !dateOfBirth) {
      toast.error(t("auth.all_fields_required") || "All fields are required");
      return;
    }
    if (pin.length < 6) {
      toast.error(t("auth.pin_min_length"));
      return;
    }

    setLoading(true);

    // Check for duplicates first
    const canProceed = await checkDuplicate();
    if (!canProceed) {
      setLoading(false);
      return;
    }

    const role = activeTab === "tenant" ? "tenant" : "landlord";
    const { error } = await supabase.auth.signUp({
      email,
      password: pin,
      options: {
        data: {
          full_name: name,
          role,
          phone,
          email,
          date_of_birth: format(dateOfBirth, "yyyy-MM-dd"),
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.register_success"));
      navigate("/verify-email");
    }
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
            <CardDescription>{t("auth.register_desc")}</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="landlord" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  {t("auth.register_as_landlord") || "Landlord"}
                </TabsTrigger>
                <TabsTrigger value="tenant" className="gap-2">
                  <Users className="h-4 w-4" />
                  {t("auth.register_as_tenant") || "Tenant"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="landlord">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("auth.landlord_register_desc") || "Register as a landlord to manage your properties, rooms, and tenants."}
                </p>
              </TabsContent>
              <TabsContent value="tenant">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("auth.tenant_register_desc") || "Register as a tenant to browse to-let listings and send rental requests."}
                </p>
              </TabsContent>
            </Tabs>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder={t("auth.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("auth.email_verify_note")}</p>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="pin">{t("auth.pin")} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    placeholder="6+ digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading || checking}
              >
                {loading || checking ? t("common.loading") : t("auth.register_btn")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("auth.has_account")}{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t("auth.login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
