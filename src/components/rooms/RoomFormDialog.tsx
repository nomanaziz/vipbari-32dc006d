import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import { Switch } from "@/components/ui/switch";

export interface RoomFormData {
  room_number: string;
  room_type: string;
  floor: string;
  rent_amount: string;
  property_id: string;
  bedrooms: string;
  bathrooms: string;
  has_drawing_room: boolean;
  has_dining_room: boolean;
  has_kitchen: boolean;
  balconies: string;
  has_roof_access: boolean;
  area_sqft: string;
  description: string;
  status?: string;
}

const defaultForm: RoomFormData = {
  room_number: "", room_type: "room", floor: "0", rent_amount: "0", property_id: "",
  bedrooms: "1", bathrooms: "1", balconies: "1",
  has_drawing_room: false, has_dining_room: false, has_kitchen: false,
  has_roof_access: false,
  area_sqft: "0", description: "",
};

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any;
  properties: { id: string; name: string }[];
  onSubmit: (form: RoomFormData) => void;
  isPending: boolean;
  onReset: () => void;
  propertyType?: string;
}

export const getDefaultForm = (propertyId?: string): RoomFormData => ({
  ...defaultForm,
  property_id: propertyId || "",
});

export const formFromRoom = (r: any): RoomFormData => ({
  room_number: r.room_number,
  room_type: r.room_type,
  floor: String(r.floor),
  rent_amount: String(r.rent_amount),
  property_id: r.property_id,
  bedrooms: String(r.bedrooms || 0),
  bathrooms: String(r.bathrooms || 0),
  has_drawing_room: !!r.has_drawing_room,
  has_dining_room: !!r.has_dining_room,
  has_kitchen: !!r.has_kitchen,
  balconies: String(r.balconies || 0),
  has_roof_access: !!r.has_roof_access,
  area_sqft: String(r.area_sqft || 0),
  description: r.description || "",
  status: r.status || "vacant",
});

const RoomFormDialog = ({ open, onOpenChange, editing, properties, onSubmit, isPending, onReset, propertyType }: RoomFormDialogProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RoomFormData>(getDefaultForm(properties?.[0]?.id));

  const roomId = editing?.id;

  const { data: roomImages } = useQuery({
    queryKey: ["room_images", roomId],
    queryFn: async () => {
      const { data } = await supabase.from("room_images").select("*").eq("room_id", roomId).order("sort_order");
      return data || [];
    },
    enabled: !!roomId,
  });

  useEffect(() => {
    if (editing) {
      setForm(formFromRoom(editing));
    } else {
      const config = propertyType ? (roomTypeConfig[propertyType] || { default: "room" }) : { default: "room" };
      setForm({ ...getDefaultForm(properties?.[0]?.id), room_type: config.default });
    }
  }, [editing, properties, propertyType]);

  const isTinShed = propertyType === "tin_shed";

  const roomTypeLabels: Record<string, string> = {
    room: t("room.type_room") || "Room",
    flat: t("room.type_flat") || "Flat",
    shop: t("room.type_shop") || "Shop",
  };

  // Smart room type options based on property type
  const roomTypeConfig: Record<string, { options: string[]; default: string }> = {
    building: { options: ["flat", "shop"], default: "flat" },
    house: { options: ["room"], default: "room" },
    shop: { options: ["shop"], default: "shop" },
    tin_shed: { options: ["room"], default: "room" },
  };

  const currentConfig = roomTypeConfig[propertyType || ""] || { options: ["room", "flat", "shop"], default: "room" };
  const availableRoomTypes = currentConfig.options;
  const showRoomTypeSelector = availableRoomTypes.length > 1 && !isTinShed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id) { toast.error("Select a property"); return; }
    onSubmit(form);
  };

  const handleImageUploaded = async (url: string) => {
    if (!roomId) return;
    const count = (roomImages || []).length;
    await supabase.from("room_images").insert({
      room_id: roomId,
      image_url: url,
      sort_order: count,
    });
    queryClient.invalidateQueries({ queryKey: ["room_images", roomId] });
  };

  const handleImageRemoved = async (imgId: string, url: string) => {
    const path = url.split("/property-images/")[1];
    if (path) await supabase.storage.from("property-images").remove([path]);
    await supabase.from("room_images").delete().eq("id", imgId);
    queryClient.invalidateQueries({ queryKey: ["room_images", roomId] });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) onReset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2" onClick={onReset}>
          <Plus className="h-4 w-4" />
          {t("room.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("common.edit") : t("room.add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status toggle - only when editing */}
          {editing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">{t("room.status") || "Status"}</Label>
                <p className="text-xs text-muted-foreground">
                  {form.status === "inactive" 
                    ? (t("room.inactive_desc") || "Room is deactivated and hidden")
                    : (t("room.active_desc") || "Room is active and visible")}
                </p>
              </div>
              <Switch
                checked={form.status !== "inactive"}
                onCheckedChange={(checked) => setForm(f => ({ ...f, status: checked ? "vacant" : "inactive" }))}
              />
            </div>
          )}

          {/* Property */}
          <div className="space-y-2">
            <Label>{t("room.property") || "Property"}</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
              <SelectContent>
                {properties?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("room.number")}</Label>
              <Input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} required />
            </div>
            {!isTinShed && (
              <div className="space-y-2">
                <Label>{t("room.type")}</Label>
                <Select value={form.room_type} onValueChange={v => setForm(f => ({ ...f, room_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">{roomTypeLabels.room}</SelectItem>
                    <SelectItem value="flat">{roomTypeLabels.flat}</SelectItem>
                    <SelectItem value="shop">{roomTypeLabels.shop}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("room.floor")}</Label>
              <Input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("room.rent")} (৳)</Label>
              <Input type="number" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: e.target.value }))} />
            </div>
          </div>

          {/* Tin Shed: utilities included info */}
          {isTinShed && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ⚡ {language === "bn" ? "সব ইউটিলিটি ভাড়ায় অন্তর্ভুক্ত (গ্যাস, পানি, বিদ্যুৎ)" : "All utilities included in rent (gas, water, electricity)"}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                🔁 {language === "bn" ? "বাথরুম, রান্নাঘর, ওয়াশরুম — সব কমন/শেয়ার্ড" : "Bathroom, kitchen, washroom — all common/shared"}
              </p>
            </div>
          )}

          {/* Bedrooms / Bathrooms - hide for tin_shed */}
          {!isTinShed && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("room.bedrooms")}</Label>
                <Input type="number" min="0" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("room.bathrooms")}</Label>
                <Input type="number" min="0" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Amenity checkboxes - hide for tin_shed */}
          {!isTinShed && (
            <div className="space-y-2">
              <Label>{t("room.amenities")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  ["has_drawing_room", t("room.drawing_room")],
                  ["has_dining_room", t("room.dining_room")],
                  ["has_kitchen", t("room.kitchen")],
                  ["has_roof_access", t("room.roof_access")],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={(form as any)[key]}
                      onCheckedChange={(checked) => setForm(f => ({ ...f, [key]: !!checked }))}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balconies - hide for tin_shed */}
          {!isTinShed && (
            <div className="space-y-2">
              <Label>{t("room.balcony")}</Label>
              <Input type="number" min="0" value={form.balconies} onChange={e => setForm(f => ({ ...f, balconies: e.target.value }))} />
            </div>
          )}

          {/* Area - hide for tin_shed */}
          {!isTinShed && (
            <div className="space-y-2">
              <Label>{t("room.area_sqft")}</Label>
              <Input type="number" min="0" value={form.area_sqft} onChange={e => setForm(f => ({ ...f, area_sqft: e.target.value }))} />
            </div>
          )}
          <div className="space-y-2">
            <Label>{t("room.description")}</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          {/* Images - only when editing */}
          {editing && (
            <div className="space-y-2">
              <Label>{t("image.upload") || "Images"} ({t("image.max_10") || "Max 10"})</Label>
              <ImageUploader
                maxImages={10}
                existingImages={(roomImages || []).map((img: any) => ({ id: img.id, image_url: img.image_url, sort_order: img.sort_order }))}
                bucketPath={`${form.property_id}/${roomId}`}
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomFormDialog;
