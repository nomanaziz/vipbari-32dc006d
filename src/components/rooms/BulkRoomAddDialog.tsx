import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Layers, Plus, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UnitTemplate {
  id: string;
  label: string;
  room_type: string;
  rent_amount: string;
  bedrooms: string;
  bathrooms: string;
  has_drawing_room: boolean;
  has_dining_room: boolean;
  has_kitchen: boolean;
  balconies: string;
  has_roof_access: boolean;
  area_sqft: string;
  description: string;
}

const defaultUnit = (label = "A"): UnitTemplate => ({
  id: crypto.randomUUID(),
  label,
  room_type: "flat",
  rent_amount: "0",
  bedrooms: "2",
  bathrooms: "1",
  has_drawing_room: false,
  has_dining_room: false,
  has_kitchen: true,
  balconies: "1",
  has_roof_access: false,
  area_sqft: "0",
  description: "",
});

const GROUP_COLORS: Record<string, string> = {
  A: "bg-blue-500",
  B: "bg-green-500",
  C: "bg-orange-500",
  D: "bg-purple-500",
  E: "bg-pink-500",
  F: "bg-cyan-500",
};

interface Props {
  properties: { id: string; name: string; property_type?: string }[];
  onSuccess: () => void;
}

const UnitCard = ({
  unit,
  idx,
  canRemove,
  onUpdate,
  onRemove,
  t,
  roomTypeLabels,
  group,
  onGroupChange,
  showGroup,
  availableGroups,
}: {
  unit: UnitTemplate;
  idx: number;
  canRemove: boolean;
  onUpdate: (patch: Partial<UnitTemplate>) => void;
  onRemove: () => void;
  t: (key: string) => string;
  roomTypeLabels: Record<string, string>;
  group?: string;
  onGroupChange?: (g: string) => void;
  showGroup?: boolean;
  availableGroups?: string[];
}) => (
  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-sm">
          {t("bulk.unit") || "Unit"} {idx + 1}
        </h4>
        {showGroup && group && (
          <span className={`inline-block w-3 h-3 rounded-full ${GROUP_COLORS[group] || "bg-muted-foreground"}`} title={`${t("bulk.group") || "Group"} ${group}`} />
        )}
      </div>
      <div className="flex items-center gap-2">
        {showGroup && onGroupChange && availableGroups && (
          <Select value={group || "A"} onValueChange={onGroupChange}>
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableGroups.map(g => (
                <SelectItem key={g} value={g}>
                  <span className="flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${GROUP_COLORS[g] || "bg-muted-foreground"}`} />
                    {t("bulk.group") || "Group"} {g}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {canRemove && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">{t("bulk.unit_label") || "Unit Label"}</Label>
        <Input value={unit.label} onChange={e => onUpdate({ label: e.target.value })} placeholder="A" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.type") || "Type"}</Label>
        <Select value={unit.room_type} onValueChange={v => onUpdate({ room_type: v })}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="room">{roomTypeLabels.room}</SelectItem>
            <SelectItem value="flat">{roomTypeLabels.flat}</SelectItem>
            <SelectItem value="shop">{roomTypeLabels.shop}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.rent") || "Rent"} (৳)</Label>
        <Input type="number" value={unit.rent_amount} onChange={e => onUpdate({ rent_amount: e.target.value })} className="h-8 text-sm" />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">{t("room.bedrooms") || "Bedrooms"}</Label>
        <Input type="number" min="0" value={unit.bedrooms} onChange={e => onUpdate({ bedrooms: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.bathrooms") || "Bathrooms"}</Label>
        <Input type="number" min="0" value={unit.bathrooms} onChange={e => onUpdate({ bathrooms: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.balcony") || "Balcony"}</Label>
        <Input type="number" min="0" value={unit.balconies} onChange={e => onUpdate({ balconies: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.area_sqft") || "Area (sqft)"}</Label>
        <Input type="number" min="0" value={unit.area_sqft} onChange={e => onUpdate({ area_sqft: e.target.value })} className="h-8 text-sm" />
      </div>
    </div>
    <div className="flex flex-wrap gap-3">
      {([
        ["has_drawing_room", t("room.drawing_room") || "Drawing"],
        ["has_dining_room", t("room.dining_room") || "Dining"],
        ["has_kitchen", t("room.kitchen") || "Kitchen"],
        ["has_roof_access", t("room.roof_access") || "Roof"],
      ] as const).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5">
          <Checkbox checked={(unit as any)[key]} onCheckedChange={(checked) => onUpdate({ [key]: !!checked })} />
          <span className="text-xs">{label}</span>
        </div>
      ))}
    </div>
    <div className="space-y-1">
      <Label className="text-xs">{t("room.description") || "Description"}</Label>
      <Textarea value={unit.description} onChange={e => onUpdate({ description: e.target.value })} rows={1} className="text-sm" />
    </div>
  </div>
);

const BulkRoomAddDialog = ({ properties, onSuccess }: Props) => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState(properties?.[0]?.id || "");
  const [floorFrom, setFloorFrom] = useState("1");
  const [floorTo, setFloorTo] = useState("5");
  const [unitMode, setUnitMode] = useState<"same" | "different">("same");
  const [units, setUnits] = useState<UnitTemplate[]>([defaultUnit()]);
  const [isPending, setIsPending] = useState(false);

  // Simple mode state (for tin_shed/house/shop)
  const [simpleRoomCount, setSimpleRoomCount] = useState("10");
  const [simpleRent, setSimpleRent] = useState("0");

  // Derive property type
  const effectivePropertyType = properties.find(p => p.id === propertyId)?.property_type;
  const isSimpleMode = effectivePropertyType === "tin_shed" || effectivePropertyType === "house" || effectivePropertyType === "shop";

  // New state for enhanced features
  const [unitsPerFloor, setUnitsPerFloor] = useState("1");
  const [symmetryEnabled, setSymmetryEnabled] = useState(false);
  const [unitGroups, setUnitGroups] = useState<Record<string, string>>({});

  const roomTypeLabels: Record<string, string> = {
    room: t("room.type_room") || "Room",
    flat: t("room.type_flat") || "Flat",
    shop: t("room.type_shop") || "Shop",
  };

  const fromFloor = parseInt(floorFrom) || 0;
  const toFloor = parseInt(floorTo) || 0;
  const floorCount = Math.max(0, toFloor - fromFloor + 1);
  const floors = useMemo(() => Array.from({ length: floorCount }, (_, i) => fromFloor + i), [fromFloor, floorCount]);

  // Available groups based on unit count
  const availableGroups = useMemo(() => {
    const maxGroups = Math.min(units.length, 6);
    return Array.from({ length: maxGroups }, (_, i) => String.fromCharCode(65 + i));
  }, [units.length]);

  // Handle units-per-floor change: auto-generate unit cards
  const handleUnitsPerFloorChange = useCallback((val: string) => {
    setUnitsPerFloor(val);
    const count = Math.max(0, Math.min(20, parseInt(val) || 0));
    if (count === 0) return;

    setUnits(prev => {
      if (count === prev.length) return prev;
      if (count > prev.length) {
        const newUnits = [...prev];
        for (let i = prev.length; i < count; i++) {
          newUnits.push({ ...defaultUnit(String.fromCharCode(65 + i)), id: crypto.randomUUID() });
        }
        return newUnits;
      }
      return prev.slice(0, count);
    });
  }, []);

  const handleModeChange = (mode: "same" | "different") => {
    setUnitMode(mode);
  };

  const handleFloorChange = (from: string, to: string) => {
    setFloorFrom(from);
    setFloorTo(to);
  };

  // Different mode units (independent unit types)
  const [diffUnits, setDiffUnits] = useState<UnitTemplate[]>([defaultUnit()]);
  const [diffUnitsPerFloor, setDiffUnitsPerFloor] = useState("1");

  const handleDiffUnitsPerFloorChange = useCallback((val: string) => {
    setDiffUnitsPerFloor(val);
    const count = Math.max(0, Math.min(20, parseInt(val) || 0));
    if (count === 0) return;
    setDiffUnits(prev => {
      if (count === prev.length) return prev;
      if (count > prev.length) {
        const newUnits = [...prev];
        for (let i = prev.length; i < count; i++) {
          newUnits.push({ ...defaultUnit(String.fromCharCode(65 + i)), id: crypto.randomUUID() });
        }
        return newUnits;
      }
      return prev.slice(0, count);
    });
  }, []);

  const lastUnitRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (shouldScroll && lastUnitRef.current) {
      lastUnitRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      setShouldScroll(false);
    }
  }, [shouldScroll, diffUnits.length]);

  const addDiffUnit = () => {
    const nextLabel = String.fromCharCode(65 + diffUnits.length);
    setDiffUnits(prev => [...prev, { ...defaultUnit(nextLabel), id: crypto.randomUUID() }]);
    setDiffUnitsPerFloor(String(diffUnits.length + 1));
    setShouldScroll(true);
  };
  const removeDiffUnit = (id: string) => {
    if (diffUnits.length <= 1) return;
    setDiffUnits(prev => prev.filter(u => u.id !== id));
    setDiffUnitsPerFloor(String(diffUnits.length - 1));
  };
  const updateDiffUnit = useCallback((id: string, patch: Partial<UnitTemplate>) => {
    setDiffUnits(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  }, []);

  const simpleCount = Math.max(0, Math.min(50, parseInt(simpleRoomCount) || 0));

  const totalRooms = useMemo(() => {
    if (isSimpleMode) return simpleCount;
    if (unitMode === "same") return floorCount * units.length;
    return floorCount * diffUnits.length;
  }, [isSimpleMode, simpleCount, unitMode, floorCount, units.length, diffUnits.length]);

  const simpleRoomType = effectivePropertyType === "shop" ? "shop" : "room";
  const simpleLabel = effectivePropertyType === "shop" 
    ? (language === "bn" ? "দোকান" : "Shop") 
    : (language === "bn" ? "রুম" : "Room");

  const generateRoomNumber = (floor: number, unitLabel: string) => `${floor}${unitLabel}`;

  // --- Same mode helpers ---
  const addUnit = () => {
    const nextLabel = String.fromCharCode(65 + units.length);
    const newUnit = { ...defaultUnit(nextLabel), id: crypto.randomUUID() };
    setUnits(prev => [...prev, newUnit]);
    setUnitsPerFloor(String(units.length + 1));
  };
  const removeUnit = (id: string) => {
    if (units.length <= 1) return;
    setUnits(prev => prev.filter(u => u.id !== id));
    setUnitsPerFloor(String(units.length - 1));
    // Clean up group assignment
    setUnitGroups(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };
  const updateUnit = useCallback((id: string, patch: Partial<UnitTemplate>) => {
    setUnits(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...patch } : u);
      return updated;
    });

    // Symmetry: propagate to same-group units (except label)
    if (symmetryEnabled) {
      const group = unitGroups[id];
      if (group) {
        const patchWithoutLabel = { ...patch };
        delete patchWithoutLabel.label;
        if (Object.keys(patchWithoutLabel).length > 0) {
          setUnits(prev =>
            prev.map(u => {
              if (u.id !== id && unitGroups[u.id] === group) {
                return { ...u, ...patchWithoutLabel };
              }
              return u;
            })
          );
        }
      }
    }
  }, [symmetryEnabled, unitGroups]);

  const handleSubmit = async () => {
    if (!propertyId) { toast.error(t("room.select_property") || "Select a property"); return; }
    if (!isSimpleMode && fromFloor > toFloor) { toast.error(t("bulk.invalid_floor_range") || "Invalid floor range"); return; }
    if (totalRooms > 100) { toast.error(t("bulk.too_many") || "Maximum 100 rooms at once"); return; }
    if (totalRooms === 0) return;

    setIsPending(true);
    try {
      const { data: propData } = await supabase.from("properties").select("owner_id").eq("id", propertyId).single();
      const ownerId = propData?.owner_id;

      let activeCount = 0;
      let slotCount = 0;
      if (ownerId) {
        const { data: currentRooms } = await supabase
          .from("rooms")
          .select("id, status, properties!inner(owner_id)")
          .eq("properties.owner_id", ownerId)
          .neq("status", "inactive");
        activeCount = currentRooms?.length || 0;

        const { data: subs } = await supabase
          .from("user_subscriptions")
          .select("room_count")
          .eq("user_id", ownerId)
          .eq("product_type", "room_management")
          .eq("status", "active")
          .gte("expires_at", new Date().toISOString());
        const paidSlots = (subs || []).reduce((sum, s) => sum + s.room_count, 0);
        slotCount = paidSlots;
      }

      const rows: any[] = [];

      if (isSimpleMode) {
        // Simple mode: sequential rooms, no amenities
        for (let i = 1; i <= simpleCount; i++) {
          rows.push({
            property_id: propertyId,
            room_number: String(i),
            room_type: simpleRoomType,
            floor: 0,
            rent_amount: Number(simpleRent),
            bedrooms: 0,
            bathrooms: 0,
            has_drawing_room: false,
            has_dining_room: false,
            has_kitchen: false,
            balconies: 0,
            has_roof_access: false,
            area_sqft: 0,
            description: "",
          });
        }
      } else {
        // Building mode: floor-based
        const buildRow = (unit: any, floor: number) => ({
          property_id: propertyId,
          room_number: generateRoomNumber(floor, unit.label),
          room_type: unit.room_type,
          floor,
          rent_amount: Number(unit.rent_amount),
          bedrooms: Number(unit.bedrooms),
          bathrooms: Number(unit.bathrooms),
          has_drawing_room: unit.has_drawing_room,
          has_dining_room: unit.has_dining_room,
          has_kitchen: unit.has_kitchen,
          balconies: Number(unit.balconies),
          has_roof_access: unit.has_roof_access,
          area_sqft: Number(unit.area_sqft),
          description: unit.description,
        });

        const templateUnits = unitMode === "same" ? units : diffUnits;
        for (let floor = fromFloor; floor <= toFloor; floor++) {
          for (const unit of templateUnits) {
            rows.push(buildRow(unit, floor));
          }
        }
      }

      const slotsAvailable = Math.max(0, slotCount - activeCount);
      const rowsWithStatus = rows.map((row, idx) => ({
        ...row,
        status: idx < slotsAvailable ? "vacant" : "inactive",
      }));

      const { error } = await supabase.from("rooms").insert(rowsWithStatus);
      if (error) throw error;

      const inactiveCount = rowsWithStatus.filter(r => r.status === "inactive").length;
      if (inactiveCount > 0) {
        toast.warning(`${rows.length} ${t("bulk.rooms_added") || "rooms added"}. ${inactiveCount} ${t("room.inactive") || "inactive"}.`);
      } else {
        toast.success(`${rows.length} ${t("bulk.rooms_added") || "rooms added successfully!"}`);
      }
      onSuccess();
      setOpen(false);
      setUnits([defaultUnit()]);
      setDiffUnits([defaultUnit()]);
      setDiffUnitsPerFloor("1");
      setFloorFrom("1");
      setFloorTo("5");
      setUnitMode("same");
      setUnitsPerFloor("1");
      setSymmetryEnabled(false);
      setUnitGroups({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const previewItems = useMemo(() => {
    if (isSimpleMode) {
      return Array.from({ length: simpleCount }, (_, i) => ({ floor: 0, label: String(i + 1) }));
    }
    const items: { floor: number; label: string }[] = [];
    const templateUnits = unitMode === "same" ? units : diffUnits;
    for (const floor of floors) {
      for (const unit of templateUnits) {
        items.push({ floor, label: generateRoomNumber(floor, unit.label) });
      }
    }
    return items;
  }, [isSimpleMode, simpleCount, unitMode, floors, units, diffUnits]);

  // Group summary for display
  const groupSummary = useMemo(() => {
    if (!symmetryEnabled) return null;
    const groups: Record<string, number[]> = {};
    units.forEach((u, idx) => {
      const g = unitGroups[u.id] || "A";
      if (!groups[g]) groups[g] = [];
      groups[g].push(idx + 1);
    });
    return groups;
  }, [symmetryEnabled, units, unitGroups]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Layers className="h-4 w-4" />
          {t("bulk.add_rooms") || "Bulk Add"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("bulk.add_rooms_title") || "Bulk Add Rooms"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Property selection */}
            <div className="space-y-2">
              <Label>{t("room.property") || "Property"}</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger><SelectValue placeholder={t("bulk.select_property") || "Select property"} /></SelectTrigger>
                <SelectContent>
                  {properties?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Simple mode for tin_shed / house / shop */}
            {isSimpleMode && (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {effectivePropertyType === "shop" 
                      ? (language === "bn" ? "📦 একসাথে একাধিক দোকান যোগ করুন" : "📦 Add multiple shops at once")
                      : (language === "bn" ? "🏠 একসাথে একাধিক রুম যোগ করুন" : "🏠 Add multiple rooms at once")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "bn" ? `${simpleLabel} সংখ্যা` : `Number of ${simpleLabel}s`}</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={simpleRoomCount} 
                      onChange={e => setSimpleRoomCount(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? `প্রতি ${simpleLabel} ভাড়া (৳)` : `Rent per ${simpleLabel} (৳)`}</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      value={simpleRent} 
                      onChange={e => setSimpleRent(e.target.value)} 
                    />
                  </div>
                </div>
                {effectivePropertyType === "tin_shed" && (
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      ⚡ {language === "bn" ? "সব ইউটিলিটি ভাড়ায় অন্তর্ভুক্ত · বাথরুম, রান্নাঘর কমন/শেয়ার্ড" : "All utilities included · Bathroom, kitchen common/shared"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Building mode: Floor range */}
            {!isSimpleMode && (
              <>
            {/* Floor range */}
            <div className="space-y-2">
              <Label>{t("bulk.floor_range") || "Floor Range"}</Label>
              <div className="flex items-center gap-3">
                <Input type="number" value={floorFrom} onChange={e => handleFloorChange(e.target.value, floorTo.toString())} placeholder={t("bulk.from") || "From"} className="w-24" />
                <span className="text-muted-foreground">{t("bulk.to") || "to"}</span>
                <Input type="number" value={floorTo} onChange={e => handleFloorChange(floorFrom.toString(), e.target.value)} placeholder={t("bulk.to") || "to"} className="w-24" />
                <span className="text-sm text-muted-foreground">({floorCount} {t("bulk.floors") || "floors"})</span>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="space-y-2">
              <Label className="text-base">{t("bulk.unit_templates") || "Unit Templates"}</Label>
              <RadioGroup value={unitMode} onValueChange={(v) => handleModeChange(v as "same" | "different")} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="same" id="mode-same" />
                  <Label htmlFor="mode-same" className="text-sm font-normal cursor-pointer">{t("bulk.same_units") || "Same units on all floors"}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="different" id="mode-different" />
                  <Label htmlFor="mode-different" className="text-sm font-normal cursor-pointer">{t("bulk.different_units") || "আলাদা আলাদা ইউনিট / Different unit types"}</Label>
                </div>
              </RadioGroup>
            </div>

            {unitMode === "same" && (
              <div className="space-y-3">
                {/* Units per floor input */}
                <div className="space-y-2">
                  <Label>{t("bulk.units_per_floor") || "Units per floor"}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={unitsPerFloor}
                      onChange={e => handleUnitsPerFloorChange(e.target.value)}
                      className="w-24"
                    />
                    <p className="text-xs text-muted-foreground">{t("bulk.unit_desc") || "Each unit template will be created on every floor."}</p>
                  </div>
                </div>

                {/* Scrollable unit cards */}
                <ScrollArea className="max-h-[45vh]">
                  <div className="space-y-3 pr-2">
                    {units.map((unit, idx) => (
                      <UnitCard
                        key={unit.id}
                        unit={unit}
                        idx={idx}
                        canRemove={units.length > 1}
                        onUpdate={(patch) => updateUnit(unit.id, patch)}
                        onRemove={() => removeUnit(unit.id)}
                        t={t}
                        roomTypeLabels={roomTypeLabels}
                        group={symmetryEnabled ? (unitGroups[unit.id] || "A") : undefined}
                        onGroupChange={symmetryEnabled ? (g) => setUnitGroups(prev => ({ ...prev, [unit.id]: g })) : undefined}
                        showGroup={symmetryEnabled}
                        availableGroups={symmetryEnabled ? availableGroups : undefined}
                      />
                    ))}
                  </div>
                </ScrollArea>

                <Button type="button" variant="outline" size="sm" onClick={addUnit} className="gap-1">
                  <Plus className="h-3 w-3" />
                  {t("bulk.add_unit") || "Add Unit"}
                </Button>

                {/* Advanced Configuration */}
                {units.length >= 2 && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        <Settings2 className="h-3.5 w-3.5" />
                        {t("bulk.advanced") || "Advanced Settings"}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <div className="flex items-start gap-2 p-3 border rounded-lg bg-muted/20">
                        <Checkbox
                          checked={symmetryEnabled}
                          onCheckedChange={(checked) => {
                            const enabled = !!checked;
                            setSymmetryEnabled(enabled);
                            if (enabled) {
                              // Auto-assign groups: first half → A, second half → B
                              const groups: Record<string, string> = {};
                              const half = Math.ceil(units.length / 2);
                              units.forEach((u, i) => {
                                groups[u.id] = i < half ? "A" : "B";
                              });
                              setUnitGroups(groups);
                            } else {
                              setUnitGroups({});
                            }
                          }}
                        />
                        <div>
                          <span className="text-sm font-medium">{t("bulk.symmetry") || "Symmetrical units"}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("bulk.symmetry_desc") || "Units in the same group share identical configuration"}
                          </p>
                        </div>
                      </div>

                      {/* Group summary */}
                      {symmetryEnabled && groupSummary && (
                        <div className="space-y-1.5 p-3 border rounded-lg bg-muted/20">
                          {Object.entries(groupSummary).sort().map(([group, unitNums]) => (
                            <div key={group} className="flex items-center gap-2 text-xs">
                              <span className={`inline-block w-3 h-3 rounded-full ${GROUP_COLORS[group] || "bg-muted-foreground"}`} />
                              <span className="font-medium">{t("bulk.group") || "Group"} {group}:</span>
                              <span className="text-muted-foreground">
                                {unitNums.map(n => `${t("bulk.unit") || "Unit"} ${n}`).join(", ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {/* DIFFERENT MODE — each unit type configured independently, applied to all floors */}
            {unitMode === "different" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t("bulk.units_per_floor") || "প্রতি তলায় ইউনিট সংখ্যা"}</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={diffUnitsPerFloor}
                      onChange={e => handleDiffUnitsPerFloorChange(e.target.value)}
                      className="w-24"
                    />
                    <p className="text-xs text-muted-foreground">
                      {"প্রতিটি ইউনিট টাইপ সকল তলায় প্রযোজ্য হবে"}
                    </p>
                  </div>
                </div>

                <ScrollArea className="max-h-[45vh]">
                  <div className="space-y-3 pr-2">
                    {diffUnits.map((unit, idx) => (
                      <div key={unit.id} ref={idx === diffUnits.length - 1 ? lastUnitRef : undefined}>
                        <UnitCard
                          unit={unit}
                          idx={idx}
                          canRemove={diffUnits.length > 1}
                          onUpdate={(patch) => updateDiffUnit(unit.id, patch)}
                          onRemove={() => removeDiffUnit(unit.id)}
                          t={t}
                          roomTypeLabels={roomTypeLabels}
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button type="button" variant="outline" size="sm" onClick={addDiffUnit} className="gap-1">
                  <Plus className="h-3 w-3" />
                  {t("bulk.add_unit") || "ইউনিট যোগ করুন"}
                </Button>
              </div>
            )}
              </>
            )}
            {totalRooms > 0 && (
              <div className="space-y-2">
                <Label>{t("bulk.preview") || "Preview"} ({totalRooms} {t("bulk.rooms") || "rooms"})</Label>
                <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {previewItems.slice(0, 50).map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{item.label}</Badge>
                    ))}
                    {totalRooms > 50 && (
                      <Badge variant="outline" className="text-xs">+{totalRooms - 50} {t("bulk.more") || "more"}</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || totalRooms === 0}>
            {isPending
              ? (t("common.saving") || "Creating...")
              : `${t("bulk.create") || "Create"} ${totalRooms} ${t("bulk.rooms") || "rooms"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRoomAddDialog;
