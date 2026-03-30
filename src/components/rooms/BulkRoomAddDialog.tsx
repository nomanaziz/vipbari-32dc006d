import { useState, useMemo } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Layers, Plus, Trash2, Copy } from "lucide-react";
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

interface Props {
  properties: { id: string; name: string }[];
  onSuccess: () => void;
}

// Extracted unit card to reduce duplication
const UnitCard = ({
  unit,
  idx,
  canRemove,
  onUpdate,
  onRemove,
  t,
  roomTypeLabels,
}: {
  unit: UnitTemplate;
  idx: number;
  canRemove: boolean;
  onUpdate: (patch: Partial<UnitTemplate>) => void;
  onRemove: () => void;
  t: (key: string) => string;
  roomTypeLabels: Record<string, string>;
}) => (
  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-sm">
        {t("bulk.unit")} {idx + 1}
      </h4>
      {canRemove && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">{t("bulk.unit_label")}</Label>
        <Input value={unit.label} onChange={e => onUpdate({ label: e.target.value })} placeholder="A" className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.type")}</Label>
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
        <Label className="text-xs">{t("room.rent")} (৳)</Label>
        <Input type="number" value={unit.rent_amount} onChange={e => onUpdate({ rent_amount: e.target.value })} className="h-8 text-sm" />
      </div>
    </div>
    <div className="grid grid-cols-4 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">{t("room.bedrooms")}</Label>
        <Input type="number" min="0" value={unit.bedrooms} onChange={e => onUpdate({ bedrooms: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.bathrooms")}</Label>
        <Input type="number" min="0" value={unit.bathrooms} onChange={e => onUpdate({ bathrooms: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.balcony")}</Label>
        <Input type="number" min="0" value={unit.balconies} onChange={e => onUpdate({ balconies: e.target.value })} className="h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{t("room.area_sqft")}</Label>
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
      <Label className="text-xs">{t("room.description")}</Label>
      <Textarea value={unit.description} onChange={e => onUpdate({ description: e.target.value })} rows={1} className="text-sm" />
    </div>
  </div>
);

const BulkRoomAddDialog = ({ properties, onSuccess }: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState(properties?.[0]?.id || "");
  const [floorFrom, setFloorFrom] = useState("1");
  const [floorTo, setFloorTo] = useState("5");
  const [unitMode, setUnitMode] = useState<"same" | "different">("same");
  const [units, setUnits] = useState<UnitTemplate[]>([defaultUnit()]);
  const [floorUnits, setFloorUnits] = useState<Record<number, UnitTemplate[]>>({});
  const [isPending, setIsPending] = useState(false);

  const roomTypeLabels: Record<string, string> = {
    room: t("room.type_room") || "Room",
    flat: t("room.type_flat") || "Flat",
    shop: t("room.type_shop") || "Shop",
  };

  const fromFloor = parseInt(floorFrom) || 0;
  const toFloor = parseInt(floorTo) || 0;
  const floorCount = Math.max(0, toFloor - fromFloor + 1);
  const floors = useMemo(() => Array.from({ length: floorCount }, (_, i) => fromFloor + i), [fromFloor, floorCount]);

  // Initialize floorUnits when switching to different mode or floor range changes
  const ensureFloorUnits = () => {
    setFloorUnits(prev => {
      const next = { ...prev };
      for (const f of floors) {
        if (!next[f]) next[f] = [defaultUnit()];
      }
      // Remove floors no longer in range
      for (const key of Object.keys(next)) {
        if (!floors.includes(Number(key))) delete next[Number(key)];
      }
      return next;
    });
  };

  const handleModeChange = (mode: "same" | "different") => {
    setUnitMode(mode);
    if (mode === "different") ensureFloorUnits();
  };

  // Recalc floorUnits when floor range changes in different mode
  const handleFloorChange = (from: string, to: string) => {
    setFloorFrom(from);
    setFloorTo(to);
    if (unitMode === "different") {
      setTimeout(() => ensureFloorUnits(), 0);
    }
  };

  const totalRooms = useMemo(() => {
    if (unitMode === "same") return floorCount * units.length;
    return floors.reduce((sum, f) => sum + (floorUnits[f]?.length || 0), 0);
  }, [unitMode, floorCount, units.length, floors, floorUnits]);

  const generateRoomNumber = (floor: number, unitLabel: string) => `${floor}${unitLabel}`;

  // --- Same mode helpers ---
  const addUnit = () => {
    const nextLabel = String.fromCharCode(65 + units.length);
    setUnits(prev => [...prev, { ...defaultUnit(nextLabel), id: crypto.randomUUID() }]);
  };
  const removeUnit = (id: string) => {
    if (units.length <= 1) return;
    setUnits(prev => prev.filter(u => u.id !== id));
  };
  const updateUnit = (id: string, patch: Partial<UnitTemplate>) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  };

  // --- Different mode helpers ---
  const addFloorUnit = (floor: number) => {
    setFloorUnits(prev => {
      const arr = prev[floor] || [];
      const nextLabel = String.fromCharCode(65 + arr.length);
      return { ...prev, [floor]: [...arr, { ...defaultUnit(nextLabel), id: crypto.randomUUID() }] };
    });
  };
  const removeFloorUnit = (floor: number, id: string) => {
    setFloorUnits(prev => {
      const arr = prev[floor] || [];
      if (arr.length <= 1) return prev;
      return { ...prev, [floor]: arr.filter(u => u.id !== id) };
    });
  };
  const updateFloorUnit = (floor: number, id: string, patch: Partial<UnitTemplate>) => {
    setFloorUnits(prev => ({
      ...prev,
      [floor]: (prev[floor] || []).map(u => u.id === id ? { ...u, ...patch } : u),
    }));
  };
  const copyFromFloor = (targetFloor: number, sourceFloor: number) => {
    setFloorUnits(prev => ({
      ...prev,
      [targetFloor]: (prev[sourceFloor] || []).map(u => ({ ...u, id: crypto.randomUUID() })),
    }));
  };

  const handleSubmit = async () => {
    if (!propertyId) { toast.error(t("room.select_property") || "Select a property"); return; }
    if (fromFloor > toFloor) { toast.error(t("bulk.invalid_floor_range")); return; }
    if (totalRooms > 100) { toast.error(t("bulk.too_many")); return; }
    if (totalRooms === 0) return;

    setIsPending(true);
    try {
      // Get current active room count & subscription slots
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

        // 4 free rooms total per landlord
        const freeSlots = 4;
        slotCount = paidSlots + freeSlots;
      }

      const rows: any[] = [];
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

      if (unitMode === "same") {
        for (let floor = fromFloor; floor <= toFloor; floor++) {
          for (const unit of units) {
            rows.push(buildRow(unit, floor));
          }
        }
      } else {
        for (const floor of floors) {
          for (const unit of (floorUnits[floor] || [])) {
            rows.push(buildRow(unit, floor));
          }
        }
      }

      // Mark rooms that exceed the slot limit as inactive
      const slotsAvailable = Math.max(0, slotCount - activeCount);
      const rowsWithStatus = rows.map((row, idx) => ({
        ...row,
        status: idx < slotsAvailable ? "vacant" : "inactive",
      }));

      const { error } = await supabase.from("rooms").insert(rowsWithStatus);
      if (error) throw error;

      const inactiveCount = rowsWithStatus.filter(r => r.status === "inactive").length;
      if (inactiveCount > 0) {
        toast.warning(`${rows.length} ${t("bulk.rooms_added")}. ${inactiveCount} ${t("room.inactive") || "inactive"}.`);
      } else {
        toast.success(`${rows.length} ${t("bulk.rooms_added")}`);
      }
      onSuccess();
      setOpen(false);
      setUnits([defaultUnit()]);
      setFloorUnits({});
      setFloorFrom("1");
      setFloorTo("5");
      setUnitMode("same");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  };

  // Build preview items
  const previewItems = useMemo(() => {
    const items: { floor: number; label: string }[] = [];
    if (unitMode === "same") {
      for (const floor of floors) {
        for (const unit of units) {
          items.push({ floor, label: generateRoomNumber(floor, unit.label) });
        }
      }
    } else {
      for (const floor of floors) {
        for (const unit of (floorUnits[floor] || [])) {
          items.push({ floor, label: generateRoomNumber(floor, unit.label) });
        }
      }
    }
    return items;
  }, [unitMode, floors, units, floorUnits]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Layers className="h-4 w-4" />
          {t("bulk.add_rooms")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("bulk.add_rooms_title")}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Property selection */}
            <div className="space-y-2">
              <Label>{t("room.property") || "Property"}</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Floor range */}
            <div className="space-y-2">
              <Label>{t("bulk.floor_range")}</Label>
              <div className="flex items-center gap-3">
                <Input type="number" value={floorFrom} onChange={e => handleFloorChange(e.target.value, floorTo.toString())} placeholder={t("bulk.from")} className="w-24" />
                <span className="text-muted-foreground">{t("bulk.to")}</span>
                <Input type="number" value={floorTo} onChange={e => handleFloorChange(floorFrom.toString(), e.target.value)} placeholder={t("bulk.to")} className="w-24" />
                <span className="text-sm text-muted-foreground">({floorCount} {t("bulk.floors")})</span>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="space-y-2">
              <Label className="text-base">{t("bulk.unit_templates")}</Label>
              <RadioGroup value={unitMode} onValueChange={(v) => handleModeChange(v as "same" | "different")} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="same" id="mode-same" />
                  <Label htmlFor="mode-same" className="text-sm font-normal cursor-pointer">{t("bulk.same_units")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="different" id="mode-different" />
                  <Label htmlFor="mode-different" className="text-sm font-normal cursor-pointer">{t("bulk.different_units")}</Label>
                </div>
              </RadioGroup>
            </div>

            {/* SAME MODE */}
            {unitMode === "same" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t("bulk.unit_desc")}</p>
                  <Button type="button" variant="outline" size="sm" onClick={addUnit} className="gap-1">
                    <Plus className="h-3 w-3" />
                    {t("bulk.add_unit")}
                  </Button>
                </div>
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
                  />
                ))}
              </div>
            )}

            {/* DIFFERENT MODE */}
            {unitMode === "different" && floorCount > 0 && (
              <Accordion type="multiple" defaultValue={floors.map(String)} className="space-y-2">
                {floors.map(floor => {
                  const fUnits = floorUnits[floor] || [];
                  return (
                    <AccordionItem key={floor} value={String(floor)} className="border rounded-lg">
                      <div className="flex items-center justify-between pr-4">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <span className="text-sm font-medium">
                            {t("bulk.floor_x")} {floor} ({fUnits.length} {t("bulk.unit")})
                          </span>
                        </AccordionTrigger>
                        {floors.length > 1 && (
                          <Select onValueChange={(v) => copyFromFloor(floor, Number(v))}>
                            <SelectTrigger className="h-7 w-auto text-xs gap-1 border-dashed">
                              <Copy className="h-3 w-3" />
                              <SelectValue placeholder={t("bulk.copy_from_floor")} />
                            </SelectTrigger>
                            <SelectContent>
                              {floors.filter(f => f !== floor).map(f => (
                                <SelectItem key={f} value={String(f)}>
                                  {t("bulk.floor_x")} {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <AccordionContent className="px-4 pb-4 space-y-3">
                        {fUnits.map((unit, idx) => (
                          <UnitCard
                            key={unit.id}
                            unit={unit}
                            idx={idx}
                            canRemove={fUnits.length > 1}
                            onUpdate={(patch) => updateFloorUnit(floor, unit.id, patch)}
                            onRemove={() => removeFloorUnit(floor, unit.id)}
                            t={t}
                            roomTypeLabels={roomTypeLabels}
                          />
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addFloorUnit(floor)} className="gap-1">
                          <Plus className="h-3 w-3" />
                          {t("bulk.add_unit")}
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

            {/* Preview */}
            {totalRooms > 0 && (
              <div className="space-y-2">
                <Label>{t("bulk.preview")} ({totalRooms} {t("bulk.rooms")})</Label>
                <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {previewItems.slice(0, 50).map((item, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{item.label}</Badge>
                    ))}
                    {totalRooms > 50 && (
                      <Badge variant="outline" className="text-xs">+{totalRooms - 50} {t("bulk.more")}</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || totalRooms === 0}>
            {isPending
              ? (t("common.saving") || "Creating...")
              : `${t("bulk.create")} ${totalRooms} ${t("bulk.rooms")}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRoomAddDialog;
