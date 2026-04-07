import { useState } from "react";
import { getDefaultImage } from "@/lib/defaultImages";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicNavbar } from "@/components/PublicNavbar";
import ContactNumber from "@/components/tolet/ContactNumber";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import RoomAmenityBadges from "@/components/rooms/RoomAmenityBadges";
import AdBanner from "@/components/ads/AdBanner";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Send, MapPin, CalendarClock, Home, DoorOpen, Store, ChevronRight,
  Bed, Bath, Layers, Maximize, Flame, Car, Bike, ArrowLeft, ExternalLink,
} from "lucide-react";

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const [requestDialog, setRequestDialog] = useState(false);
  const [message, setMessage] = useState("");

  // Try room first
  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["listing-room", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, properties!inner(name, address, owner_id, division, district, thana, area, tolet_phone, map_url, has_garage, has_internet, has_dish, has_security, has_cctv, has_lift, has_generator, has_parking, has_gas_supply, has_water_supply, has_rooftop_access), room_images(id, image_url, sort_order)")
        .eq("id", id!)
        .eq("is_tolet", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Try garage if room not found
  const { data: garage, isLoading: garageLoading } = useQuery({
    queryKey: ["listing-garage", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garages")
        .select("*, properties!inner(name, address, owner_id, division, district, thana, area, tolet_phone, map_url)")
        .eq("id", id!)
        .eq("is_tolet", true)
        .eq("status", "vacant")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !room,
  });

  const { data: activeBoosts } = useQuery({
    queryKey: ["listing-boost", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("room_boosts")
        .select("room_id")
        .eq("room_id", id!)
        .gt("expires_at", new Date().toISOString());
      return data || [];
    },
    enabled: !!id,
  });

  // Similar listings
  const { data: similarRooms } = useQuery({
    queryKey: ["similar-listings", room?.property_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_number, rent_amount, room_type, floor, properties!inner(name, address)")
        .eq("is_tolet", true)
        .neq("id", id!)
        .limit(3);
      return data || [];
    },
    enabled: !!room,
  });

  const requestMutation = useMutation({
    mutationFn: async ({ roomId, landlordId }: { roomId: string; landlordId: string }) => {
      const { error } = await supabase.from("tolet_requests").insert({
        room_id: roomId,
        tenant_user_id: user!.id,
        landlord_user_id: landlordId,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("tolet.request_sent") || "Request sent!");
      setRequestDialog(false);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["listing-room"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLoading = roomLoading || (garageLoading && !room);
  const listing = room || garage;
  const isRoom = !!room;
  const isGarage = !!garage && !room;
  const isBoosted = (activeBoosts || []).some((b: any) => b.room_id === id);
  const images = isRoom ? (room.room_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order) : [];

  const handleRequestClick = () => {
    if (!user) { navigate("/register?role=tenant"); return; }
    if (role !== "tenant") { toast.error(language === "bn" ? "শুধুমাত্র ভাড়াটিয়ারা অনুরোধ পাঠাতে পারেন" : "Only tenants can send rental requests"); return; }
    setRequestDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-40 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <DoorOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">{language === "bn" ? "লিস্টিং পাওয়া যায়নি" : "Listing not found"}</h2>
          <Button variant="outline" onClick={() => navigate("/tolet")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "bn" ? "টু-লেট পেজে ফিরুন" : "Back to To-Let"}
          </Button>
        </div>
        <LandingFooter />
      </div>
    );
  }

  const property = listing.properties as any;

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/tolet" className="hover:text-foreground transition-colors">
            {language === "bn" ? "টু-লেট" : "To-Let"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{property?.name}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">
            {isRoom ? room.room_number : (garage as any).garage_number}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {isRoom && images.length > 0 ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                  <img
                    src={images[selectedImage]?.image_url}
                    alt={room.room_number}
                    className="w-full h-full object-cover"
                  />
                  {isBoosted && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Flame className="h-3.5 w-3.5" />
                      {language === "bn" ? "বুস্টেড" : "Boosted"}
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img: any, idx: number) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(idx)}
                        className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${idx === selectedImage ? "border-primary" : "border-transparent hover:border-muted-foreground/30"}`}
                      >
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : isGarage ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={getDefaultImage("garage")} alt="Garage" className="w-full h-full object-cover" />
                {isBoosted && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Flame className="h-3.5 w-3.5" />
                    {language === "bn" ? "বুস্টেড" : "Boosted"}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src="/images/default-room.png" alt={room?.room_number || "Room"} className="w-full h-full object-cover" />
                {isBoosted && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Flame className="h-3.5 w-3.5" />
                    {language === "bn" ? "বুস্টেড" : "Boosted"}
                  </div>
                )}
              </div>
            )}

            {/* Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-2xl">
                    {isRoom ? room.room_number : (garage as any).garage_number}
                  </CardTitle>
                  <Badge variant="secondary" className="text-sm">
                    {isRoom ? room.room_type : (language === "bn" ? "গ্যারেজ" : "Garage")}
                  </Badge>
                </div>
                {isRoom && room.status === "vacant" ? (
                  <Badge className="bg-green-600 text-white hover:bg-green-700 w-fit">
                    {language === "bn" ? "এখন খালি" : "Available Now"}
                  </Badge>
                ) : isRoom && room.available_from ? (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-600 gap-1 w-fit">
                    <CalendarClock className="h-3 w-3" />
                    {language === "bn" ? "খালি হবে" : "Available from"} {format(new Date(room.available_from), "dd MMM yyyy")}
                  </Badge>
                ) : isGarage ? (
                  <Badge className="bg-green-600 text-white hover:bg-green-700 w-fit">
                    {language === "bn" ? "এখন খালি" : "Available Now"}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold text-primary">
                  ৳{Number(listing.rent_amount).toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/{language === "bn" ? "মাস" : "month"}</span>
                </p>

                {isRoom && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{room.bedrooms} {language === "bn" ? "বেডরুম" : "Bed"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{room.bathrooms} {language === "bn" ? "বাথরুম" : "Bath"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{language === "bn" ? `${room.floor} তলা` : `Floor ${room.floor}`}</span>
                    </div>
                    {room.area_sqft > 0 && (
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{room.area_sqft} sqft</span>
                      </div>
                    )}
                  </div>
                )}

                {isGarage && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {(garage as any).garage_type === "car" ? (language === "bn" ? "গাড়ি" : "Car") :
                       (garage as any).garage_type === "bike" ? (language === "bn" ? "বাইক" : "Bike") :
                       (language === "bn" ? "অন্যান্য" : "Other")}
                    </Badge>
                  </div>
                )}

                {isRoom && <RoomAmenityBadges room={room} property={property} />}

                {listing.description && (
                  <div>
                    <h3 className="font-semibold mb-1">{language === "bn" ? "বিবরণ" : "Description"}</h3>
                    <p className="text-sm text-muted-foreground">{listing.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inline Ad */}
            <AdBanner placement="inline" />

            {/* Property Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{language === "bn" ? "সম্পত্তি তথ্য" : "Property Info"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href={property?.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property?.name, property?.address, property?.thana, property?.district, property?.division].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-primary transition-colors group"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                  <div>
                    <p className="font-medium">{property?.name}</p>
                    <p className="text-sm text-muted-foreground">{property?.address}</p>
                    {(property?.division || property?.district || property?.thana) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[property?.thana, property?.district, property?.division].filter(Boolean).join(", ")}
                      </p>
                     )}
                   </div>
                   <ExternalLink className="h-3.5 w-3.5 mt-1 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground" />
                 </a>
                 {property?.tolet_phone && (
                   <div className="flex items-center gap-2 pt-2 border-t">
                     <ContactNumber phone={property.tolet_phone} roomNumber={isRoom ? room?.room_number : (garage as any)?.garage_number} propertyName={property?.name} />
                   </div>
                 )}
              </CardContent>
            </Card>

            {/* Request to Rent */}
            <Button size="lg" className="w-full gap-2 text-base" onClick={handleRequestClick}>
              <Send className="h-5 w-5" />
              {t("tolet.request_rent") || "Request to Rent"}
            </Button>

            {/* Similar Listings */}
            {similarRooms && similarRooms.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">{language === "bn" ? "একই রকম লিস্টিং" : "Similar Listings"}</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {similarRooms.map((sr: any) => (
                    <Link key={sr.id} to={`/tolet/${sr.id}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <p className="font-semibold">{sr.room_number}</p>
                          <p className="text-primary font-bold">৳{Number(sr.rent_amount).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{(sr.properties as any)?.name}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Ad */}
            <AdBanner placement="listing_detail" />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <AdBanner placement="sidebar" />
            {/* Google Ad placeholder */}
            <div className="bg-muted/20 border border-dashed border-muted-foreground/15 rounded-lg p-4 text-center min-h-[250px] flex items-center justify-center">
              <span className="text-xs text-muted-foreground/30">Google Ad</span>
            </div>
            <AdBanner placement="sidebar" className="mt-4" />
          </aside>
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={requestDialog} onOpenChange={setRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tolet.request_rent") || "Request to Rent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-semibold">
                {isRoom ? room?.room_number : (garage as any)?.garage_number} - {property?.name}
              </p>
              <p className="text-sm text-muted-foreground">৳{Number(listing.rent_amount).toLocaleString()}/{language === "bn" ? "মাস" : "month"}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("tolet.message") || "Message (optional)"}</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={language === "bn" ? "নিজের পরিচয় দিন..." : "Introduce yourself..."} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRequestDialog(false)}>{t("common.cancel")}</Button>
              <Button
                onClick={() => {
                  const landlordId = property?.owner_id;
                  if (landlordId) requestMutation.mutate({ roomId: listing.id, landlordId });
                }}
                disabled={requestMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {t("tolet.send_request") || "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LandingFooter />
    </div>
  );
};

export default ListingDetail;
