import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SaleFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  propertyType: string;
  setPropertyType: (v: string) => void;
  priceRange: string;
  setPriceRange: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
}

export function SaleFilters({ search, setSearch, propertyType, setPropertyType, priceRange, setPriceRange, bedrooms, setBedrooms }: SaleFiltersProps) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === "bn" ? "খুঁজুন..." : "Search by title or location..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={propertyType} onValueChange={setPropertyType}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder={language === "bn" ? "ধরন" : "Type"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{language === "bn" ? "সব ধরন" : "All Types"}</SelectItem>
          <SelectItem value="flat">{language === "bn" ? "ফ্ল্যাট" : "Flat"}</SelectItem>
          <SelectItem value="apartment">{language === "bn" ? "অ্যাপার্টমেন্ট" : "Apartment"}</SelectItem>
          <SelectItem value="building">{language === "bn" ? "পাকা বিল্ডিং" : "Building"}</SelectItem>
          <SelectItem value="house">{language === "bn" ? "বাড়ি" : "House"}</SelectItem>
          <SelectItem value="duplex">{language === "bn" ? "ডুপ্লেক্স" : "Duplex"}</SelectItem>
          <SelectItem value="shop">{language === "bn" ? "দোকান" : "Shop"}</SelectItem>
          <SelectItem value="office">{language === "bn" ? "অফিস" : "Office"}</SelectItem>
          <SelectItem value="warehouse">{language === "bn" ? "গোডাউন" : "Warehouse"}</SelectItem>
          <SelectItem value="plot">{language === "bn" ? "প্লট/জমি" : "Plot/Land"}</SelectItem>
          <SelectItem value="land">{language === "bn" ? "জমি" : "Land"}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priceRange} onValueChange={setPriceRange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={language === "bn" ? "মূল্য" : "Price"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{language === "bn" ? "সব মূল্য" : "All Prices"}</SelectItem>
          <SelectItem value="0-500000">{language === "bn" ? "৫ লক্ষ এর নিচে" : "Under 5 Lakh"}</SelectItem>
          <SelectItem value="500000-2000000">{language === "bn" ? "৫-২০ লক্ষ" : "5-20 Lakh"}</SelectItem>
          <SelectItem value="2000000-5000000">{language === "bn" ? "২০-৫০ লক্ষ" : "20-50 Lakh"}</SelectItem>
          <SelectItem value="5000000-10000000">{language === "bn" ? "৫০ লক্ষ - ১ কোটি" : "50 Lakh - 1 Crore"}</SelectItem>
          <SelectItem value="10000000-999999999">{language === "bn" ? "১ কোটি+" : "1 Crore+"}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={bedrooms} onValueChange={setBedrooms}>
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue placeholder={language === "bn" ? "বেডরুম" : "Bedrooms"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{language === "bn" ? "সব" : "Any"}</SelectItem>
          <SelectItem value="1">1</SelectItem>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="3">3</SelectItem>
          <SelectItem value="4">4+</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
