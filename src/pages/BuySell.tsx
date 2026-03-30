import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PublicNavbar } from "@/components/PublicNavbar";
import { LandingFooter } from "@/components/LandingFooter";
import { SaleListingCard } from "@/components/sale/SaleListingCard";
import { SaleFilters } from "@/components/sale/SaleFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function BuySell() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["sale-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_listings")
        .select("*, sale_listing_images(image_url, sort_order)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((l: any) => ({
        ...l,
        images: (l.sale_listing_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
  });

  const { data: favorites, refetch: refetchFavs } = useQuery({
    queryKey: ["sale-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sale_favorites").select("listing_id").eq("user_id", user!.id);
      return new Set((data || []).map((f: any) => f.listing_id));
    },
  });

  const toggleFavorite = async (listingId: string) => {
    if (!user) { toast.error(language === "bn" ? "লগইন করুন" : "Please login first"); return; }
    const isFav = favorites?.has(listingId);
    if (isFav) {
      await supabase.from("sale_favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
    } else {
      await supabase.from("sale_favorites").insert({ user_id: user.id, listing_id: listingId });
    }
    refetchFavs();
  };

  const filtered = useMemo(() => {
    if (!listings) return [];
    return listings.filter((l: any) => {
      if (search) {
        const s = search.toLowerCase();
        if (!l.title.toLowerCase().includes(s) && !l.location_address.toLowerCase().includes(s) && !l.district.toLowerCase().includes(s)) return false;
      }
      if (propertyType !== "all" && l.property_type !== propertyType) return false;
      if (priceRange !== "all") {
        const [min, max] = priceRange.split("-").map(Number);
        if (l.price < min || l.price > max) return false;
      }
      if (bedrooms !== "all") {
        const b = parseInt(bedrooms);
        if (b === 4 ? l.bedrooms < 4 : l.bedrooms !== b) return false;
      }
      return true;
    });
  }, [listings, search, propertyType, priceRange, bedrooms]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{language === "bn" ? "প্রপার্টি কেনা - বেচা" : "Buy & Sell Properties"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === "bn" ? "আপনার পছন্দের ফ্ল্যাট, অ্যাপার্টমেন্ট বা জমি খুঁজুন" : "Find your perfect flat, apartment or land"}
          </p>
        </div>

        <SaleFilters
          search={search} setSearch={setSearch}
          propertyType={propertyType} setPropertyType={setPropertyType}
          priceRange={priceRange} setPriceRange={setPriceRange}
          bedrooms={bedrooms} setBedrooms={setBedrooms}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {language === "bn" ? "কোনো লিস্টিং পাওয়া যায়নি" : "No listings found"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((listing: any) => (
              <SaleListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favorites?.has(listing.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
