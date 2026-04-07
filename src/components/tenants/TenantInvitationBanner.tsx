import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const TenantInvitationBanner = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = (en: string, bn: string) => (language === "bn" ? bn : en);

  const { data: pendingInvitations } = useQuery({
    queryKey: ["tenant-pending-invitations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_invitations")
        .select("*")
        .eq("tenant_user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const landlordIds = (data || []).map((i: any) => i.landlord_id);
      if (landlordIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", landlordIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      return (data || []).map((inv: any) => ({
        ...inv,
        landlord_name: profileMap[inv.landlord_id]?.full_name || "",
        landlord_phone: profileMap[inv.landlord_id]?.phone || "",
      }));
    },
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ invitation_id, response }: { invitation_id: string; response: string }) => {
      const { data, error } = await supabase.functions.invoke("link-tenant", {
        body: { action: "respond", invitation_id, response },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-pending-invitations"] });
      if (variables.response === "accepted") {
        toast.success(t("Invitation accepted! You are now linked.", "ইনভিটেশন গৃহীত! আপনি এখন লিংক হয়েছেন।"));
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.success(t("Invitation rejected.", "ইনভিটেশন প্রত্যাখ্যান করা হয়েছে।"));
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!pendingInvitations?.length) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-600" />
          {t("Pending Invitations", "অপেক্ষমাণ ইনভিটেশন")}
          <Badge variant="secondary" className="ml-1">{pendingInvitations.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingInvitations.map((inv: any) => (
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div>
              <p className="font-medium text-sm">{inv.landlord_name}</p>
              <p className="text-xs text-muted-foreground">
                {inv.landlord_phone}
                {" · "}
                {t("wants to link you as a tenant", "আপনাকে ভাড়াটিয়া হিসেবে যুক্ত করতে চান")}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                disabled={respondMutation.isPending}
                onClick={() => respondMutation.mutate({ invitation_id: inv.id, response: "accepted" })}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t("Accept", "গ্রহণ")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive"
                disabled={respondMutation.isPending}
                onClick={() => respondMutation.mutate({ invitation_id: inv.id, response: "rejected" })}
              >
                <XCircle className="h-3 w-3 mr-1" />
                {t("Reject", "প্রত্যাখ্যান")}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TenantInvitationBanner;
