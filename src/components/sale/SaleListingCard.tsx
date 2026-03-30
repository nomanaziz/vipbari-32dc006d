import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, BedDouble, Bath, Maximize, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

interface SaleListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    property_type: string;
    location_address: string;
    district: string;
    bedrooms: number;
    bathrooms: number;
    area_sqft: number;
    floor: number;
    is_featured: boolean;
    is_premium: boolean;
    status: string;
    images?: { image_url: string }[];
  };
  isFavorited?: boolean;
  onToggleFavorite?: (id: string) => void;
  showActions?: boolean;
}

export function SaleListingCard({ listing, isFavorited, onToggleFavorite, showActions = true }: SaleListingCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const imageUrl = listing.images?.[0]?.image_url || "/images/default-room.png";

  const typeLabels: Record<string, string> = {
    flat: language === "bn" ? "ফ্ল্যাট" : "Flat",
    apartment: language === "bn" ? "অ্যাপার্টমেন্ট" : "Apartment",
    land: language === "bn" ? "জমি" : "Land",
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
      onClick={() => navigate(`/buy-sell/${listing.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={imageUrl} alt={listing.title} className={`w-full h-full object-cover ${listing.status === "sold" ? "opacity-60" : ""}`} />
        {listing.status === "sold" && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white font-bold text-2xl rotate-[-15deg] bg-destructive/90 px-4 py-1 rounded">{language === "bn" ? "বিক্রিত" : "Sold"}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {listing.status === "sold" ? (
            <Badge className="bg-destructive text-white text-[10px]">
              {language === "bn" ? "বিক্রিত" : "Sold"}
            </Badge>
          ) : (
            <Badge className="bg-emerald-600 text-white text-[10px]">
              {language === "bn" ? "বিক্রয়" : "For Sale"}
            </Badge>
          )}
          {listing.is_featured && (
            <Badge className="bg-amber-500 text-white text-[10px]">
              {language === "bn" ? "ফিচার্ড" : "Featured"}
            </Badge>
          )}
          {listing.is_premium && (
            <Badge className="bg-purple-600 text-white text-[10px]">
              {language === "bn" ? "প্রিমিয়াম" : "Premium"}
            </Badge>
          )}
        </div>
        {showActions && onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(listing.id); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        )}
      </div>
      <CardContent className="p-3 flex flex-col flex-1 gap-2">
        <p className="font-bold text-lg text-primary">
          ৳ {listing.price.toLocaleString()}
        </p>
        <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{listing.location_address || listing.district}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {typeLabels[listing.property_type] || listing.property_type}
          </span>
          {listing.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" /> {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="h-3 w-3" /> {listing.bathrooms}
            </span>
          )}
          {listing.area_sqft > 0 && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3 w-3" /> {listing.area_sqft} sqft
            </span>
          )}
        </div>
        <div className="mt-auto pt-1">
          <Button size="sm" className="w-full" variant="outline">
            {language === "bn" ? "বিস্তারিত দেখুন" : "View Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
