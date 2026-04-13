import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, LogOut, Settings, User, Building2, UserCog, Users, Calculator } from "lucide-react";
import { FloatingCalculator } from "@/components/FloatingCalculator";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut, role } = useAuth();
  const { t, language } = useLanguage();

  const getRoleLabel = (r: string | null) => {
    if (!r) return "";
    const labels: Record<string, { en: string; bn: string }> = {
      landlord: { en: "Landlord", bn: "বাড়িওয়ালা" },
      tenant: { en: "Tenant", bn: "ভাড়াটিয়া" },
      admin: { en: "Admin", bn: "অ্যাডমিন" },
      staff: { en: "Staff", bn: "স্টাফ" },
      employee: { en: "Employee", bn: "কর্মচারী" },
      landlord_staff: { en: "Staff", bn: "স্টাফ" },
    };
    return language === "bn" ? labels[r]?.bn || r : labels[r]?.en || r;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-2 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger className="ml-0 shrink-0 hidden md:flex" />
              <Badge variant="secondary" className="gap-1 sm:gap-1.5 text-xs sm:text-sm truncate">
                {role === "landlord" && <Building2 className="h-3 w-3 shrink-0" />}
                {role === "tenant" && <User className="h-3 w-3 shrink-0" />}
                {(role === "staff" || role === "landlord_staff") && <UserCog className="h-3 w-3 shrink-0" />}
                {role === "employee" && <Users className="h-3 w-3 shrink-0" />}
                <span className="truncate">{getRoleLabel(role)} {language === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}</span>
              </Badge>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
              <NotificationBell />
              {/* Profile dropdown — always visible, contains Visit Site, Language, Theme on mobile */}
              <div className="pl-1 sm:pl-2 sm:border-l sm:ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0">
                      <Avatar className="h-8 w-8">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.full_name || ""} />}
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/" className="flex items-center gap-2 cursor-pointer">
                        <Globe className="h-4 w-4" />
                        {t("nav.visit_site")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        {t("nav.settings")}
                      </Link>
                    </DropdownMenuItem>
                    {role === "tenant" && (
                      <DropdownMenuItem asChild>
                        <Link to="/tenant/profile" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          {language === "bn" ? "আমার প্রোফাইল" : "My Profile"}
                        </Link>
                      </DropdownMenuItem>
                    )}
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
          <main className="flex-1 p-6 md:pb-6 overflow-auto">
            {children}
          </main>
          <MobileBottomNav />
          <ScrollToTop />
        </div>
      </div>
    </SidebarProvider>
  );
}
