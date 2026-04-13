import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [purchasePrice, setPurchasePrice] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [purchasedBy, setPurchasedBy] = useState("");
  const [addToAccounting, setAddToAccounting] = useState(true);
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
      setPurchasePrice(asset.purchase_price ? String(asset.purchase_price) : "");
      setWarrantyMonths(asset.warranty_months ? String(asset.warranty_months) : "");
      setVendorName(asset.vendor_name || "");
      setVendorPhone(asset.vendor_phone || "");
      setPurchasedBy(asset.purchased_by || "");
      setAddToAccounting(false);
    } else {
      setName(""); setCategory("other"); setCondition("good");
      setPropertyId(""); setRoomId(""); setFloor(0);
      setLocation(""); setPurchaseDate(""); setNotes("");
      setPurchasePrice(""); setWarrantyMonths("");
      setVendorName(""); setVendorPhone(""); setPurchasedBy("");
      setAddToAccounting(true);
    }
  }, [asset, open]);

  const calcWarrantyEndDate = (): string | null => {
    if (!purchaseDate || !warrantyMonths || Number(warrantyMonths) <= 0) return null;
    const d = new Date(purchaseDate);
    d.setMonth(d.getMonth() + Number(warrantyMonths));
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const warrantyEnd = calcWarrantyEndDate();
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
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : 0,
      warranty_months: warrantyMonths ? parseInt(warrantyMonths) : 0,
      warranty_end_date: warrantyEnd,
      vendor_name: vendorName.trim(),
      vendor_phone: vendorPhone.trim(),
      purchased_by: purchasedBy.trim(),
      add_to_accounting: !asset && addToAccounting,
    };

    let error;
    if (asset) {
      ({ error } = await supabase.from("assets").update(payload).eq("id", asset.id));
    } else {
      ({ error } = await supabase.from("assets").insert(payload));
      // Add accounting entry if requested (only for new assets)
      if (!error && addToAccounting && purchasePrice && parseFloat(purchasePrice) > 0) {
        await supabase.from("accounting_entries").insert({
          owner_id: user.id,
          type: "expense",
          category: "asset_purchase",
          entry_date: purchaseDate || new Date().toISOString().split("T")[0],
          description: `${L("Asset Purchase", "সম্পদ ক্রয়")}: ${name.trim()}${vendorName.trim() ? ` (${vendorName.trim()})` : ""}`,
          amount: parseFloat(purchasePrice),
        });
      }
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

          {/* Purchase & Warranty Section */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-3">{L("Purchase & Warranty", "ক্রয় ও ওয়ারেন্টি")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{L("Purchase Price (৳)", "ক্রয়মূল্য (৳)")}</Label>
                <Input type="number" min="0" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>{L("Purchase Date", "ক্রয়ের তারিখ")}</Label>
                <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>{L("Warranty (Months)", "ওয়ারেন্টি (মাস)")}</Label>
                <Input type="number" min="0" value={warrantyMonths} onChange={e => setWarrantyMonths(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>{L("Purchased By", "কে কিনেছেন")}</Label>
                <Input value={purchasedBy} onChange={e => setPurchasedBy(e.target.value)} placeholder={L("Buyer name", "ক্রেতার নাম")} />
              </div>
            </div>
          </div>

          {/* Vendor Section */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-3">{L("Vendor Information", "ভেন্ডর তথ্য")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{L("Vendor/Shop Name", "ভেন্ডর/দোকানের নাম")}</Label>
                <Input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder={L("e.g. ABC Electronics", "যেমন: ABC ইলেকট্রনিক্স")} />
              </div>
              <div>
                <Label>{L("Vendor Phone", "ভেন্ডরের ফোন")}</Label>
                <Input value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
            </div>
          </div>

          <div>
            <Label>{L("Notes", "নোট")}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Accounting checkbox - only for new assets */}
          {!asset && (
            <div className="flex items-center gap-2 border-t pt-3">
              <Checkbox
                id="addToAccounting"
                checked={addToAccounting}
                onCheckedChange={(v) => setAddToAccounting(!!v)}
              />
              <Label htmlFor="addToAccounting" className="cursor-pointer text-sm">
                {L("Add to accounting as expense", "হিসাবে খরচ হিসেবে যোগ করুন")}
              </Label>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !name.trim()} className="w-full">
            {loading ? L("Saving...", "সংরক্ষণ হচ্ছে...") : asset ? L("Update", "আপডেট করুন") : L("Add", "যোগ করুন")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
