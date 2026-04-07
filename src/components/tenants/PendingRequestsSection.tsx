import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Users, UserPlus, Send } from "lucide-react";
import { toast } from "sonner";

const PendingRequestsSection = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingMembers } = useQuery({
    queryKey: ["pending-members", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_members")
        .select("*, tenants!inner(full_name, phone, owner_id)")
        .eq("tenants.owner_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: pendingGuests } = useQuery({
    queryKey: ["pending-guests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*, tenants!inner(full_name, phone, owner_id)")
        .eq("tenants.owner_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Sent invitations by this landlord
  const { data: sentInvitations } = useQuery({
    queryKey: ["tenant-invitations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_invitations")
        .select("*")
        .eq("landlord_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch tenant names
      const tenantIds = (data || []).map((i: any) => i.tenant_id);
      if (tenantIds.length === 0) return [];
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, full_name, phone")
        .in("id", tenantIds);
      const tenantMap = Object.fromEntries((tenants || []).map((t: any) => [t.id, t]));
      return (data || []).map((inv: any) => ({
        ...inv,
        tenant_name: tenantMap[inv.tenant_id]?.full_name || "",
        tenant_phone: tenantMap[inv.tenant_id]?.phone || "",
      }));
    },
    enabled: !!user,
  });

  const verifyMemberMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tenant_members").update({
        status,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-members"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
      toast.success(language === "bn" ? "আপডেট হয়েছে" : "Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const verifyGuestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("guests").update({
        status,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-guests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-guests"] });
      toast.success(language === "bn" ? "আপডেট হয়েছে" : "Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPending = (pendingMembers?.length || 0) + (pendingGuests?.length || 0) + (sentInvitations?.length || 0);

  if (totalPending === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          {language === "bn" ? "অপেক্ষমাণ অনুরোধ" : "Pending Requests"}
          <Badge variant="secondary" className="ml-1">{totalPending}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Sent Invitations */}
        {sentInvitations?.map((inv: any) => (
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div>
              <div className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-medium text-sm">{inv.tenant_name}</p>
                <Badge variant="outline" className="text-xs">
                  {language === "bn" ? "ইনভিটেশন" : "Invitation"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {inv.tenant_phone}
                {" · "}
                {language === "bn" ? "অপেক্ষমাণ" : "Waiting for response"}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
            </Badge>
          </div>
        ))}

        {/* Pending Members */}
        {pendingMembers?.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-medium text-sm">{m.name}</p>
                <Badge variant="outline" className="text-xs">{m.relation}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "bn" ? "ভাড়াটিয়া" : "Tenant"}: {m.tenants?.full_name}
                {m.phone ? ` · ${m.phone}` : ""}
                {m.nid ? ` · NID: ${m.nid}` : ""}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => verifyMemberMutation.mutate({ id: m.id, status: "approved" })}>
                <CheckCircle2 className="h-3 w-3 mr-1" />{language === "bn" ? "অনুমোদন" : "Approve"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => verifyMemberMutation.mutate({ id: m.id, status: "rejected" })}>
                <XCircle className="h-3 w-3 mr-1" />{language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
              </Button>
            </div>
          </div>
        ))}

        {/* Pending Guests */}
        {pendingGuests?.map((g: any) => (
          <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="font-medium text-sm">{g.guest_name}</p>
                <Badge variant="outline" className="text-xs">{language === "bn" ? "অতিথি" : "Guest"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "bn" ? "ভাড়াটিয়া" : "Tenant"}: {g.tenants?.full_name}
                {g.phone ? ` · ${g.phone}` : ""}
                {` · ${new Date(g.visit_date).toLocaleDateString()}`}
                {` · ${g.duration_days} ${language === "bn" ? "দিন" : "day(s)"}`}
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => verifyGuestMutation.mutate({ id: g.id, status: "approved" })}>
                <CheckCircle2 className="h-3 w-3 mr-1" />{language === "bn" ? "অনুমোদন" : "Approve"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => verifyGuestMutation.mutate({ id: g.id, status: "rejected" })}>
                <XCircle className="h-3 w-3 mr-1" />{language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingRequestsSection;
