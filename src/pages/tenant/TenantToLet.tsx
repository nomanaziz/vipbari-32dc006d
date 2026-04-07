import { useState, useMemo } from "react";
import { getDefaultImage } from "@/lib/defaultImages";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, MapPin, Send, Car, Bike, Flame, ExternalLink, CalendarClock, Building2, BedDouble, Bath, Maximize, Home, ArrowUpDown, Wifi, Zap } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";
import RoomAmenityBadges from "@/components/rooms/RoomAmenityBadges";
import ContactNumber from "@/components/tolet/ContactNumber";
import ToLetFilters, { ToLetFilterState, defaultFilters } from "@/components/tolet/ToLetFilters";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const TenantToLet = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ToLetFilterState>({ ...defaultFilters });
  const [requestDialog, setRequestDialog] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 21;
  const BOOST_SLOTS = 3;
  const REGULAR_PER_PAGE = ITEMS_PER_PAGE - BOOST_SLOTS;

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["tolet-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*, properties!inner(name, address, owner_id, division, district, thana, area, tolet_phone, map_url, has_garage, has_internet, has_dish, has_security, has_cctv, has_lift, has_generator, has_parking, has_gas_supply, has_water_supply, has_rooftop_access)")
        .eq("is_tolet", true)
        .eq("status", "vacant");
      if (error) throw error;
      return (data || []).map((r: any) => ({ ...r, _type: "room" as const }));
    },
  });

  const { data: garages, isLoading: garagesLoading } = useQuery({
    queryKey: ["tolet-garages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garages")
        .select("*, properties!inner(name, address, owner_id, division, district, thana, area, tolet_phone, map_url)")
        .eq("is_tolet", true)
        .eq("status", "vacant");
      if (error) throw error;
      return (data || []).map((g: any) => ({ ...g, _type: "garage" as const }));
    },
  });

  const isLoading = roomsLoading || garagesLoading;

  const { data: activeBoosts } = useQuery({
    queryKey: ["active-room-boosts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("room_boosts")
        .select("room_id")
        .gt("expires_at", new Date().toISOString());
      return data || [];
    },
  });

  const { data: myRequests } = useQuery({
    queryKey: ["my-tolet-requests", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tolet_requests")
        .select("room_id")
        .eq("tenant_user_id", user!.id)
        .in("status", ["pending", "approved"]);
      return data || [];
    },
    enabled: !!user,
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
      toast.success(t("tolet.request_sent") || "Request sent successfully!");
      setRequestDialog(null);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["tolet-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["my-tolet-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Merge rooms + garages
  let allListings: any[] = [
    ...((filters.listingType === "" || filters.listingType === "room") ? (rooms || []) : []),
    ...((filters.listingType === "" || filters.listingType === "garage") ? (garages || []) : []),
  ];

  let filtered = allListings;
  const requestedRoomIds = new Set((myRequests || []).map((r: any) => r.room_id));
  if (requestedRoomIds.size > 0) filtered = filtered.filter((r: any) => r._type === "garage" || !requestedRoomIds.has(r.id));
  if (filters.division) filtered = filtered.filter((r: any) => r.properties?.division === filters.division);
  if (filters.district) filtered = filtered.filter((r: any) => r.properties?.district === filters.district);
  if (filters.thana) filtered = filtered.filter((r: any) => r.properties?.thana === filters.thana);
  if (filters.areaSearch) {
    const q = filters.areaSearch.toLowerCase();
    filtered = filtered.filter((r: any) => r.properties?.area?.toLowerCase().includes(q) || r.properties?.name?.toLowerCase().includes(q));
  }
  if (filters.priceMin) filtered = filtered.filter((r: any) => Number(r.rent_amount) >= Number(filters.priceMin));
  if (filters.priceMax) filtered = filtered.filter((r: any) => Number(r.rent_amount) <= Number(filters.priceMax));
  if (filters.roomType) filtered = filtered.filter((r: any) => r._type === "garage" || r.room_type === filters.roomType);
  if (filters.floorMin) filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.floor) >= Number(filters.floorMin));
  if (filters.floorMax) filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.floor) <= Number(filters.floorMax));
  if (filters.sqftMin) filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.area_sqft) >= Number(filters.sqftMin));
  if (filters.sqftMax) filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.area_sqft) <= Number(filters.sqftMax));
  if (filters.bedrooms) filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.bedrooms) >= Number(filters.bedrooms));
  if (filters.bathrooms) filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.bathrooms) >= Number(filters.bathrooms));
  if (filters.hasKitchen === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.has_kitchen);
  if (filters.hasDrawingRoom === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.has_drawing_room);
  if (filters.hasDiningRoom === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.has_dining_room);
  if (filters.hasBalcony === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || Number(r.balconies) > 0);
  if (filters.hasRoofAccess === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.has_roof_access);
  if (filters.hasGarage === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.properties?.has_garage);
  if (filters.hasInternet === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.properties?.has_internet);
  if (filters.hasSecurity === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.properties?.has_security);
  if (filters.hasLift === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.properties?.has_lift);
  if (filters.hasCctv === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.properties?.has_cctv);
  if (filters.hasGenerator === "yes") filtered = filtered.filter((r: any) => r._type === "garage" || r.properties?.has_generator);
  if (filters.garageType) filtered = filtered.filter((r: any) => r._type === "room" || r.garage_type === filters.garageType);

  const boostedRoomIds = new Set((activeBoosts || []).map((b: any) => b.room_id));
  filtered = [...filtered].sort((a: any, b: any) => {
    const aBoost = boostedRoomIds.has(a.id) ? 1 : 0;
    const bBoost = boostedRoomIds.has(b.id) ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    return filters.sortOrder === "asc" ? Number(a.rent_amount) - Number(b.rent_amount) : Number(b.rent_amount) - Number(a.rent_amount);
  });

  // Separate boosted and regular listings
  const boostedListings = filtered.filter((item: any) => boostedRoomIds.has(item.id));
  const regularListings = filtered.filter((item: any) => !boostedRoomIds.has(item.id));

  const totalPages = Math.max(1, Math.ceil(regularListings.length / REGULAR_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pageBoosts = useMemo(() => {
    if (boostedListings.length === 0) return [];
    const shuffled = [...boostedListings].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, BOOST_SLOTS);
  }, [boostedListings.length, safeCurrentPage]);

  const pageRegular = regularListings.slice((safeCurrentPage - 1) * REGULAR_PER_PAGE, safeCurrentPage * REGULAR_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFiltersChange = (newFilters: ToLetFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const getMapLink = (props: any) => {
    if (props?.map_url) return props.map_url;
    const addr = [props?.name, props?.address, props?.thana, props?.district, props?.division].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  };

  const renderListingCard = (item: any, isBoosted: boolean) => {
    const isGarage = item._type === "garage";
    const room = item;
    const displayImage = isGarage ? "/images/default-garage.png" : "/images/default-room.png";
    const label = isGarage ? item.garage_number : room.room_number;
    const mapLink = getMapLink(item.properties);

    const availBadge = (
      <Badge className="absolute bottom-2 left-2 z-10 bg-green-600 text-white text-[10px] px-1.5 py-0.5 shadow">{language === "bn" ? "এখন খালি" : "Available Now"}</Badge>
    );

    const boostedBadge = isBoosted ? (
      <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
        <Flame className="h-2.5 w-2.5" />
        {language === "bn" ? "বুস্টেড" : "Boosted"}
      </div>
    ) : null;

    const cardContent = (
      <>
        <div className="relative h-40 w-full overflow-hidden">
          <img src={displayImage} alt={label} className="h-full w-full object-cover" />
          {availBadge}
          {boostedBadge}
        </div>
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{label}</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">
              {isGarage ? (language === "bn" ? "গ্যারেজ" : "Garage") : room.room_type}
            </Badge>
          </div>
          <p className="font-bold text-lg text-primary">
            ৳{Number(item.rent_amount).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/{t("bill.month") || "mo"}</span>
          </p>
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group"
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.properties?.name}</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 shrink-0" />
          </a>
          {!isGarage && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Floor: {room.floor}</span>
              {room.bedrooms > 0 && <span>• {room.bedrooms} Bed</span>}
              {room.bathrooms > 0 && <span>• {room.bathrooms} Bath</span>}
              {room.area_sqft > 0 && <span>• {room.area_sqft}ft²</span>}
              {room.has_roof_access && <span>• {language === "bn" ? "ছাদ" : "Roof"}</span>}
              {item.properties?.has_lift && <span>• {language === "bn" ? "লিফট" : "Lift"}</span>}
              {item.properties?.has_internet && <span>• {language === "bn" ? "নেট" : "Net"}</span>}
              {item.properties?.has_generator && <span>• {language === "bn" ? "জেনা" : "Gen"}</span>}
            </div>
          )}
          <div className="mt-auto pt-1">
            <Button size="sm" className="h-9 text-sm gap-1.5 w-full" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRequestDialog(item); }}>
              <Send className="h-3.5 w-3.5" />
              {language === "bn" ? "আবেদন" : "Request"}
            </Button>
          </div>
        </div>
      </>
    );

    return isBoosted ? (
      <GlowCard key={`${item._type}-${item.id}`} glowColor="purple" customSize className="w-full h-full aspect-auto">
        <Link to={`/tolet/${item.id}`} className="block h-full">
          <Card className="hover:shadow-md transition-shadow overflow-hidden border-0 shadow-none bg-transparent flex flex-col h-full">
            {cardContent}
          </Card>
        </Link>
      </GlowCard>
    ) : (
      <Link key={`${item._type}-${item.id}`} to={`/tolet/${item.id}`} className="block h-full">
        <Card className="hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
          {cardContent}
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold">{t("tolet.title") || "To-Let Listings"}</h1>
        <p className="text-muted-foreground text-sm">{t("tolet.subtitle") || "Find your next home"}</p>
      </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-[260px] md:shrink-0">
            <div className="bg-card border rounded-lg p-3 md:sticky md:top-4">
              <ToLetFilters filters={filters} onChange={handleFiltersChange} />
            </div>
          </div>

          <div className="flex-1 min-w-0">



          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}><CardContent className="p-6 h-40 animate-pulse bg-muted" /></Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("tolet.no_listings") || "No to-let listings found."}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Boosted section */}
              {pageBoosts.length > 0 && (
                <div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pageBoosts.map((item: any) => renderListingCard(item, true))}
                  </div>
                </div>
              )}

              {/* Regular listings */}
              {pageRegular.length > 0 && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pageRegular.map((item: any) => renderListingCard(item, false))}
                </div>
              )}

              {/* Pagination with result count */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? `পৃষ্ঠা ${safeCurrentPage}/${totalPages} (${filtered.length} টি ফলাফল)` : `Page ${safeCurrentPage} of ${totalPages} (${filtered.length} results)`}
                </p>
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      {safeCurrentPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(safeCurrentPage - 1); }} />
                        </PaginationItem>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("ellipsis");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "ellipsis" ? (
                            <PaginationItem key={`ellipsis-${idx}`}><PaginationEllipsis /></PaginationItem>
                          ) : (
                            <PaginationItem key={item}>
                              <PaginationLink href="#" isActive={item === safeCurrentPage} onClick={(e) => { e.preventDefault(); handlePageChange(item as number); }}>
                                {item}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                      {safeCurrentPage < totalPages && (
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(safeCurrentPage + 1); }} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

      {/* Request Dialog */}
      <Dialog open={!!requestDialog} onOpenChange={(v) => { if (!v) setRequestDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tolet.request_rent") || "Request to Rent"}</DialogTitle>
          </DialogHeader>
          {requestDialog && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="font-semibold">{requestDialog.room_number || requestDialog.garage_number} - {requestDialog.properties?.name}</p>
                <p className="text-sm text-muted-foreground">৳{Number(requestDialog.rent_amount).toLocaleString()}/{t("bill.month") || "month"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("tolet.message") || "Message (optional)"}</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("tolet.message_placeholder") || "Introduce yourself..."} rows={3} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRequestDialog(null)}>{t("common.cancel")}</Button>
                <Button
                  onClick={() => {
                    const landlordId = requestDialog.properties?.owner_id;
                    if (landlordId) requestMutation.mutate({ roomId: requestDialog.id, landlordId });
                  }}
                  disabled={requestMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t("tolet.send_request") || "Send Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantToLet;
