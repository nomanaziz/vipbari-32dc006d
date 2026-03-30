import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Paperclip, Info, Megaphone, Pin, Calendar, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TenantNotices = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const { data: tenant } = useQuery({
    queryKey: ["my-tenant-record", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, owner_id, room_id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: acceptedRequest } = useQuery({
    queryKey: ["tenant-accepted-request-for-notices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tolet_requests")
        .select("landlord_user_id, room_id")
        .eq("tenant_user_id", user!.id)
        .eq("status", "accepted")
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: room } = useQuery({
    queryKey: ["my-room-for-notices", tenant?.room_id, acceptedRequest?.room_id],
    queryFn: async () => {
      const roomId = tenant?.room_id ?? acceptedRequest?.room_id;
      if (!roomId) return null;
      const { data, error } = await supabase.from("rooms").select("property_id").eq("id", roomId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.room_id || !!acceptedRequest?.room_id,
  });

  const { data: notices, isLoading } = useQuery({
    queryKey: ["tenant-notices", tenant?.owner_id, tenant?.id, room?.property_id, acceptedRequest?.landlord_user_id],
    queryFn: async () => {
      const filters: string[] = [];
      const linkedLandlordId = tenant?.owner_id && tenant.owner_id !== user?.id ? tenant.owner_id : null;
      const fallbackLandlordId = acceptedRequest?.landlord_user_id ?? null;
      const landlordIds = [...new Set([linkedLandlordId, fallbackLandlordId].filter(Boolean))];

      for (const landlordId of landlordIds) {
        filters.push(`and(target_type.eq.all,owner_id.eq.${landlordId})`);
        if (room?.property_id) {
          filters.push(`and(target_type.eq.property,target_id.eq.${room.property_id},owner_id.eq.${landlordId})`);
        }
      }
      filters.push(`and(target_type.eq.tenant,target_id.eq.${tenant!.id})`);

      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .or(filters.join(","))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const targetLabel = (type: string) => {
    if (type === "all") return L("Global", "সবার জন্য");
    if (type === "property") return L("Property", "প্রপার্টি");
    if (type === "tenant") return L("Personal", "ব্যক্তিগত");
    return type;
  };

  const targetColor = (type: string) => {
    if (type === "all") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (type === "property") return "bg-blue-500/10 text-blue-600 border-blue-200";
    if (type === "tenant") return "bg-purple-500/10 text-purple-600 border-purple-200";
    return "bg-muted text-muted-foreground";
  };

  const isUnlinked = tenant && tenant.owner_id === user?.id && !acceptedRequest;
  const pinnedNotice = notices?.[0];
  const restNotices = notices?.slice(1) || [];

  const NoticeCard = ({ n, index, isPinned = false }: { n: any; index?: number; isPinned?: boolean }) => {
    const isExpanded = expandedId === n.id;
    return (
      <Card className={`group relative overflow-hidden hover:shadow-lg transition-all duration-300 ${isPinned ? "border-primary/30 shadow-md" : ""}`}>
        {typeof index === "number" && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
            #{index + 1}
          </div>
        )}
        {isPinned && (
          <div className="absolute top-2 right-2">
            <Pin className="h-4 w-4 text-primary fill-primary" />
          </div>
        )}
        <CardContent className={`${isPinned ? "p-5" : "p-4"}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <h3 className={`font-semibold text-foreground ${isPinned ? "text-lg" : "text-sm"} line-clamp-2`}>
                {n.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {isPinned && (
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                    {L("Pinned", "পিন করা")}
                  </Badge>
                )}
                <Badge className={`text-xs ${targetColor(n.target_type)}`}>
                  {targetLabel(n.target_type)}
                </Badge>
              </div>
              {n.description && (
                <p className={`text-sm text-muted-foreground ${isExpanded ? "" : isPinned ? "line-clamp-3" : "line-clamp-2"}`}>
                  {n.description}
                </p>
              )}
              {n.attachment_url && (
                <a href={n.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5" />
                  {L("Attachment", "সংযুক্তি দেখুন")}
                </a>
              )}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(n.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
                {n.description && n.description.length > 100 && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary gap-1" onClick={() => setExpandedId(isExpanded ? null : n.id)}>
                    <Eye className="h-3 w-3" />
                    {isExpanded ? L("Show less", "সংক্ষেপে") : L("Read more", "বিস্তারিত দেখুন")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {isUnlinked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {L(
              "Your account is not linked to a landlord yet. You can still submit complaints, and your landlord will be able to see them after your account is linked.",
              "আপনার অ্যাকাউন্ট এখনো কোনো বাড়িওয়ালার সাথে লিংক হয়নি। লিংক হওয়ার পর আপনি বাড়িওয়ালার নোটিশ দেখতে পাবেন।"
            )}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          {t("tenant.notices")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {L("All important announcements from your landlord", "আপনার বাড়িওয়ালার সকল গুরুত্বপূর্ণ ঘোষণা এখানে দেখুন")}
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : !notices?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">{L("No notices yet", "কোনো নোটিশ নেই")}</p>
            <p className="text-sm">{L("Your landlord hasn't posted any notices", "আপনার বাড়িওয়ালা এখনো কোনো নোটিশ দেননি")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pinnedNotice && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {L("Latest Notice", "সর্বশেষ ঘোষণা")}
              </h2>
              <div className="max-w-2xl">
                <NoticeCard n={pinnedNotice} isPinned />
              </div>
            </div>
          )}

          {restNotices.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                {L("All Notices", "সকল ঘোষণা")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {restNotices.map((n: any, i: number) => (
                  <NoticeCard key={n.id} n={n} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantNotices;
