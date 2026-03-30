import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const VerifyEmail = () => {
  const { t } = useLanguage();

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
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              {t("auth.verify_email_info")}
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
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
