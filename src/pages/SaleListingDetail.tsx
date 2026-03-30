import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MapPin, BedDouble, Bath, Maximize, Building2, Phone, MessageSquare, ArrowLeft, Layers, ShoppingCart, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { TransferPropertyDialog } from "@/components/sale/TransferPropertyDialog";
import { toast } from "sonner";
import { useState } from "react";

export default function SaleListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedImg, setSelectedImg] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const isLandlord = role === "landlord" || role === "landlord_staff";

  const { data: listing, isLoading } = useQuery({
    queryKey: ["sale-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_listings")
        .select("*, sale_listing_images(id, image_url, sort_order)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return {
        ...data,
        images: ((data as any).sale_listing_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      };
    },
  });

  const { data: isFav, refetch: refetchFav } = useQuery({
    queryKey: ["sale-fav", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("sale_favorites").select("id").eq("user_id", user!.id).eq("listing_id", id!).maybeSingle();
      return !!data;
    },
  });

  // Check if already sent a request
  const { data: existingRequest } = useQuery({
    queryKey: ["sale-buy-request", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_buy_requests")
        .select("id, status")
        .eq("listing_id", id!)
        .eq("buyer_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const toggleFav = async () => {
    if (!user) { toast.error(language === "bn" ? "লগইন করুন" : "Please login first"); return; }
    if (isFav) {
      await supabase.from("sale_favorites").delete().eq("user_id", user.id).eq("listing_id", id!);
    } else {
      await supabase.from("sale_favorites").insert({ user_id: user.id, listing_id: id! });
    }
    refetchFav();
  };

  const startChat = async () => {
    if (!user) { navigate("/login"); return; }
    if (!listing) return;
    const { data: existing } = await supabase
      .from("sale_conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (existing) {
      navigate(`/messages?tab=sale&conv=${existing.id}`);
    } else {
      const { data: conv, error } = await supabase.from("sale_conversations").insert({
        listing_id: listing.id,
        seller_id: listing.owner_id,
        buyer_id: user.id,
      }).select("id").single();
      if (error) { toast.error("Failed to start conversation"); return; }
      navigate(`/messages?tab=sale&conv=${conv.id}`);
    }
  };

  const sendBuyRequest = async () => {
    if (!user || !listing) return;
    setSending(true);
    const { error } = await supabase.from("sale_buy_requests").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.owner_id,
      message: requestMsg,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(language === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request sent successfully");
    queryClient.invalidateQueries({ queryKey: ["sale-buy-request", id] });
    setRequestOpen(false);
    setRequestMsg("");
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-4">
        <Skeleton className="h-[400px] rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        {language === "bn" ? "লিস্টিং পাওয়া যায়নি" : "Listing not found"}
      </div>
    </div>
  );

  const images = listing.images || [];
  const mainImage = images[selectedImg]?.image_url || "/images/default-room.png";
  const isOwner = user?.id === listing.owner_id;

  const typeLabels: Record<string, string> = {
    flat: language === "bn" ? "ফ্ল্যাট" : "Flat",
    apartment: language === "bn" ? "অ্যাপার্টমেন্ট" : "Apartment",
    land: language === "bn" ? "জমি" : "Land",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> {language === "bn" ? "পেছনে" : "Back"}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border">
              <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImg ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={listing.status === "sold" ? "bg-destructive text-white" : "bg-emerald-600 text-white"}>
                {listing.status === "sold" ? (language === "bn" ? "বিক্রিত" : "Sold") : (language === "bn" ? "বিক্রয়" : "For Sale")}
              </Badge>
              {listing.status === "sold" && (listing as any).transfer_status === "completed" && (
                <Badge className="bg-purple-600 text-white">
                  {language === "bn" ? "ট্রান্সফার সম্পন্ন" : "Transferred"}
                </Badge>
              )}
              {listing.status === "sold" && (listing as any).transfer_status === "pending" && isOwner && (
                <Badge variant="outline" className="border-amber-500 text-amber-600">
                  {language === "bn" ? "ট্রান্সফার বাকি" : "Transfer Pending"}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {(listing as any).sale_scope === "unit" || listing.room_id
                  ? (language === "bn" ? "ইউনিট বিক্রয়" : "Unit Sale")
                  : (language === "bn" ? "প্রপার্টি বিক্রয়" : "Property Sale")}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <p className="text-3xl font-bold text-primary">৳ {listing.price.toLocaleString()}</p>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{listing.location_address || `${listing.thana}, ${listing.district}`}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {typeLabels[listing.property_type] || listing.property_type}
              </div>
              {listing.bedrooms > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <BedDouble className="h-4 w-4 text-muted-foreground" /> {listing.bedrooms} {language === "bn" ? "বেডরুম" : "Bedrooms"}
                </div>
              )}
              {listing.bathrooms > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="h-4 w-4 text-muted-foreground" /> {listing.bathrooms} {language === "bn" ? "বাথরুম" : "Bathrooms"}
                </div>
              )}
              {listing.area_sqft > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Maximize className="h-4 w-4 text-muted-foreground" /> {listing.area_sqft} sqft
                </div>
              )}
              {listing.floor > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-muted-foreground" /> {language === "bn" ? "তলা" : "Floor"}: {listing.floor}
                </div>
              )}
            </div>

            {listing.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{language === "bn" ? "বিবরণ" : "Description"}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {/* Role-based actions */}
              {!isOwner && (
                <>
                  {isLandlord ? (
                    <>
                      {existingRequest ? (
                        <Badge variant="secondary" className="w-fit text-sm py-1.5 px-3">
                          {existingRequest.status === "pending"
                            ? (language === "bn" ? "অনুরোধ পাঠানো হয়েছে" : "Request Sent")
                            : existingRequest.status === "accepted"
                            ? (language === "bn" ? "অনুরোধ গৃহীত" : "Request Accepted")
                            : (language === "bn" ? "অনুরোধ প্রত্যাখ্যাত" : "Request Rejected")}
                        </Badge>
                      ) : (
                        <Button onClick={() => setRequestOpen(true)} className="gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          {language === "bn" ? "কেনার অনুরোধ" : "Request to Buy"}
                        </Button>
                      )}
                      <Button onClick={startChat} variant="outline" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {language === "bn" ? "বিক্রেতার সাথে চ্যাট" : "Chat with Seller"}
                      </Button>
                    </>
                  ) : (
                    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {language === "bn"
                              ? "আপনি যদি মেসেজ পাঠাতে বা কেনার অনুরোধ করতে চান, তাহলে অনুগ্রহ করে একটি বাড়িওয়ালা (Landlord) অ্যাকাউন্ট তৈরি করুন।"
                              : "To send messages or request to buy, please create a Landlord account."}
                          </p>
                          <Button asChild size="sm" className="mt-2">
                            <Link to="/register">
                              {language === "bn" ? "রেজিস্টার করুন" : "Register as Landlord"}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Contact phone - only if owner enabled it */}
              {(listing as any).show_contact_phone && listing.contact_phone && (
                <Button variant="outline" asChild className="gap-2">
                  <a href={`tel:${listing.contact_phone}`}>
                    <Phone className="h-4 w-4" />
                    {listing.contact_phone}
                  </a>
                </Button>
              )}

              <Button variant="ghost" onClick={toggleFav} className="gap-2">
                <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                {isFav ? (language === "bn" ? "সংরক্ষিত" : "Saved") : (language === "bn" ? "সংরক্ষণ করুন" : "Save")}
              </Button>

              {isOwner && listing.status === "sold" && listing.property_id && (listing as any).transfer_status !== "completed" && (
                <Button onClick={() => setTransferOpen(true)} className="gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  {((listing as any).sale_scope === "unit" || listing.room_id)
                    ? (language === "bn" ? "ফ্ল্যাট ট্রান্সফার সম্পন্ন করুন" : "Complete Flat Transfer")
                    : (language === "bn" ? "প্রপার্টি ট্রান্সফার সম্পন্ন করুন" : "Complete Property Transfer")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <LandingFooter />

      {/* Request to Buy dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "কেনার অনুরোধ পাঠান" : "Send Buy Request"}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={language === "bn" ? "বিক্রেতাকে মেসেজ লিখুন (ঐচ্ছিক)" : "Write a message to the seller (optional)"}
            value={requestMsg}
            onChange={(e) => setRequestMsg(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={sendBuyRequest} disabled={sending}>
              {sending ? "..." : (language === "bn" ? "অনুরোধ পাঠান" : "Send Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isOwner && listing?.property_id && (
        <TransferPropertyDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          listing={listing}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["sale-listing", id] })}
        />
      )}
    </div>
  );
}