import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2, Trash2, Pencil, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  floor: number;
  rent_amount: number;
  status: string;
  bedrooms: number;
  bathrooms: number;
  properties?: { name: string };
}

interface Props {
  rooms: Room[];
  onSuccess: () => void;
}

const MODIFIABLE_FIELDS = [
  { value: "rent_amount", labelKey: "room.rent" },
  { value: "room_type", labelKey: "room.type" },
  { value: "floor", labelKey: "room.floor" },
  { value: "bedrooms", labelKey: "room.bedrooms" },
  { value: "bathrooms", labelKey: "room.bathrooms" },
  { value: "balconies", labelKey: "room.balcony" },
  { value: "area_sqft", labelKey: "room.area_sqft" },
];

const BulkRoomManageDialog = ({ rooms, onSuccess }: Props) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModify, setShowModify] = useState(false);
  const [modifyField, setModifyField] = useState("rent_amount");
  const [modifyValue, setModifyValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rooms.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rooms.map(r => r.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setIsPending(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase.from("rooms").delete().in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} ${t("bulk.rooms_deleted") || "rooms deleted"}`);
      setSelected(new Set());
      setDeleteConfirmOpen(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const handleBulkModify = async () => {
    if (selected.size === 0 || !modifyValue) return;
    setIsPending(true);
    try {
      const ids = Array.from(selected);
      let value: any = modifyValue;

      if (modifyField === "room_type") {
        if (!["room", "flat", "shop"].includes(value)) {
          toast.error("Invalid room type");
          return;
        }
      } else {
        value = Number(value);
        if (isNaN(value)) {
          toast.error("Please enter a valid number");
          return;
        }
      }

      const { error } = await supabase
        .from("rooms")
        .update({ [modifyField]: value })
        .in("id", ids);
      if (error) throw error;

      toast.success(`${ids.length} ${t("bulk.rooms_updated") || "rooms updated"}`);
      setShowModify(false);
      setModifyValue("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPending(false);
    }
  };

  const roomTypeLabels: Record<string, string> = {
    room: t("room.type_room") || "Room",
    flat: t("room.type_flat") || "Flat",
    shop: t("room.type_shop") || "Shop",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelected(new Set()); setShowModify(false); } }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings2 className="h-4 w-4" />
            {t("bulk.manage") || "Bulk Manage"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("bulk.manage_title") || "Bulk Manage Rooms"}</DialogTitle>
          </DialogHeader>

          {rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DoorOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>{t("bulk.no_rooms") || "No rooms available"}</p>
            </div>
          ) : (
            <>
              {/* Select All + Count */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.size === rooms.length && rooms.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">{t("bulk.select_all") || "Select All"}</span>
                </div>
                {selected.size > 0 && (
                  <Badge variant="secondary">{selected.size} {t("bulk.selected") || "selected"}</Badge>
                )}
              </div>

              {/* Room List */}
              <ScrollArea className="flex-1 max-h-[40vh]">
                <div className="space-y-1 pr-4">
                  {rooms.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        selected.has(r.id) ? "bg-primary/10" : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSelect(r.id)}
                    >
                      <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                      <DoorOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{r.room_number}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {r.properties?.name} · {t("room.floor")} {r.floor}
                        </span>
                      </div>
                      <Badge variant={r.status === "occupied" ? "default" : "secondary"} className="text-xs">
                        {roomTypeLabels[r.room_type] || r.room_type}
                      </Badge>
                      <span className="text-xs font-medium">৳{Number(r.rent_amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Modify Section */}
              {showModify && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("bulk.modify_field") || "Field to modify"}</Label>
                      <Select value={modifyField} onValueChange={setModifyField}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MODIFIABLE_FIELDS.map(f => (
                            <SelectItem key={f.value} value={f.value}>
                              {t(f.labelKey) || f.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("bulk.new_value") || "New value"}</Label>
                      {modifyField === "room_type" ? (
                        <Select value={modifyValue} onValueChange={setModifyValue}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="room">{roomTypeLabels.room}</SelectItem>
                            <SelectItem value="flat">{roomTypeLabels.flat}</SelectItem>
                            <SelectItem value="shop">{roomTypeLabels.shop}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="number"
                          value={modifyValue}
                          onChange={e => setModifyValue(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="0"
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBulkModify}
                    disabled={isPending || !modifyValue || selected.size === 0}
                    className="w-full"
                  >
                    {t("bulk.apply") || "Apply Changes"} ({selected.size})
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  disabled={selected.size === 0}
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("bulk.delete_selected") || "Delete Selected"} ({selected.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={selected.size === 0}
                  onClick={() => setShowModify(!showModify)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("bulk.modify_selected") || "Modify Selected"} ({selected.size})
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleBulkDelete}
        isPending={isPending}
        title={t("bulk.confirm_delete") || "Delete these rooms?"}
        description={`${selected.size} ${t("bulk.selected") || "selected"}`}
      />
    </>
  );
};

export default BulkRoomManageDialog;
