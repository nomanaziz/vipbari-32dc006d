import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { DIVISIONS, DIVISIONS_BN, DISTRICTS, DISTRICTS_BN, THANAS, THANAS_BN, getBnLabel } from "@/data/bangladeshAddress";
import { useIsMobile } from "@/hooks/use-mobile";

export interface ToLetFilterState {
  division: string;
  district: string;
  thana: string;
  areaSearch: string;
  sortOrder: "asc" | "desc";
  priceMin: string;
  priceMax: string;
  roomType: string;
  floorMin: string;
  floorMax: string;
  sqftMin: string;
  sqftMax: string;
  bedrooms: string;
  bathrooms: string;
  hasKitchen: string;
  hasDrawingRoom: string;
  hasDiningRoom: string;
  hasBalcony: string;
  hasRoofAccess: string;
  hasGarage: string;
  hasInternet: string;
  hasSecurity: string;
  hasLift: string;
  hasCctv: string;
  hasGenerator: string;
  listingType: string;
  garageType: string;
}

const defaultFilters: ToLetFilterState = {
  division: "", district: "", thana: "", areaSearch: "",
  sortOrder: "asc", priceMin: "", priceMax: "",
  roomType: "", floorMin: "", floorMax: "",
  sqftMin: "", sqftMax: "", bedrooms: "", bathrooms: "",
  hasKitchen: "", hasDrawingRoom: "", hasDiningRoom: "",
  hasBalcony: "", hasRoofAccess: "",
  hasGarage: "", hasInternet: "", hasSecurity: "",
  hasLift: "", hasCctv: "", hasGenerator: "",
  listingType: "", garageType: "",
};

interface Props {
  filters: ToLetFilterState;
  onChange: (f: ToLetFilterState) => void;
  availabilitySlot?: React.ReactNode;
}

const ToLetFilters = ({ filters, onChange, availabilitySlot }: Props) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);

  const set = (key: keyof ToLetFilterState, val: string) => {
    const next = { ...filters, [key]: val };
    if (key === "division") { next.district = ""; next.thana = ""; }
    if (key === "district") { next.thana = ""; }
    onChange(next);
  };

  const districts = filters.division ? DISTRICTS[filters.division] || [] : [];
  const thanas = filters.district ? THANAS[filters.district] || [] : [];

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === "sortOrder" || k === "areaSearch") return false;
    return v !== "";
  }).length;

  const clearAll = () => onChange({ ...defaultFilters });

  const sectionLabel = (text: string) => (
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1.5 first:mt-0">{text}</p>
  );

  const filterContent = (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder={t("tolet.search_area") || "Search area..."} value={filters.areaSearch} onChange={(e) => set("areaSearch", e.target.value)} className="pl-8 h-9 text-xs" />
      </div>

      {/* Availability */}
      {availabilitySlot}

      {/* Location */}
      {sectionLabel(language === "bn" ? "লোকেশন" : "Location")}
      <Select value={filters.division || "all"} onValueChange={(v) => set("division", v === "all" ? "" : v)}>
        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("tolet.filter_division") || "Division"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
          {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{getBnLabel(DIVISIONS_BN, d, language)}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.district || "all"} onValueChange={(v) => set("district", v === "all" ? "" : v)} disabled={!filters.division}>
        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("tolet.filter_district") || "District"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
          {districts.map((d) => <SelectItem key={d} value={d}>{getBnLabel(DISTRICTS_BN, d, language)}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.thana || "all"} onValueChange={(v) => set("thana", v === "all" ? "" : v)} disabled={!filters.district}>
        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("tolet.filter_thana") || "Thana"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
          {thanas.map((th) => <SelectItem key={th} value={th}>{getBnLabel(THANAS_BN, th, language)}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Listing Type */}
      {sectionLabel(language === "bn" ? "লিস্টিং ধরন" : "Listing Type")}
      <div className="flex gap-1.5">
        {([
          ["", language === "bn" ? "সব" : "All"],
          ["room", language === "bn" ? "রুম" : "Room"],
          ["garage", language === "bn" ? "গ্যারেজ" : "Garage"],
        ] as [string, string][]).map(([val, label]) => (
          <Button key={val} size="sm" variant={filters.listingType === val ? "default" : "outline"} onClick={() => set("listingType", val)} className="text-[10px] h-7 px-2 flex-1">{label}</Button>
        ))}
      </div>

      {/* Garage Sub-type */}
      {filters.listingType === "garage" && (
        <>
          {sectionLabel(language === "bn" ? "গ্যারেজ ধরন" : "Garage Type")}
          <div className="flex gap-1.5">
            {([
              ["", language === "bn" ? "সব" : "All"],
              ["car", language === "bn" ? "গাড়ি" : "Car"],
              ["bike", language === "bn" ? "বাইক" : "Bike"],
              ["other", language === "bn" ? "অন্যান্য" : "Other"],
            ] as [string, string][]).map(([val, label]) => (
              <Button key={val} size="sm" variant={filters.garageType === val ? "default" : "outline"} onClick={() => set("garageType", val)} className="text-[10px] h-7 px-2 flex-1">{label}</Button>
            ))}
          </div>
        </>
      )}

      {/* Type & Sort */}
      {sectionLabel(language === "bn" ? "ধরন ও সর্ট" : "Type & Sort")}
      {filters.listingType !== "garage" && (
        <Select value={filters.roomType || "all"} onValueChange={(v) => set("roomType", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={language === "bn" ? "ধরন" : "Room Type"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
            <SelectItem value="flat">{language === "bn" ? "ফ্ল্যাট" : "Flat"}</SelectItem>
            <SelectItem value="room">{language === "bn" ? "রুম" : "Room"}</SelectItem>
            <SelectItem value="shop">{language === "bn" ? "দোকান" : "Shop"}</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Button variant="outline" size="sm" onClick={() => set("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")} className="w-full gap-1.5 h-9 text-xs">
        <ArrowUpDown className="h-3.5 w-3.5" />
        {filters.sortOrder === "asc" ? (language === "bn" ? "মূল্য: কম→বেশি" : "Price: Low→High") : (language === "bn" ? "মূল্য: বেশি→কম" : "Price: High→Low")}
      </Button>

      {/* Price Range */}
      {sectionLabel(language === "bn" ? "মূল্য পরিসীমা" : "Price Range")}
      <div className="flex gap-2">
        <Input type="number" placeholder={language === "bn" ? "নিম্ন" : "Min"} value={filters.priceMin} onChange={(e) => set("priceMin", e.target.value)} className="h-8 text-xs" />
        <Input type="number" placeholder={language === "bn" ? "উচ্চ" : "Max"} value={filters.priceMax} onChange={(e) => set("priceMax", e.target.value)} className="h-8 text-xs" />
      </div>

      {/* Details */}
      {sectionLabel(language === "bn" ? "বিস্তারিত" : "Details")}
      <div className="flex gap-2">
        <Input type="number" placeholder={language === "bn" ? "ফ্লোর মিন" : "Floor Min"} value={filters.floorMin} onChange={(e) => set("floorMin", e.target.value)} className="h-8 text-xs" />
        <Input type="number" placeholder={language === "bn" ? "ফ্লোর ম্যাক্স" : "Floor Max"} value={filters.floorMax} onChange={(e) => set("floorMax", e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="flex gap-2">
        <Input type="number" placeholder={language === "bn" ? "স্কয়ারফিট মিন" : "Sqft Min"} value={filters.sqftMin} onChange={(e) => set("sqftMin", e.target.value)} className="h-8 text-xs" />
        <Input type="number" placeholder={language === "bn" ? "স্কয়ারফিট ম্যাক্স" : "Sqft Max"} value={filters.sqftMax} onChange={(e) => set("sqftMax", e.target.value)} className="h-8 text-xs" />
      </div>
      {sectionLabel(language === "bn" ? "বেডরুম ও বাথরুম" : "Bed & Bath")}
      <div className="flex gap-2">
        <Select value={filters.bedrooms || "all"} onValueChange={(v) => set("bedrooms", v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={language === "bn" ? "বেডরুম" : "Bed"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
            {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.bathrooms || "all"} onValueChange={(v) => set("bathrooms", v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={language === "bn" ? "বাথরুম" : "Bath"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
            {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Room Amenities */}
      {sectionLabel(language === "bn" ? "রুম সুবিধা" : "Room Amenities")}
      <div className="flex flex-wrap gap-1.5">
        {([
          ["hasKitchen", language === "bn" ? "রান্নাঘর" : "Kitchen"],
          ["hasDrawingRoom", language === "bn" ? "ড্রয়িং" : "Drawing"],
          ["hasDiningRoom", language === "bn" ? "ডাইনিং" : "Dining"],
          ["hasBalcony", language === "bn" ? "বারান্দা" : "Balcony"],
          ["hasRoofAccess", language === "bn" ? "ছাদ" : "Roof"],
        ] as [keyof ToLetFilterState, string][]).map(([key, label]) => (
          <Button key={key} size="sm" variant={filters[key] === "yes" ? "default" : "outline"} onClick={() => set(key, filters[key] === "yes" ? "" : "yes")} className="text-[10px] h-7 px-2">{label}</Button>
        ))}
      </div>

      {/* Property Facilities */}
      {sectionLabel(language === "bn" ? "বিল্ডিং সুবিধা" : "Facilities")}
      <div className="flex flex-wrap gap-1.5">
        {([
          ["hasGarage", language === "bn" ? "গ্যারেজ" : "Garage"],
          ["hasInternet", language === "bn" ? "ইন্টারনেট" : "Internet"],
          ["hasSecurity", language === "bn" ? "সিকিউরিটি" : "Security"],
          ["hasLift", language === "bn" ? "লিফট" : "Lift"],
          ["hasCctv", language === "bn" ? "সিসিটিভি" : "CCTV"],
          ["hasGenerator", language === "bn" ? "জেনারেটর" : "Generator"],
        ] as [keyof ToLetFilterState, string][]).map(([key, label]) => (
          <Button key={key} size="sm" variant={filters[key] === "yes" ? "default" : "outline"} onClick={() => set(key, filters[key] === "yes" ? "" : "yes")} className="text-[10px] h-7 px-2">{label}</Button>
        ))}
      </div>

      {/* Reset */}
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full gap-1.5 h-8 text-xs text-destructive mt-2">
          <X className="h-3.5 w-3.5" />
          {language === "bn" ? "রিসেট করুন" : "Reset Filters"}
          <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">{activeCount}</Badge>
        </Button>
      )}
    </div>
  );

  // Mobile: collapsible
  if (isMobile) {
    return (
      <div className="bg-card border rounded-lg">
        <Button
          variant="ghost"
          className="w-full justify-between h-10 text-sm px-3"
          onClick={() => setShowMore(!showMore)}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {language === "bn" ? "ফিল্টার" : "Filters"}
            {activeCount > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{activeCount}</Badge>}
          </span>
          {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {showMore && <div className="px-3 pb-3">{filterContent}</div>}
      </div>
    );
  }

  // Desktop: vertical sidebar
  return filterContent;
};

export { defaultFilters };
export default ToLetFilters;
