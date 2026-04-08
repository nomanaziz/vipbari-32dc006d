import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, FileEdit } from "lucide-react";
import { toast } from "sonner";

const FIELD_LABELS: Record<string, { en: string; bn: string }> = {
  full_name: { en: "Name", bn: "নাম" },
  father_name: { en: "Father's Name", bn: "পিতার নাম" },
  marital_status: { en: "Marital Status", bn: "বৈবাহিক অবস্থা" },
  religion: { en: "Religion", bn: "ধর্ম" },
  education: { en: "Education", bn: "শিক্ষাগত যোগ্যতা" },
  workplace_address: { en: "Workplace Address", bn: "কর্মস্থলের ঠিকানা" },
  passport_number: { en: "Passport Number", bn: "পাসপোর্ট নম্বর" },
  email: { en: "Email", bn: "ইমেইল" },
  emergency_name: { en: "Emergency Contact Name", bn: "জরুরী যোগাযোগ নাম" },
  emergency_relation: { en: "Emergency Relation", bn: "জরুরী সম্পর্ক" },
  emergency_address: { en: "Emergency Address", bn: "জরুরী ঠিকানা" },
  emergency_phone: { en: "Emergency Phone", bn: "জরুরী ফোন" },
  domestic_worker_name: { en: "Domestic Worker Name", bn: "গৃহকর্মী নাম" },
  domestic_worker_nid: { en: "Domestic Worker NID", bn: "গৃহকর্মী NID" },
  domestic_worker_phone: { en: "Domestic Worker Phone", bn: "গৃহকর্মী ফোন" },
  domestic_worker_address: { en: "Domestic Worker Address", bn: "গৃহকর্মী ঠিকানা" },
  driver_name: { en: "Driver Name", bn: "ড্রাইভার নাম" },
  driver_nid: { en: "Driver NID", bn: "ড্রাইভার NID" },
  driver_phone: { en: "Driver Phone", bn: "ড্রাইভার ফোন" },
  driver_address: { en: "Driver Address", bn: "ড্রাইভার ঠিকানা" },
  prev_landlord_name: { en: "Previous Landlord Name", bn: "পূর্ববর্তী বাড়িওয়ালার নাম" },
  prev_landlord_phone: { en: "Previous Landlord Phone", bn: "পূর্ববর্তী বাড়িওয়ালার ফোন" },
  prev_landlord_address: { en: "Previous Landlord Address", bn: "পূর্ববর্তী বাড়িওয়ালার ঠিকানা" },
  prev_leave_reason: { en: "Reason for Leaving", bn: "পূর্ববর্তী বাসা ছাড়ার কারণ" },
  current_landlord_name: { en: "Current Landlord Name", bn: "বর্তমান বাড়িওয়ালার নাম" },
  current_landlord_phone: { en: "Current Landlord Phone", bn: "বর্তমান বাড়িওয়ালার ফোন" },
  living_since: { en: "Living Since", bn: "বসবাসের তারিখ" },
};

interface EditApprovalSectionProps {
  /** "landlord" shows requests waiting for landlord approval; "tenant" shows requests waiting for tenant */
  role: "landlord" | "tenant";
}

const EditApprovalSection = ({ role }: EditApprovalSectionProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Requests where current user needs to approve
  const { data: pendingRequests } = useQuery({
    queryKey: ["tenant-edit-requests", user?.id, "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_edit_requests")
        .select("*")
        .eq("approve_by", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get tenant names
      const tenantIds = [...new Set((data || []).map((r: any) => r.tenant_id))];
      if (tenantIds.length === 0) return [];
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, full_name")
        .in("id", tenantIds);
      const tenantMap = Object.fromEntries((tenants || []).map((t: any) => [t.id, t.full_name]));

      // Get requester names
      const requesterIds = [...new Set((data || []).map((r: any) => r.requested_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", requesterIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      return (data || []).map((r: any) => ({
        ...r,
        tenant_name: tenantMap[r.tenant_id] || "",
        requester_name: profileMap[r.requested_by] || "",
      }));
    },
    enabled: !!user,
  });

  // Requests current user has sent (waiting for other party)
  const { data: sentRequests } = useQuery({
    queryKey: ["tenant-edit-requests-sent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_edit_requests")
        .select("*")
        .eq("requested_by", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const tenantIds = [...new Set((data || []).map((r: any) => r.tenant_id))];
      if (tenantIds.length === 0) return [];
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, full_name")
        .in("id", tenantIds);
      const tenantMap = Object.fromEntries((tenants || []).map((t: any) => [t.id, t.full_name]));
      return (data || []).map((r: any) => ({
        ...r,
        tenant_name: tenantMap[r.tenant_id] || "",
      }));
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: async (request: any) => {
      const changes = request.field_changes as Record<string, any>;

      // Check if this is a release request
      if (changes._action === "release") {
        // Release the tenant: update status, clear room, save reason
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("room_id")
          .eq("id", request.tenant_id)
          .maybeSingle();

        const { error: updateErr } = await supabase
          .from("tenants")
          .update({
            status: "inactive",
            room_id: null,
            released_at: new Date().toISOString(),
            release_reason: changes.release_reason || "",
            release_notes: changes.release_notes || "",
            prev_leave_reason: changes.release_reason === "all_paid"
              ? (language === "bn" ? "সব বিল পরিশোধ করে চলে গেছে" : "Left — all bills paid")
              : changes.release_reason === "unpaid"
              ? (language === "bn" ? "বিল বাকি রেখে চলে গেছে" : "Left — bills unpaid")
              : (changes.release_notes || changes.release_reason || ""),
          } as any)
          .eq("id", request.tenant_id);
        if (updateErr) throw updateErr;

        // Vacate the room
        if (tenantData?.room_id) {
          await supabase.from("rooms").update({ status: "vacant", tenant_id: null }).eq("id", tenantData.room_id);
        }
      } else {
        // Normal field changes
        const { error: updateErr } = await supabase
          .from("tenants")
          .update(changes as any)
          .eq("id", request.tenant_id);
        if (updateErr) throw updateErr;
      }

      // Mark as approved
      const { error } = await supabase
        .from("tenant_edit_requests")
        .update({ status: "approved", resolved_at: new Date().toISOString() } as any)
        .eq("id", request.id);
      if (error) throw error;

      // Notify the requester
      await supabase.from("notifications").insert({
        user_id: request.requested_by,
        title: changes._action === "release"
          ? (language === "bn" ? "বাড়ি ছাড়ার অনুরোধ অনুমোদিত" : "Release Request Approved")
          : (language === "bn" ? "তথ্য পরিবর্তন অনুমোদিত" : "Edit Request Approved"),
        body: changes._action === "release"
          ? (language === "bn" ? "আপনার বাড়ি ছাড়ার অনুরোধ অনুমোদিত হয়েছে" : "Your release request has been approved")
          : (language === "bn" ? "আপনার তথ্য পরিবর্তনের অনুরোধ অনুমোদিত হয়েছে" : "Your edit request has been approved"),
        type: "edit_request",
        reference_id: request.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests-sent"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["my-tenant-profile"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(language === "bn" ? "অনুমোদিত হয়েছে" : "Approved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (request: any) => {
      const { error } = await supabase
        .from("tenant_edit_requests")
        .update({ status: "rejected", resolved_at: new Date().toISOString() } as any)
        .eq("id", request.id);
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.requested_by,
        title: language === "bn" ? "তথ্য পরিবর্তন প্রত্যাখ্যাত" : "Edit Request Rejected",
        body: language === "bn" ? "আপনার তথ্য পরিবর্তনের অনুরোধ প্রত্যাখ্যাত হয়েছে" : "Your edit request has been rejected",
        type: "edit_request",
        reference_id: request.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-edit-requests-sent"] });
      toast.success(language === "bn" ? "প্রত্যাখ্যাত হয়েছে" : "Rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalPending = (pendingRequests?.length || 0) + (sentRequests?.length || 0);
  if (totalPending === 0) return null;

  const getFieldLabel = (key: string) => {
    const label = FIELD_LABELS[key];
    return label ? (language === "bn" ? label.bn : label.en) : key;
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-blue-600" />
          {language === "bn" ? "তথ্য পরিবর্তনের অনুরোধ" : "Edit Requests"}
          <Badge variant="secondary" className="ml-1">{totalPending}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Requests waiting for MY approval */}
        {pendingRequests?.map((req: any) => {
          const changes = req.field_changes as Record<string, any>;
          const isReleaseRequest = changes._action === "release";

          return (
            <div key={req.id} className={`p-3 rounded-lg border bg-background space-y-2 ${isReleaseRequest ? "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {isReleaseRequest
                      ? (language === "bn" ? `${req.tenant_name} বাড়ি ছাড়তে চাইছেন` : `${req.tenant_name} wants to leave`)
                      : `${req.requester_name} → ${req.tenant_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "অনুমোদনের জন্য অপেক্ষমাণ" : "Waiting for your approval"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => approveMutation.mutate(req)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {language === "bn" ? "অনুমোদন" : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive"
                    onClick={() => rejectMutation.mutate(req)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    {language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                  </Button>
                </div>
              </div>
              <div className="text-xs space-y-0.5 bg-muted/50 rounded p-2">
                {isReleaseRequest ? (
                  <>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">{language === "bn" ? "কারণ" : "Reason"}:</span>
                      <span className="font-medium">
                        {changes.release_reason === "all_paid" ? (language === "bn" ? "সব বিল পরিশোধ করে চলে গেছে" : "All bills paid") :
                         changes.release_reason === "unpaid" ? (language === "bn" ? "বিল বাকি রেখে চলে গেছে" : "Bills unpaid") :
                         (language === "bn" ? "অন্যান্য" : "Other")}
                      </span>
                    </div>
                    {changes.release_notes && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">{language === "bn" ? "নোট" : "Notes"}:</span>
                        <span className="font-medium">{changes.release_notes}</span>
                      </div>
                    )}
                  </>
                ) : (
                  Object.entries(changes).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground">{getFieldLabel(key)}:</span>
                      <span className="font-medium">{String(val || "—")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* Requests I sent (waiting for other party) */}
        {sentRequests?.map((req: any) => (
          <div key={req.id} className="p-3 rounded-lg border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{req.tenant_name}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? "অনুমোদনের জন্য পাঠানো হয়েছে" : "Sent for approval"}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="h-3 w-3" />
                {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
              </Badge>
            </div>
            <div className="text-xs space-y-0.5 bg-muted/50 rounded p-2">
              {Object.entries(req.field_changes as Record<string, any>).map(([key, val]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-muted-foreground">{getFieldLabel(key)}:</span>
                  <span className="font-medium">{String(val || "—")}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EditApprovalSection;
