import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Mail, Home, MapPin, DoorOpen, User, Info, CheckCircle2, XCircle, Send, ShieldBan, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface LandlordInfo {
  full_name: string;
  phone: string;
  email: string;
  avatar_url: string | null;
}

interface RoomInfo {
  room_number: string;
  floor: number;
  rent_amount: number;
  property_name: string;
  property_address: string;
  property_area: string;
  property_district: string;
}

export default function TenantLandlord() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [landlord, setLandlord] = useState<LandlordInfo | null>(null);
  const [landlordUserId, setLandlordUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlinked, setIsUnlinked] = useState(false);

  const t = (en: string, bn: string) => language === "bn" ? bn : en;

  // Fetch pending invitations for this tenant
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
      // Fetch landlord profiles
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
        // Reload landlord data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.success(t("Invitation rejected.", "ইনভিটেশন প্রত্যাখ্যান করা হয়েছে।"));
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: tenant } = await supabase
        .from("tenants")
        .select("owner_id, room_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!tenant) { setLoading(false); return; }

      const tenantIsSelfOwned = tenant.owner_id === user.id;
      let landlordId: string | null = null;
      let fallbackRoomId: string | null = null;

      if (!tenantIsSelfOwned) {
        landlordId = tenant.owner_id;
      } else {
        const { data: acceptedReq } = await supabase
          .from("tolet_requests")
          .select("landlord_user_id, room_id")
          .eq("tenant_user_id", user.id)
          .eq("status", "accepted")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (acceptedReq) {
          landlordId = acceptedReq.landlord_user_id;
          fallbackRoomId = acceptedReq.room_id;
        }
        setIsUnlinked(!acceptedReq);
      }

      const effectiveRoomId = tenant.room_id || fallbackRoomId;

      const [landlordRes, roomRes] = await Promise.all([
        landlordId
          ? supabase.from("profiles").select("full_name, phone, email, avatar_url").eq("user_id", landlordId).maybeSingle()
          : Promise.resolve({ data: null }),
        effectiveRoomId
          ? supabase.from("rooms").select("room_number, floor, rent_amount, property_id").eq("id", effectiveRoomId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (landlordRes.data) setLandlord(landlordRes.data);

      if (roomRes.data) {
        const { data: prop } = await supabase
          .from("properties")
          .select("name, address, area, district")
          .eq("id", roomRes.data.property_id)
          .maybeSingle();
        setRoom({
          room_number: roomRes.data.room_number,
          floor: roomRes.data.floor,
          rent_amount: roomRes.data.rent_amount,
          property_name: prop?.name || "",
          property_address: prop?.address || "",
          property_area: prop?.area || "",
          property_district: prop?.district || "",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("My Landlord", "আমার বাড়িওয়ালা")}</h1>

      {/* Pending Invitations */}
      {(pendingInvitations?.length ?? 0) > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              {t("Pending Invitations", "অপেক্ষমাণ ইনভিটেশন")}
              <Badge variant="secondary" className="ml-1">{pendingInvitations?.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations?.map((inv: any) => (
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
      )}

      {isUnlinked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t(
              "Your account is not linked to a landlord yet. You can still submit complaints, and your landlord will be able to see them after your account is linked.",
              "আপনার অ্যাকাউন্ট এখনো কোনো বাড়িওয়ালার সাথে লিংক হয়নি। লিংক হওয়ার পর সম্পূর্ণ তথ্য দেখতে পাবেন।"
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Landlord Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              {t("Landlord Information", "বাড়িওয়ালার তথ্য")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {landlord ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={landlord.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {landlord.full_name?.charAt(0)?.toUpperCase() || "L"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{landlord.full_name}</p>
                    <p className="text-sm text-muted-foreground">{t("Landlord", "বাড়িওয়ালা")}</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{landlord.phone || t("Not available", "পাওয়া যায়নি")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{landlord.email || t("Not available", "পাওয়া যায়নি")}</span>
                  </div>
                  {/* Block Landlord button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={async () => {
                      try {
                        // Find landlord user_id from profiles
                        const { data: lp } = await supabase
                          .from("profiles")
                          .select("user_id")
                          .eq("full_name", landlord.full_name)
                          .eq("phone", landlord.phone)
                          .maybeSingle();
                        if (!lp) { toast.error("Could not find landlord"); return; }
                        const { error } = await supabase.from("user_blocks").insert({
                          blocker_id: user!.id,
                          blocked_id: lp.user_id,
                          reason: "",
                        });
                        if (error) throw error;
                        toast.success(t("Landlord blocked", "বাড়িওয়ালাকে ব্লক করা হয়েছে"));
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    <ShieldBan className="h-3.5 w-3.5 mr-1" />
                    {t("Block Landlord", "বাড়িওয়ালা ব্লক করুন")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t("No landlord assigned yet.", "এখনও কোনো বাড়িওয়ালা নির্ধারণ করা হয়নি।")}</p>
            )}
          </CardContent>
        </Card>

        {/* Room & Property Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {t("My Room & Property", "আমার রুম ও প্রপার্টি")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {room ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Room Number", "রুম নম্বর")}</p>
                    <p className="font-medium text-foreground">{room.room_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Floor", "তলা")}</p>
                    <p className="font-medium text-foreground">{room.floor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Property", "প্রপার্টি")}</p>
                    <p className="font-medium text-foreground">{room.property_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Address", "ঠিকানা")}</p>
                    <p className="font-medium text-foreground">
                      {[room.property_address, room.property_area, room.property_district].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">{t("No room assigned yet.", "এখনও কোনো রুম নির্ধারণ করা হয়নি।")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
