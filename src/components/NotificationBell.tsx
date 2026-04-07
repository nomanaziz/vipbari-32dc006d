import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function NotificationBell() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const getNotificationRoute = (type: string, referenceId?: string | null): string => {
    switch (type) {
      case "request_accepted":
      case "request_rejected":
        return "/tenant/tolet";
      case "new_request":
        return "/tolet-requests";
      case "room_assigned":
        return "/rooms";
      case "payment_reminder":
        return "/tenant/payments";
      case "new_notice":
        return "/tenant/notices";
      case "new_complaint":
        return "/complaints";
      case "complaint_update":
        return "/tenant/complaints";
      case "tenant_invitation":
        return "/tenant/landlord";
      case "tenant_invitation_accepted":
      case "tenant_invitation_rejected":
        return "/tenants";
      default:
        return "/dashboard";
    }
  };

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const unreadCount = (notifications || []).filter((n: any) => !n.is_read).length;

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  const markOneRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "request_accepted": return "✅";
      case "request_rejected": return "❌";
      case "new_request": return "📩";
      case "room_assigned": return "🏠";
      case "tenant_invitation": return "📨";
      case "tenant_invitation_accepted": return "✅";
      case "tenant_invitation_rejected": return "❌";
      default: return "🔔";
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === "bn" ? "এইমাত্র" : "Just now";
    if (mins < 60) return language === "bn" ? `${mins} মিনিট আগে` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return language === "bn" ? `${hrs} ঘণ্টা আগে` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return language === "bn" ? `${days} দিন আগে` : `${days}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">
            {language === "bn" ? "নোটিফিকেশন" : "Notifications"}
          </h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              {language === "bn" ? "সব পড়া হিসেবে চিহ্নিত করুন" : "Mark all read"}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {!notifications?.length ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              {language === "bn" ? "কোনো নোটিফিকেশন নেই" : "No notifications"}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n: any) => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => {
                    if (!n.is_read) markOneRead(n.id);
                    const route = getNotificationRoute(n.type, n.reference_id);
                    setOpen(false);
                    navigate(route);
                  }}
                >
                  <div className="flex gap-2">
                    <span className="text-base mt-0.5">{typeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {!n.is_read && (
                          <Badge className="h-2 w-2 p-0 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
