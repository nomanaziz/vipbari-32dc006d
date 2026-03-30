import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Phone, Mail, Home, MapPin, DoorOpen, User, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [landlord, setLandlord] = useState<LandlordInfo | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlinked, setIsUnlinked] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      // Get tenant record
      const { data: tenant } = await supabase
        .from("tenants")
        .select("owner_id, room_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!tenant) { setLoading(false); return; }

      const tenantIsSelfOwned = tenant.owner_id === user.id;

      // Determine landlord ID: use owner_id if linked, otherwise fallback to accepted request
      let landlordId: string | null = null;
      let fallbackRoomId: string | null = null;

      if (!tenantIsSelfOwned) {
        landlordId = tenant.owner_id;
      } else {
        // Fetch latest accepted tolet_request for fallback
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

        // Only truly unlinked if no accepted request either
        setIsUnlinked(!acceptedReq);
      }

      const effectiveRoomId = tenant.room_id || fallbackRoomId;

      // Fetch landlord profile and room info in parallel
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

  const t = (en: string, bn: string) => language === "bn" ? bn : en;

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

      {isUnlinked && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {language === "bn"
              ? "আপনার অ্যাকাউন্ট এখনো কোনো বাড়িওয়ালার সাথে লিংক হয়নি। লিংক হওয়ার পর সম্পূর্ণ তথ্য দেখতে পাবেন।"
              : "Your account is not linked to a landlord yet. You can still submit complaints, and your landlord will be able to see them after your account is linked."}
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
