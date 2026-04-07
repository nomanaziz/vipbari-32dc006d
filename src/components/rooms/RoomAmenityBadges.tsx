import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

interface RoomAmenityBadgesProps {
  room: any;
  property?: any;
  compact?: boolean;
}

const RoomAmenityBadges = ({ room, property, compact = false }: RoomAmenityBadgesProps) => {
  const { t, language } = useLanguage();

  const isTinShed = property?.property_type === "tin_shed";

  const items: string[] = [];
  if (!isTinShed) {
    if (room.bedrooms > 0) items.push(`${room.bedrooms} ${t("room.bedrooms")}`);
    if (room.bathrooms > 0) items.push(`${room.bathrooms} ${t("room.bathrooms")}`);
    if (room.has_kitchen) items.push(t("room.kitchen"));
    if (room.has_drawing_room) items.push(t("room.drawing_room"));
    if (room.has_dining_room) items.push(t("room.dining_room"));
    if (room.balconies > 0) items.push(`${room.balconies} ${t("room.balcony")}`);
    if (room.has_roof_access) items.push(t("room.roof_access"));
  }

  // Property-level facilities
  const facilities: string[] = [];
  if (property) {
    if (property.has_garage) facilities.push(language === "bn" ? "গ্যারেজ" : "Garage");
    if (property.has_internet) facilities.push(language === "bn" ? "ইন্টারনেট" : "Internet");
    if (property.has_dish) facilities.push(language === "bn" ? "ডিশ" : "Dish");
    if (property.has_security) facilities.push(language === "bn" ? "সিকিউরিটি" : "Security");
    if (property.has_cctv) facilities.push("CCTV");
    if (property.has_lift) facilities.push(language === "bn" ? "লিফট" : "Lift");
    if (property.has_generator) facilities.push(language === "bn" ? "জেনারেটর" : "Generator");
    if (property.has_parking) facilities.push(language === "bn" ? "পার্কিং" : "Parking");
    if (property.has_gas_supply) facilities.push(language === "bn" ? "গ্যাস" : "Gas");
    if (property.has_water_supply) facilities.push(language === "bn" ? "পানি" : "Water");
    if (property.has_rooftop_access) facilities.push(language === "bn" ? "ছাদ" : "Roof");
  }

  if (items.length === 0 && facilities.length === 0) return null;

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {[...items, ...facilities].join(" · ")}
        {!isTinShed && room.area_sqft > 0 && ` · ${room.area_sqft} sqft`}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="text-xs">
          {item}
        </Badge>
      ))}
      {!isTinShed && room.area_sqft > 0 && (
        <Badge variant="outline" className="text-xs">{room.area_sqft} sqft</Badge>
      )}
      {facilities.map((fac) => (
        <Badge key={fac} variant="secondary" className="text-xs">
          {fac}
        </Badge>
      ))}
    </div>
  );
};

export default RoomAmenityBadges;
