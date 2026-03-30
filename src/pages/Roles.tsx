import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import PermissionPresetCards from "@/components/staff/PermissionPresetCards";

const Roles = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: presets } = useQuery({
    queryKey: ["permission-presets", "landlord"],
    queryFn: async () => {
      const { data } = await supabase.from("permission_presets").select("*").eq("scope", "landlord");
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {t("nav.roles")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("staff.roles_desc")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("staff.permissions")}</CardTitle>
          <CardDescription>{t("staff.roles_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionPresetCards
            presets={presets || []}
            selectedId=""
            onSelect={() => {}}
            showAllPermissions
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Roles;
