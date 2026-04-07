import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  LayoutDashboard, Receipt, Users, AlertTriangle, Menu,
  CreditCard, Inbox, Building2, DoorOpen, Gauge, Car, Bell,
  MessageSquare, Shield, UserCog, Settings, Crown, Home, User, Calculator,
  ShoppingBag, Send, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

interface MoreGroup {
  label: string;
  items: { title: string; url: string; icon: any }[];
}

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, hasPermission } = useAuth();
  const { t, language } = useLanguage();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const isActive = (url: string) => location.pathname === url;

  const landlordPrimary = [
    { title: L("Rent", "ভাড়া"), url: "/bills", icon: Receipt },
    { title: L("Tenants", "ভাড়াটিয়া"), url: "/tenants", icon: Users },
    { title: L("Dashboard", "ড্যাশবোর্ড"), url: "/dashboard", icon: LayoutDashboard, center: true },
    { title: L("Complaints", "অভিযোগ"), url: "/complaints", icon: AlertTriangle },
  ];

  const landlordMoreGroups: MoreGroup[] = [
    {
      label: L("Tenants", "ভাড়াটিয়া"),
      items: [
        { title: L("Guests", "অতিথি"), url: "/guests", icon: UserCog },
        { title: L("Notices", "নোটিশ বোর্ড"), url: "/notices", icon: Bell },
        { title: L("Leases", "লিজ চুক্তি"), url: "/leases", icon: FileText },
      ],
    },
    {
      label: L("Finance", "আর্থিক"),
      items: [
        { title: t("nav.payments"), url: "/payments", icon: CreditCard },
        { title: L("Accounting", "হিসাব"), url: "/accounting", icon: Calculator },
      ],
    },
    {
      label: L("Communication", "যোগাযোগ"),
      items: [
        { title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare },
        { title: t("nav.tolet_requests") || "To-Let Requests", url: "/tolet-requests", icon: Inbox },
        { title: L("My Listings", "আমার লিস্টিং"), url: "/my-listings", icon: ShoppingBag },
      ],
    },
    {
      label: L("Property", "সম্পত্তি"),
      items: [
        { title: t("nav.properties"), url: "/properties", icon: Building2 },
        { title: t("nav.rooms"), url: "/rooms", icon: DoorOpen },
        { title: t("nav.meters"), url: "/meters", icon: Gauge },
        { title: L("Garages", "গ্যারেজ"), url: "/garages", icon: Car },
      ],
    },
    {
      label: L("Administration", "প্রশাসন"),
      items: [
        { title: t("nav.staff") || "Staff", url: "/staff", icon: UserCog },
        { title: t("nav.roles") || "Roles", url: "/roles", icon: Shield },
        { title: L("Subscription", "সাবস্ক্রিপশন"), url: "/subscription", icon: Crown },
        { title: t("nav.settings"), url: "/settings", icon: Settings },
      ],
    },
  ];

  const tenantPrimary = [
    { title: L("Payments", "পেমেন্ট"), url: "/tenant/payments", icon: CreditCard },
    { title: L("Complaints", "অভিযোগ"), url: "/tenant/complaints", icon: Receipt },
    { title: L("Dashboard", "ড্যাশবোর্ড"), url: "/dashboard", icon: LayoutDashboard, center: true },
    { title: L("Notices", "নোটিশ"), url: "/tenant/notices", icon: Inbox },
  ];

  const tenantMoreGroups: MoreGroup[] = [
    {
      label: L("Profile", "প্রোফাইল"),
      items: [
        { title: L("My Profile", "আমার প্রোফাইল"), url: "/tenant/profile", icon: User },
        { title: L("My Landlord", "আমার বাড়িওয়ালা"), url: "/tenant/landlord", icon: Building2 },
        { title: t("tenant.family_members"), url: "/tenant/family", icon: Users },
        { title: t("tenant.guests") || "Guests", url: "/tenant/guests", icon: UserCog },
      ],
    },
    {
      label: L("Others", "অন্যান্য"),
      items: [
        { title: t("nav.tolet") || "To-Let", url: "/tenant/tolet", icon: Home },
        { title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare },
        { title: t("tenant.help_center") || "Help Center", url: "/tenant/help", icon: Shield },
        { title: t("nav.settings"), url: "/settings", icon: Settings },
      ],
    },
  ];

  const primary = role === "tenant" ? tenantPrimary : landlordPrimary;
  const moreGroups = role === "tenant" ? tenantMoreGroups : landlordMoreGroups;

  const handleNav = (url: string) => {
    navigate(url);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="sticky bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border mobile-bottom-nav">
        <div className="flex items-end justify-around px-1 h-16">
          {primary.map((item) => (
            <button
              key={item.url}
              onClick={() => handleNav(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                item.center ? "relative -mt-3" : "",
                isActive(item.url) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.center ? (
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-2",
                  isActive(item.url)
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border-2 border-primary text-primary"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <span className={cn("text-[10px] leading-tight", item.center && "mt-0.5")}>
                {item.title}
              </span>
            </button>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
              moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] leading-tight">{L("More", "আরও")}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto pb-8">
          <SheetHeader>
            <SheetTitle>{L("More Options", "আরও মেনু")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {moreGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
                  {group.label}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.url}
                      onClick={() => handleNav(item.url)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                        isActive(item.url)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs text-center leading-tight">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
