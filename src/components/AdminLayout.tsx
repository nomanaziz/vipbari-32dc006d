import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogOut, Settings } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { brandBgColor } from "@/lib/presetColors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { t, language } = useLanguage();
  const { profile, signOut, role } = useAuth();
  const { colorPreset } = useTheme();

  const getRoleLabel = (r: string | null) => {
    if (!r) return "";
    const labels: Record<string, { en: string; bn: string }> = {
      admin: { en: "Admin", bn: "অ্যাডমিন" },
      employee: { en: "Employee", bn: "কর্মচারী" },
    };
    return language === "bn" ? labels[r]?.bn || r : labels[r]?.en || r;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between px-2 sm:px-4 bg-background shadow-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1.5">
              <NotificationBell />
              <div className="pl-1 sm:pl-2 sm:border-l sm:ml-1 border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0">
                      <Avatar className="h-8 w-8">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.full_name || ""} />}
                        <AvatarFallback className={`${brandBgColor[colorPreset]} text-white text-sm font-semibold`}>
                          {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
                        <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        {t("nav.settings")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <ThemeToggle />
                      <LanguageToggle />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4" />
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
