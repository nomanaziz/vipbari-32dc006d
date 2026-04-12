import { useState } from "react";
import {
  LayoutDashboard, Building2, DoorOpen, Users, Receipt, CreditCard, Settings, Shield, Gauge, Home, Inbox, MessageSquare, UserCog, User, AlertTriangle, Bell, Car, Crown, Calculator, ShoppingBag, Send, FileText, GripVertical, SettingsIcon, RotateCcw, Package, Wrench, AlertCircle, Headphones, Clock, FileBarChart
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useSidebarOrder, type MenuGroup } from "@/hooks/useSidebarOrder";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function SortableGroup({ group, children, editMode }: { group: MenuGroup; children: React.ReactNode; editMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      {editMode && (
        <div {...attributes} {...listeners} className="flex items-center gap-1 px-3 py-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-3.5 w-3.5" />
          <span className="text-[10px] uppercase tracking-wider">{group.label}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function SortableItem({ item, editMode, collapsed, isMobile, setOpenMobile }: {
  item: { id: string; title: string; url: string; icon: any };
  editMode: boolean; collapsed: boolean; isMobile: boolean; setOpenMobile: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton asChild>
        <div className="flex items-center w-full">
          {editMode && (
            <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-1 text-muted-foreground hover:text-foreground">
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          )}
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="hover:bg-sidebar-accent/50 flex-1"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
            onClick={() => { if (isMobile) setOpenMobile(false); }}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t, language } = useLanguage();
  const { signOut, profile, role, hasPermission } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  // New order: Home → Tenant → Finance → Communication → Property → Admin
  const landlordGroups: MenuGroup[] = [
    {
      id: "home",
      label: L("Home", "হোম"),
      items: [
        { id: "dashboard", title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      id: "tenants",
      label: L("Tenant Management", "ভাড়াটিয়া ব্যবস্থাপনা"),
      items: [
        { id: "tenants", title: t("nav.tenants"), url: "/tenants", icon: Users },
        { id: "guests", title: L("Guests", "অতিথি"), url: "/guests", icon: UserCog },
        { id: "complaints", title: L("Complaints", "অভিযোগ"), url: "/complaints", icon: AlertTriangle },
        { id: "notices", title: L("Notices", "নোটিশ বোর্ড"), url: "/notices", icon: Bell },
        { id: "leases", title: L("Leases", "লিজ চুক্তি"), url: "/leases", icon: FileText },
      ],
    },
    {
      id: "finance",
      label: L("Finance", "আর্থিক"),
      items: [
        { id: "bills", title: t("nav.bills"), url: "/bills", icon: Receipt },
        { id: "payments", title: t("nav.payments"), url: "/payments", icon: CreditCard },
        { id: "accounting", title: L("Accounting", "হিসাব"), url: "/accounting", icon: Calculator },
      ],
    },
    {
      id: "communication",
      label: L("Communication", "যোগাযোগ"),
      items: [
        { id: "messages", title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare },
        { id: "tolet-requests", title: t("nav.tolet_requests") || "To-Let Requests", url: "/tolet-requests", icon: Inbox },
        { id: "my-listings", title: L("My Listings", "আমার লিস্টিং"), url: "/my-listings", icon: ShoppingBag },
      ],
    },
    {
      id: "property",
      label: L("Property Management", "সম্পত্তি ব্যবস্থাপনা"),
      items: [
        { id: "properties", title: t("nav.properties"), url: "/properties", icon: Building2 },
        { id: "rooms", title: t("nav.rooms"), url: "/rooms", icon: DoorOpen },
        { id: "meters", title: t("nav.meters"), url: "/meters", icon: Gauge },
        { id: "garages", title: L("Garages", "গ্যারেজ / পার্কিং"), url: "/garages", icon: Car },
      ],
    },
    {
      id: "assets",
      label: L("Asset Management", "সম্পদ ব্যবস্থাপনা"),
      items: [
        { id: "assets", title: L("Assets", "সম্পদ"), url: "/assets", icon: Package },
        { id: "asset-maintenance", title: L("Maintenance", "রক্ষণাবেক্ষণ"), url: "/asset-maintenance", icon: Wrench },
        { id: "asset-issues", title: L("Issue Report", "সমস্যা রিপোর্ট"), url: "/asset-issues", icon: AlertCircle },
      ],
    },
    {
      id: "services",
      label: L("Services", "সেবা"),
      items: [
        { id: "services", title: L("Services", "সেবা"), url: "/services", icon: Headphones },
        { id: "service-clock", title: L("Clock In/Out", "প্রবেশ/প্রস্থান"), url: "/service-clock", icon: Clock },
      ],
    },
    {
      id: "admin",
      label: L("Administration", "প্রশাসন"),
      items: [
        { id: "staff", title: t("nav.staff") || "Staff", url: "/staff", icon: UserCog },
        { id: "roles", title: t("nav.roles") || "Roles", url: "/roles", icon: Shield },
        { id: "subscription", title: L("Subscription", "সাবস্ক্রিপশন"), url: "/subscription", icon: Crown },
        { id: "reports", title: L("Reports", "রিপোর্ট"), url: "/reports", icon: FileBarChart },
        { id: "settings", title: t("nav.settings"), url: "/settings", icon: Settings },
        ...((role === "admin" || role === "employee") ? [{ id: "admin-panel", title: t("nav.admin_panel") || "Admin Panel", url: "/admin", icon: Shield }] : []),
      ],
    },
  ];

  const tenantGroups: MenuGroup[] = [
    {
      id: "home",
      label: L("Home", "হোম"),
      items: [
        { id: "dashboard", title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
        { id: "profile", title: L("My Profile", "আমার প্রোফাইল"), url: "/tenant/profile", icon: User },
      ],
    },
    {
      id: "living",
      label: L("Living", "বসবাস"),
      items: [
        { id: "landlord", title: L("My Landlord", "আমার বাড়িওয়ালা"), url: "/tenant/landlord", icon: Building2 },
        { id: "family", title: t("tenant.family_members"), url: "/tenant/family", icon: Users },
        { id: "guests", title: t("tenant.guests") || "Guests", url: "/tenant/guests", icon: UserCog },
      ],
    },
    {
      id: "finance",
      label: L("Finance & Complaints", "আর্থিক ও অভিযোগ"),
      items: [
        { id: "payments", title: t("tenant.payment_history") || "Payments", url: "/tenant/payments", icon: CreditCard },
        { id: "complaints", title: t("tenant.complaints") || "Complaints", url: "/tenant/complaints", icon: Receipt },
        { id: "notices", title: t("tenant.notices") || "Notices", url: "/tenant/notices", icon: Inbox },
      ],
    },
    {
      id: "communication",
      label: L("Communication & More", "যোগাযোগ ও অন্যান্য"),
      items: [
        { id: "tolet", title: t("nav.tolet") || "To-Let", url: "/tenant/tolet", icon: Home },
        { id: "messages", title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare },
        { id: "help", title: t("tenant.help_center") || "Help Center", url: "/tenant/help", icon: Shield },
        { id: "settings", title: t("nav.settings"), url: "/settings", icon: Settings },
      ],
    },
  ];

  const { orderedGroups, editMode, setEditMode, reorderGroups, reorderItems, resetOrder } = useSidebarOrder(
    role === "tenant" ? tenantGroups : landlordGroups
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedGroups.findIndex((g) => g.id === active.id);
    const newIndex = orderedGroups.findIndex((g) => g.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderGroups(oldIndex, newIndex);
  };

  const handleItemDragEnd = (groupId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const group = orderedGroups.find((g) => g.id === groupId);
    if (!group) return;
    const oldIndex = group.items.findIndex((i) => i.id === active.id);
    const newIndex = group.items.findIndex((i) => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderItems(groupId, oldIndex, newIndex);
  };

  // Staff & employee items (no drag & drop for these)
  const landlordStaffItems = [
    { id: "dashboard", title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard, permission: null },
    { id: "properties", title: t("nav.properties"), url: "/properties", icon: Building2, permission: "view_properties" },
    { id: "rooms", title: t("nav.rooms"), url: "/rooms", icon: DoorOpen, permission: "view_rooms" },
    { id: "meters", title: t("nav.meters"), url: "/meters", icon: Gauge, permission: "view_meters" },
    { id: "garages", title: L("Garages", "গ্যারেজ / পার্কিং"), url: "/garages", icon: Car, permission: "view_garages" },
    { id: "tenants", title: t("nav.tenants"), url: "/tenants", icon: Users, permission: "view_tenants" },
    { id: "guests", title: L("Guests", "অতিথি"), url: "/guests", icon: UserCog, permission: "view_guests" },
    { id: "complaints", title: L("Complaints", "অভিযোগ"), url: "/complaints", icon: AlertTriangle, permission: "manage_complaints" },
    { id: "notices", title: L("Notices", "নোটিশ বোর্ড"), url: "/notices", icon: Bell, permission: "manage_notices" },
    { id: "bills", title: t("nav.bills"), url: "/bills", icon: Receipt, permission: "view_bills" },
    { id: "payments", title: t("nav.payments"), url: "/payments", icon: CreditCard, permission: "view_payments" },
    { id: "accounting", title: L("Accounting", "হিসাব"), url: "/accounting", icon: Calculator, permission: "view_accounting" },
    { id: "assets", title: L("Assets", "সম্পদ"), url: "/assets", icon: Package, permission: "view_assets" },
    { id: "services", title: L("Services", "সেবা"), url: "/services", icon: Headphones, permission: "view_services" },
    { id: "messages", title: t("nav.messages") || "Messages", url: "/messages", icon: MessageSquare, permission: null },
    { id: "settings", title: t("nav.settings"), url: "/settings", icon: Settings, permission: null },
  ].filter(item => !item.permission || hasPermission(item.permission));

  const employeeItems = [
    { id: "dashboard", title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard },
    ...(hasPermission("manage_users") ? [{ id: "users", title: t("admin.users") || "Users", url: "/admin/users", icon: Users }] : []),
    ...(hasPermission("view_properties") ? [{ id: "properties", title: t("nav.properties"), url: "/admin/properties", icon: Building2 }] : []),
    ...(hasPermission("manage_cms") ? [{ id: "cms", title: t("admin.cms") || "CMS", url: "/admin/cms", icon: Receipt }] : []),
    ...(hasPermission("manage_tutorials") ? [{ id: "tutorials", title: t("admin.tutorials") || "Tutorials", url: "/admin/tutorials", icon: Inbox }] : []),
    { id: "settings", title: t("nav.settings"), url: "/settings", icon: Settings },
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

  // Landlord & Tenant use grouped + draggable layout
  if (role !== "landlord_staff" && role !== "employee") {
    const isLandlord = role !== "tenant";
    return (
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

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={editMode ? handleGroupDragEnd : undefined}>
            <SortableContext items={orderedGroups.map((g) => g.id)} strategy={verticalListSortingStrategy} disabled={!editMode}>
              {orderedGroups.map((group) => (
                <SortableGroup key={group.id} group={group} editMode={editMode}>
                  <SidebarGroup>
                    {!collapsed && !editMode && (
                      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3">
                        {group.label}
                      </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={editMode ? handleItemDragEnd(group.id) : undefined}>
                        <SortableContext items={group.items.map((i) => i.id)} strategy={verticalListSortingStrategy} disabled={!editMode}>
                          <SidebarMenu>
                            {group.items.map((item) =>
                              editMode ? (
                                <SortableItem
                                  key={item.id}
                                  item={item}
                                  editMode={editMode}
                                  collapsed={collapsed}
                                  isMobile={isMobile}
                                  setOpenMobile={setOpenMobile}
                                />
                              ) : (
                                renderMenuItem(item)
                              )
                            )}
                          </SidebarMenu>
                        </SortableContext>
                      </DndContext>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SortableGroup>
              ))}
            </SortableContext>
          </DndContext>

          {/* Edit mode toggle - only for landlord */}
          {isLandlord && !collapsed && (
            <div className="px-3 py-2 border-t border-border mt-auto">
              {editMode ? (
                <div className="flex flex-col gap-1.5">
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setEditMode(false)}>
                    {L("Done", "সম্পন্ন")}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => { resetOrder(); setEditMode(false); }}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {L("Reset Order", "ডিফল্ট ক্রম")}
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setEditMode(true)}>
                  <SettingsIcon className="h-3.5 w-3.5 mr-1.5" />
                  {L("Customize Menu", "মেনু সাজান")}
                </Button>
              )}
            </div>
          )}
        </SidebarContent>
      </Sidebar>
    );
  }

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
