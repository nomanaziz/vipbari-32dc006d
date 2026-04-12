import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "electrical_equipment", bn: "বৈদ্যুতিক সরঞ্জাম", en: "Electrical Equipment" },
  { value: "plumbing", bn: "প্লাম্বিং", en: "Plumbing" },
  { value: "furniture", bn: "আসবাবপত্র", en: "Furniture" },
  { value: "appliance", bn: "যন্ত্রপাতি", en: "Appliance" },
  { value: "hvac", bn: "এসি/হিটিং", en: "HVAC/AC" },
  { value: "safety", bn: "নিরাপত্তা সরঞ্জাম", en: "Safety Equipment" },
  { value: "elevator", bn: "লিফট/এলিভেটর", en: "Elevator/Lift" },
  { value: "generator", bn: "জেনারেটর", en: "Generator" },
  { value: "water_system", bn: "পানি সিস্টেম", en: "Water System" },
  { value: "other", bn: "অন্যান্য", en: "Other" },
];

const CONDITIONS = [
  { value: "good", bn: "ভালো", en: "Good" },
  { value: "fair", bn: "মোটামুটি", en: "Fair" },
  { value: "poor", bn: "খারাপ", en: "Poor" },
  { value: "damaged", bn: "ক্ষতিগ্রস্ত", en: "Damaged" },
];

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: any;
  onSuccess: () => void;
}

export function AssetFormDialog({ open, onOpenChange, asset, onSuccess }: AssetFormDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [condition, setCondition] = useState("good");
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [floor, setFloor] = useState(0);
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      supabase.from("properties").select("id, name").eq("owner_id", user.id).then(({ data }) => {
        setProperties(data || []);
      });
    }
  }, [open, user]);

  useEffect(() => {
    if (propertyId) {
      supabase.from("rooms").select("id, room_number").eq("property_id", propertyId).then(({ data }) => {
        setRooms(data || []);
      });
    } else {
      setRooms([]);
    }
  }, [propertyId]);

  useEffect(() => {
    if (asset) {
      setName(asset.name || "");
      setCategory(asset.category || "other");
      setCondition(asset.condition || "good");
      setPropertyId(asset.property_id || "");
      setRoomId(asset.room_id || "");
      setFloor(asset.floor || 0);
      setLocation(asset.location || "");
      setPurchaseDate(asset.purchase_date || "");
      setNotes(asset.notes || "");
    } else {
      setName(""); setCategory("other"); setCondition("good");
      setPropertyId(""); setRoomId(""); setFloor(0);
      setLocation(""); setPurchaseDate(""); setNotes("");
    }
  }, [asset, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const payload = {
      owner_id: user.id,
      name: name.trim(),
      category,
      condition,
      property_id: propertyId || null,
      room_id: roomId || null,
      floor,
      location: location.trim(),
      purchase_date: purchaseDate || null,
      notes: notes.trim(),
    };

    let error;
    if (asset) {
      ({ error } = await supabase.from("assets").update(payload).eq("id", asset.id));
    } else {
      ({ error } = await supabase.from("assets").insert(payload));
    }

    setLoading(false);
    if (error) {
      toast.error(L("Failed to save asset", "সম্পদ সংরক্ষণ ব্যর্থ"));
    } else {
      toast.success(asset ? L("Asset updated", "সম্পদ আপডেট হয়েছে") : L("Asset added", "সম্পদ যোগ হয়েছে"));
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? L("Edit Asset", "সম্পদ সম্পাদনা") : L("Add Asset", "সম্পদ যোগ করুন")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{L("Name", "নাম")} *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={L("e.g. Water Pump", "যেমন: ওয়াটার পাম্প")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Category", "ক্যাটাগরি")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{language === "bn" ? c.bn : c.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Condition", "অবস্থা")}</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{language === "bn" ? c.bn : c.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Property", "প্রপার্টি")}</Label>
              <Select value={propertyId} onValueChange={v => { setPropertyId(v); setRoomId(""); }}>
                <SelectTrigger><SelectValue placeholder={L("Select", "নির্বাচন করুন")} /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Room/Flat", "রুম/ফ্ল্যাট")}</Label>
              <Select value={roomId} onValueChange={setRoomId} disabled={!propertyId}>
                <SelectTrigger><SelectValue placeholder={L("Select", "নির্বাচন করুন")} /></SelectTrigger>
                <SelectContent>
                  {rooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Floor", "তলা")}</Label>
              <Input type="number" value={floor} onChange={e => setFloor(Number(e.target.value))} />
            </div>
            <div>
              <Label>{L("Location", "অবস্থান")}</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={L("e.g. Rooftop", "যেমন: ছাদ")} />
            </div>
          </div>
          <div>
            <Label>{L("Purchase Date", "ক্রয়ের তারিখ")}</Label>
            <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>
          <div>
            <Label>{L("Notes", "নোট")}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()} className="w-full">
            {loading ? L("Saving...", "সংরক্ষণ হচ্ছে...") : asset ? L("Update", "আপডেট করুন") : L("Add", "যোগ করুন")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
