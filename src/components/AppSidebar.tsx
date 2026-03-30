import {
  LayoutDashboard, Building2, DoorOpen, Users, Receipt, CreditCard, Settings, Shield, Gauge, Home, Inbox, MessageSquare, UserCog, User, AlertTriangle, Bell, Car, Crown, Calculator, ShoppingBag, Send, FileText
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t, language } = useLanguage();
  const { signOut, profile, role, hasPermission } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const landlordGroups = [
    {
      label: L("Home", "হোম"),
      items: [
        { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: L("Property Management", "সম্পত্তি ব্যবস্থাপনা"),
      items: [
        { title: t("nav.properties"), url: "/properties", icon: Building2 },
        { title: t("nav.rooms"), url: "/rooms", icon: DoorOpen },
        { title: t("nav.meters"), url: "/meters", icon: Gauge },
        { title: L("Garages", "গ্যারেজ / পার্কিং"), url: "/garages", icon: Car },
      ],
    },
    {
      label: L("Tenant Management", "ভাড়াটিয়া ব্যবস্থাপনা"),
      items: [
        { title: t("nav.tenants"), url: "/tenants", icon: Users },
        { title: L("Guests", "অতিথি"), url: "/guests", icon: UserCog },
        { title: L("Complaints", "অভিযোগ"), url: "/complaints", icon: AlertTriangle },
        { title: L("Notices", "নোটিশ বোর্ড"), url: "/notices", icon: Bell },
      ],
    },
    {
      label: L("Finance", "আর্থিক"),
      items: [
        { title: t("nav.bills"), url: "/bills", icon: Receipt },
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
      label: L("Administration", "প্রশাসন"),
      items: [
        { title: t("nav.staff") || "Staff", url: "/staff", icon: UserCog },
        { title: t("nav.roles") || "Roles", url: "/roles", icon: Shield },
        { title: L("Subscription", "সাবস্ক্রিপশন"), url: "/subscription", icon: Crown },
        { title: t("nav.settings"), url: "/settings", icon: Settings },
        ...((role === "admin" || role === "employee") ? [{ title: t("nav.admin_panel") || "Admin Panel", url: "/admin", icon: Shield }] : []),
      ],
    },
  ];

  const tenantGroups = [
    {
      label: L("Home", "হোম"),
      items: [
        { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
        { title: L("My Profile", "আমার প্রোফাইল"), url: "/tenant/profile", icon: User },
      ],
    },
    {
      label: L("Living", "বসবাস"),
      items: [
        { title: L("My Landlord", "আমার বাড়িওয়ালা"), url: "/tenant/landlord", icon: Building2 },
        { title: t("tenant.family_members"), url: "/tenant/family", icon: Users },
        { title: t("tenant.guests") || "Guests", url: "/tenant/guests", icon: UserCog },
      ],
    },
    {
      label: L("Finance & Complaints", "আর্থিক ও অভিযোগ"),
      items: [
        { title: t("tenant.payment_history") || "Payments", url: "/tenant/payments", icon: CreditCard },
        { title: t("tenant.complaints") || "Complaints", url: "/tenant/complaints", icon: Receipt },
        { title: t("tenant.notices") || "Notices", url: "/tenant/notices", icon: Inbox },
      ],
    },
    {
      label: L("Communication & More", "যোগাযোগ ও অন্যান্য"),
      items: [
        { title: t("nav.tolet") || "To-Let", url: "/tenant/tolet", icon: Home },
        { title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare },
        { title: t("tenant.help_center") || "Help Center", url: "/tenant/help", icon: Shield },
        { title: t("nav.settings"), url: "/settings", icon: Settings },
      ],
    },
  ];

  const landlordStaffItems = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard, permission: null },
    { title: t("nav.properties"), url: "/properties", icon: Building2, permission: "view_properties" },
    { title: t("nav.rooms"), url: "/rooms", icon: DoorOpen, permission: "view_rooms" },
    { title: t("nav.meters"), url: "/meters", icon: Gauge, permission: "view_meters" },
    { title: L("Garages", "গ্যারেজ / পার্কিং"), url: "/garages", icon: Car, permission: "view_garages" },
    { title: t("nav.tenants"), url: "/tenants", icon: Users, permission: "view_tenants" },
    { title: L("Guests", "অতিথি"), url: "/guests", icon: UserCog, permission: "view_guests" },
    { title: L("Complaints", "অভিযোগ"), url: "/complaints", icon: AlertTriangle, permission: "manage_complaints" },
    { title: L("Notices", "নোটিশ বোর্ড"), url: "/notices", icon: Bell, permission: "manage_notices" },
    { title: t("nav.bills"), url: "/bills", icon: Receipt, permission: "view_bills" },
    { title: t("nav.payments"), url: "/payments", icon: CreditCard, permission: "view_payments" },
    { title: L("Accounting", "হিসাব"), url: "/accounting", icon: Calculator, permission: "view_accounting" },
    { title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare, permission: null },
    { title: t("nav.settings"), url: "/settings", icon: Settings, permission: null },
  ].filter(item => !item.permission || hasPermission(item.permission));

  const employeeItems = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    ...(hasPermission("manage_users") ? [{ title: t("admin.users") || "Users", url: "/admin/users", icon: Users }] : []),
    ...(hasPermission("view_properties") ? [{ title: t("nav.properties"), url: "/admin/properties", icon: Building2 }] : []),
    ...(hasPermission("manage_cms") ? [{ title: t("admin.cms") || "CMS", url: "/admin/cms", icon: Receipt }] : []),
    ...(hasPermission("manage_tutorials") ? [{ title: t("admin.tutorials") || "Tutorials", url: "/admin/tutorials", icon: Inbox }] : []),
    { title: t("nav.settings"), url: "/settings", icon: Settings },
  ];

  const renderMenuItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className="hover:bg-sidebar-accent/50"
          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          onClick={() => { if (isMobile) setOpenMobile(false); }}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderFlatItems = (items: Array<{ title: string; url: string; icon: any }>) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-base">{t("app.name")}</span>
          </div>
        )}
      </SidebarGroupLabel>
      <SidebarGroupContent className="mt-2">
        <SidebarMenu>
          {items.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const renderGroupedSidebar = (groups: Array<{ label: string; items: Array<{ title: string; url: string; icon: any }> }>) => (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent>
        <div className="px-3 py-3">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-base text-sidebar-foreground">{t("app.name")}</span>
            </div>
          )}
        </div>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );

  // Landlord & Tenant use grouped layout
  if (role === "tenant") return renderGroupedSidebar(tenantGroups);
  if (role !== "landlord_staff" && role !== "employee") return renderGroupedSidebar(landlordGroups);

  // Staff & employee use flat layout
  let items: Array<{ title: string; url: string; icon: any }>;
  switch (role) {
    case "landlord_staff": items = landlordStaffItems; break;
    case "employee": items = employeeItems; break;
    default: items = landlordStaffItems; break;
  }

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent>
        {renderFlatItems(items)}
      </SidebarContent>
    </Sidebar>
  );
}
