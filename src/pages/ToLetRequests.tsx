import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, XCircle, Clock, Inbox, Users, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const ToLetRequests = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  const { data: requests, isLoading } = useQuery({
    queryKey: ["tolet-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tolet_requests")
        .select("*, rooms(room_number, rent_amount, property_id, properties(name))")
        .eq("landlord_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch tenant profiles
  const tenantUserIds = [...new Set((requests || []).map((r: any) => r.tenant_user_id))];
  const { data: tenantProfiles } = useQuery({
    queryKey: ["tenant-profiles", tenantUserIds],
    queryFn: async () => {
      if (tenantUserIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", tenantUserIds);
      return data || [];
    },
    enabled: tenantUserIds.length > 0,
  });

  // Fetch tenant records to get tenant IDs for family member lookup
  const { data: tenantRecords } = useQuery({
    queryKey: ["tenant-records-for-requests", tenantUserIds],
    queryFn: async () => {
      if (tenantUserIds.length === 0) return [];
      const { data } = await supabase
        .from("tenants")
        .select("id, user_id, full_name, phone, nid, permanent_address, permanent_division, permanent_district, permanent_thana, permanent_village")
        .in("user_id", tenantUserIds);
      return data || [];
    },
    enabled: tenantUserIds.length > 0,
  });

  // Fetch family members for all requesting tenants
  const tenantIds = (tenantRecords || []).map((t: any) => t.id);
  const { data: familyMembers } = useQuery({
    queryKey: ["tenant-family-for-requests", tenantIds],
    queryFn: async () => {
      if (tenantIds.length === 0) return [];
      const { data } = await supabase
        .from("tenant_members")
        .select("*")
        .in("tenant_id", tenantIds);
      return data || [];
    },
    enabled: tenantIds.length > 0,
  });

  const profileMap = (tenantProfiles || []).reduce((acc: any, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const tenantRecordMap = (tenantRecords || []).reduce((acc: any, t: any) => {
    acc[t.user_id] = t;
    return acc;
  }, {});

  const familyByTenantId = (familyMembers || []).reduce((acc: any, m: any) => {
    if (!acc[m.tenant_id]) acc[m.tenant_id] = [];
    acc[m.tenant_id].push(m);
    return acc;
  }, {});

  const updateMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "accept" | "reject" }) => {
      const { data, error } = await supabase.functions.invoke("handle-tolet-accept", {
        body: { requestId: id, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tolet-requests"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(t("common.save") || "Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleExpand = (id: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />{t("tolet.accepted") || "Accepted"}</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{t("tolet.rejected") || "Rejected"}</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{t("tolet.pending") || "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.tolet_requests") || "To-Let Requests"}</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6 h-24 animate-pulse bg-muted" /></Card>
          ))}
        </div>
      ) : !requests?.length ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("tolet.no_requests") || "No rental requests yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => {
            const profile = profileMap[req.tenant_user_id];
            const tenantRecord = tenantRecordMap[req.tenant_user_id];
            const members = tenantRecord ? familyByTenantId[tenantRecord.id] || [] : [];
            const isExpanded = expandedRequests.has(req.id);

            return (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Tenant name & status */}
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{profile?.full_name || tenantRecord?.full_name || "Tenant"}</span>
                        {statusBadge(req.status)}
                      </div>

                      {/* Contact info */}
                      <p className="text-sm text-muted-foreground">
                        {(profile?.phone || tenantRecord?.phone) && <span className="mr-3">📱 {profile?.phone || tenantRecord?.phone}</span>}
                        {profile?.email && <span>✉️ {profile.email}</span>}
                      </p>

                      {/* Tenant details: NID, permanent address */}
                      {tenantRecord && (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {tenantRecord.nid && <p>🪪 NID: {tenantRecord.nid}</p>}
                          {(tenantRecord.permanent_address || tenantRecord.permanent_village) && (
                            <p>🏠 {[tenantRecord.permanent_village, tenantRecord.permanent_thana, tenantRecord.permanent_district, tenantRecord.permanent_division].filter(Boolean).join(", ")}{tenantRecord.permanent_address ? ` — ${tenantRecord.permanent_address}` : ""}</p>
                          )}
                        </div>
                      )}

                      {/* Room info */}
                      <p className="text-sm">
                        <span className="font-medium">{t("room.number") || "Room"}:</span>{" "}
                        {req.rooms?.room_number} — {req.rooms?.properties?.name}
                        <span className="ml-2 text-primary font-semibold">৳{Number(req.rooms?.rent_amount || 0).toLocaleString()}</span>
                      </p>

                      {req.message && (
                        <p className="text-sm text-muted-foreground italic">"{req.message}"</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>

                      {/* Family Members Collapsible */}
                      {members.length > 0 && (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(req.id)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 px-2 h-8 text-muted-foreground hover:text-foreground">
                              <Users className="h-4 w-4" />
                              {t("tenant.family_members") || "Family Members"} ({members.length})
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 border rounded-lg divide-y bg-muted/30">
                              {members.map((m: any) => (
                                <div key={m.id} className="px-3 py-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-muted-foreground">{m.relation}</span>
                                  {m.phone && <span className="text-muted-foreground">📱 {m.phone}</span>}
                                  {m.nid && <span className="text-muted-foreground">🪪 {m.nid}</span>}
                                  {m.occupation && <span className="text-muted-foreground">💼 {m.occupation}</span>}
                                  {m.status && (
                                    <Badge variant={m.status === "approved" ? "default" : m.status === "rejected" ? "destructive" : "secondary"} className="text-xs h-5">
                                      {m.status}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      {members.length === 0 && tenantRecord && (
                        <p className="text-xs text-muted-foreground italic">
                          <Users className="h-3 w-3 inline mr-1" />
                          {t("tenant.no_family_members") || "No family members added"}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    {req.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: req.id, action: "accept" })}
                          disabled={updateMutation.isPending}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t("tolet.accept") || "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: req.id, action: "reject" })}
                          disabled={updateMutation.isPending}
                          className="gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          {t("tolet.reject") || "Reject"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ToLetRequests;
