import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldAlert } from "lucide-react";

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
}

const PermissionGuard = ({ permission, children }: PermissionGuardProps) => {
  const { role, hasPermission } = useAuth();
  const { language } = useLanguage();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  // Only enforce for landlord_staff and employee roles
  if (role === "landlord_staff" || role === "employee") {
    if (!hasPermission(permission)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive/50" />
          <h2 className="text-xl font-semibold text-foreground">
            {L("Access Denied", "অ্যাক্সেস নিষেধ")}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {L(
              "You don't have permission to access this page. Please contact your landlord to get the required access.",
              "এই পেজে প্রবেশের অনুমতি নেই। প্রয়োজনীয় অ্যাক্সেসের জন্য আপনার বাড়িওয়ালার সাথে যোগাযোগ করুন।"
            )}
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default PermissionGuard;
