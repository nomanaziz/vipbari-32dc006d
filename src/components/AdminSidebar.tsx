import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, Users, Building2, DoorOpen,
  Receipt, Settings, CreditCard, Package, Gauge, Video, ShoppingCart, FileText, Megaphone, Globe,
  ShoppingBag, ChevronDown, Home, UserCheck, Shield, ShieldBan,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const userSubLinks = [
  { title: "সব ব্যবহারকারী", url: "/admin/users", role: "" },
  { title: "বাড়িওয়ালা", url: "/admin/users?role=landlord", role: "landlord" },
  { title: "ভাড়াটিয়া", url: "/admin/users?role=tenant", role: "tenant" },
  { title: "অ্যাডমিন ও কর্মী", url: "/admin/users?role=staff", role: "staff" },
];

const menuGroups = [
  {
    label: "Home",
    items: [
      { title: "admin.dashboard", url: "/admin", icon: LayoutDashboard, adminOnly: false, color: "text-purple-600" },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "admin.properties", url: "/admin/properties", icon: Building2, adminOnly: false, color: "text-violet-500" },
      { title: "admin.rooms", url: "/admin/rooms", icon: DoorOpen, adminOnly: false, color: "text-fuchsia-500" },
      { title: "admin.tenants", url: "/admin/tenants", icon: UserCheck, adminOnly: false, color: "text-teal-500" },
      { title: "admin.meters", url: "/admin/meters", icon: Gauge, adminOnly: false, color: "text-rose-500" },
      { title: "admin.bills", url: "/admin/bills", icon: Receipt, adminOnly: false, color: "text-orange-500" },
      { title: "admin.payments", url: "/admin/payments", icon: CreditCard, adminOnly: false, color: "text-emerald-500" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "admin.plans", url: "/admin/plans", icon: Package, adminOnly: true, color: "text-blue-500" },
      { title: "admin.cms", url: "/admin/cms", icon: FileText, adminOnly: true, color: "text-cyan-500" },
      { title: "admin.tutorials", url: "/admin/tutorials", icon: Video, adminOnly: false, color: "text-amber-500" },
      { title: "admin.subscriptions", url: "/admin/subscriptions", icon: ShoppingCart, adminOnly: false, color: "text-indigo-500" },
      { title: "admin.ads", url: "/admin/ads", icon: Megaphone, adminOnly: true, color: "text-orange-500" },
      { title: "admin.landing", url: "/admin/landing", icon: Globe, adminOnly: true, color: "text-teal-500" },
      { title: "admin.settings", url: "/admin/settings", icon: Settings, adminOnly: true, color: "text-slate-500" },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { title: "Sale Listings", url: "/admin/sale-listings", icon: ShoppingBag, adminOnly: false, color: "text-emerald-500" },
    ],
  },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { role } = useAuth();
  const { colorPreset } = useTheme();
  const isAdmin = role === "admin";

  const isUsersPage = location.pathname.startsWith("/admin/users");
  const [usersOpen, setUsersOpen] = useState(isUsersPage);

  const currentRole = searchParams.get("role") || "";

  const brandBg: Record<string, string> = {
    pink: "bg-purple-600", green: "bg-emerald-600", blue: "bg-blue-600", yellow: "bg-amber-600",
  };

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const isSubLinkActive = (sub: typeof userSubLinks[0]) => {
    if (!isUsersPage) return false;
    return currentRole === sub.role;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className={`h-8 w-8 rounded-lg ${brandBg[colorPreset]} flex items-center justify-center shrink-0`}>
            <span className="text-white text-sm font-bold">B</span>
          </div>
          {!collapsed && (
            <span className="text-base font-semibold text-sidebar-foreground tracking-tight">
              VIP Bari
            </span>
          )}
        </div>

        {/* Users Submenu - before other groups */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {!collapsed && "Users"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {collapsed ? (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin/users"
                      className={`rounded-lg px-3 py-2 transition-colors ${
                        isUsersPage
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                      activeClassName=""
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                    >
                      <Users className="mr-2.5 h-[18px] w-[18px] text-pink-500" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger className={`flex items-center w-full rounded-lg px-3 py-2 text-sm transition-colors ${
                      isUsersPage
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}>
                      <Users className="mr-2.5 h-[18px] w-[18px] text-pink-500" />
                      <span className="flex-1 text-left">{t("admin.users")}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${usersOpen ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 mt-1">
                      {userSubLinks.map((sub) => {
                        const active = isSubLinkActive(sub);
                        const icons: Record<string, React.ReactNode> = {
                          "": <Users className="mr-2 h-4 w-4 text-muted-foreground" />,
                          landlord: <Home className="mr-2 h-4 w-4 text-violet-500" />,
                          tenant: <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />,
                          staff: <Shield className="mr-2 h-4 w-4 text-blue-500" />,
                        };
                        return (
                          <NavLink
                            key={sub.role}
                            to={sub.url}
                            className={`flex items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`}
                            activeClassName=""
                            onClick={() => { if (isMobile) setOpenMobile(false); }}
                          >
                            {icons[sub.role]}
                            {sub.title}
                          </NavLink>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {menuGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="px-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {!collapsed && group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="px-2 space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/admin"}
                            className={`rounded-lg px-3 py-2 transition-colors ${
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`}
                            activeClassName=""
                            onClick={() => { if (isMobile) setOpenMobile(false); }}
                          >
                            <item.icon className={`mr-2.5 h-[18px] w-[18px] ${item.color}`} />
                            {!collapsed && <span className="text-sm">{t(item.title)}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
