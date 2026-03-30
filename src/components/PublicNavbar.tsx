import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Building2, Calculator, LinkIcon, MessageSquare, DoorOpen, Zap, BarChart3, ShieldCheck, LayoutDashboard, Home, Settings2, Tag, Download, Menu, ShoppingBag } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { navbarGradients, dashboardButtonText } from "@/lib/presetColors";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCallback, useState } from "react";
import { Separator } from "@/components/ui/separator";

const featureLinks = [
  { slug: "bill-calculation", icon: Calculator, titleKey: "feat_bill_calculation.title" },
  { slug: "payment-link", icon: LinkIcon, titleKey: "feat_payment_link.title" },
  { slug: "sms-notification", icon: MessageSquare, titleKey: "feat_sms_notification.title" },
  { slug: "room-management", icon: DoorOpen, titleKey: "feat_room_management.title" },
  { slug: "smart-automation", icon: Zap, titleKey: "feat_smart_automation.title" },
  { slug: "analytics-insights", icon: BarChart3, titleKey: "feat_analytics_insights.title" },
  { slug: "security-protection", icon: ShieldCheck, titleKey: "feat_security_protection.title" },
] as const;

export const PublicNavbar = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { colorPreset } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { canInstall, promptInstall } = usePWAInstall();
  const isLogin = location.pathname === "/login";
  const isRegister = location.pathname === "/register";
  const [mobileOpen, setMobileOpen] = useState(false);
  const gradient = navbarGradients[colorPreset];
  const btnText = dashboardButtonText[colorPreset];

  const scrollToSection = useCallback((sectionId: string) => {
    setMobileOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: sectionId } });
    }
  }, [location.pathname, navigate]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className={`sticky top-0 z-50 bg-gradient-to-r ${gradient} backdrop-blur border-b border-white/10 shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">{t("app.name")}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm text-white/80">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-white/10 text-white/80 hover:text-white text-sm font-normal h-auto px-0 py-1">
                  <Settings2 className="h-4 w-4 mr-1.5" />
                  {t("landing.nav_features")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-1 p-3 lg:w-[500px] lg:grid-cols-2">
                    {featureLinks.map(({ slug, icon: Icon, titleKey }) => (
                      <Link
                        key={slug}
                        to={`/features/${slug}`}
                        className="flex items-center gap-3 rounded-md p-3 text-sm hover:bg-accent transition-colors"
                      >
                        <Icon className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-foreground">{t(titleKey)}</span>
                      </Link>
                    ))}
                    <Link
                      to="/#features"
                      className="flex items-center gap-3 rounded-md p-3 text-sm text-primary hover:bg-accent transition-colors lg:col-span-2 border-t border-border mt-1 pt-3"
                    >
                      {t("landing.nav_features")} →
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <Link to="/tolet" className="hover:text-white transition-colors font-medium text-white flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            {t("nav.tolet") || "To-Let"}
          </Link>
          <Link to="/buy-sell" className="hover:text-white transition-colors font-medium text-white flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            {language === "bn" ? "কেনা - বেচা" : "Buy & Sell"}
          </Link>
          <button onClick={() => scrollToSection("how")} className="hover:text-white transition-colors flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            {t("landing.nav_how")}
          </button>
          <button onClick={() => scrollToSection("pricing")} className="hover:text-white transition-colors flex items-center gap-1.5">
            <Tag className="h-4 w-4" />
            {t("landing.nav_pricing")}
          </button>
        </div>

        {/* Desktop right side */}
        <div className="flex items-center gap-2">
          {canInstall && (
            <Button variant="outline" size="sm" onClick={promptInstall} className="gap-1.5 hidden sm:inline-flex border-white/30 text-white bg-transparent hover:bg-white/10">
              <Download className="h-4 w-4" />
              {t("landing.install_now")}
            </Button>
          )}
          {/* Mobile-only To-Let + Theme (visible below md) */}
          <Link to="/tolet" className="flex md:hidden items-center gap-1 text-sm font-medium text-white">
            <Home className="h-4 w-4" />
          </Link>
          <div className="flex md:hidden [&_button]:text-white [&_button]:hover:text-white/80">
            <ThemeToggle />
          </div>
          {/* Tablet-only To-Let (md to lg) */}
          <Link to="/tolet" className="hidden md:flex lg:hidden items-center gap-1.5 text-sm font-medium text-white hover:text-white/80 transition-colors">
            <Home className="h-4 w-4" />
            {t("nav.tolet") || "To-Let"}
          </Link>
          <div className="hidden md:flex items-center gap-1 [&_button]:text-white [&_button]:hover:text-white/80">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          {user ? (
            <Button asChild className={`hidden md:inline-flex bg-white ${btnText} hover:bg-white/90`}>
              <Link to="/dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                {t("nav.go_to_dashboard")}
              </Link>
            </Button>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              {!isLogin && (
                <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white"><Link to="/login">{t("auth.login")}</Link></Button>
              )}
              {!isRegister && (
                <Button asChild className={`bg-white ${btnText} hover:bg-white/90`}><Link to="/register">{t("landing.get_started")}</Link></Button>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  {t("app.name")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 py-2">
                <Link to="/tolet" onClick={closeMobile} className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-primary hover:bg-accent transition-colors">
                  <Home className="h-4 w-4" />
                  {t("nav.tolet") || "To-Let"}
                </Link>
                <Link to="/buy-sell" onClick={closeMobile} className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-primary hover:bg-accent transition-colors">
                  <ShoppingBag className="h-4 w-4" />
                  {language === "bn" ? "কেনা - বেচা" : "Buy & Sell"}
                </Link>
                <button onClick={() => scrollToSection("how")} className="flex items-center gap-3 rounded-md p-3 text-sm hover:bg-accent transition-colors text-left">
                  <Zap className="h-4 w-4" />
                  {t("landing.nav_how")}
                </button>
                <button onClick={() => scrollToSection("pricing")} className="flex items-center gap-3 rounded-md p-3 text-sm hover:bg-accent transition-colors text-left">
                  <Tag className="h-4 w-4" />
                  {t("landing.nav_pricing")}
                </button>
              </div>

              <Separator />
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">{t("landing.nav_features")}</p>
                <div className="flex flex-col gap-0.5">
                  {featureLinks.map(({ slug, icon: Icon, titleKey }) => (
                    <Link
                      key={slug}
                      to={`/features/${slug}`}
                      onClick={closeMobile}
                      className="flex items-center gap-3 rounded-md p-2.5 text-sm hover:bg-accent transition-colors"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground">{t(titleKey)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="flex items-center gap-2 px-4 py-3">
                <ThemeToggle />
                <LanguageToggle />
                {canInstall && (
                  <Button variant="outline" size="sm" onClick={() => { promptInstall(); closeMobile(); }} className="gap-1.5">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Separator />
              <div className="flex flex-col gap-2 px-4 py-3">
                {user ? (
                  <Button asChild onClick={closeMobile}>
                    <Link to="/dashboard" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {t("nav.go_to_dashboard")}
                    </Link>
                  </Button>
                ) : (
                  <>
                    {!isLogin && (
                      <Button variant="outline" asChild onClick={closeMobile}>
                        <Link to="/login">{t("auth.login")}</Link>
                      </Button>
                    )}
                    {!isRegister && (
                      <Button asChild onClick={closeMobile}>
                        <Link to="/register">{t("landing.get_started")}</Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
