import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: "room" | "property";
  sourceData: any;
  propertyData?: any;
}

export function SellDialog({ open, onOpenChange, sourceType, sourceData, propertyData }: SellDialogProps) {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [price, setPrice] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [useDifferentNumber, setUseDifferentNumber] = useState(false);
  const [showContactPhone, setShowContactPhone] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auto-fill from profile when dialog opens
  useEffect(() => {
    if (open && profile?.phone) {
      setContactPhone(profile.phone);
      setContactWhatsapp(profile.phone);
      setUseDifferentNumber(false);
    }
  }, [open, profile?.phone]);

  const handleSave = async () => {
    if (!user || !price) {
      toast.error(language === "bn" ? "দাম দিন" : "Enter price");
      return;
    }

    const finalPhone = useDifferentNumber ? contactPhone : (profile?.phone || contactPhone);
    const finalWhatsapp = useDifferentNumber ? (contactWhatsapp || finalPhone) : (profile?.phone || contactWhatsapp);

    if (!finalPhone) {
      toast.error(language === "bn" ? "ফোন নম্বর দিন" : "Phone number required");
      return;
    }

    // Check sale listing balance
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("sale_listing_count")
      .eq("user_id", user.id)
      .eq("product_type", "sale_listing")
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString());
    const totalSlots = (subs || []).reduce((sum: number, s: any) => sum + (s.sale_listing_count || 0), 0);

    const { data: usedListings } = await supabase
      .from("sale_listings")
      .select("id")
      .eq("owner_id", user.id)
      .eq("sale_slot_used", true);
    const usedSlots = usedListings?.length || 0;

    if (totalSlots - usedSlots <= 0) {
      toast.error(language === "bn" ? "বিক্রয় লিস্টিং ব্যালেন্স নেই। সাবস্ক্রিপশন কিনুন।" : "No sale listing balance. Buy subscription first.");
      navigate("/subscription?tab=sale_listing");
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      let title = "";
      let description = "";
      let property_type = "flat";
      let division = "";
      let district = "";
      let thana = "";
      let area = "";
      let location_address = "";
      let bedrooms = 0;
      let bathrooms = 0;
      let area_sqft = 0;
      let floor = 0;
      let room_id: string | null = null;
      let property_id: string | null = null;

      if (sourceType === "room") {
        const r = sourceData;
        const p = propertyData;
        const typeLabel = r.room_type === "flat" ? "Flat" : r.room_type === "shop" ? "Shop" : "Room";
        title = `${typeLabel} ${r.room_number} - ${p?.name || ""}`;
        description = r.description || "";
        property_type = r.room_type === "shop" ? "shop" : r.room_type || "flat";
        division = p?.division || "";
        district = p?.district || "";
        thana = p?.thana || "";
        area = p?.area || "";
        location_address = p?.address || "";
        bedrooms = r.bedrooms || 0;
        bathrooms = r.bathrooms || 0;
        area_sqft = r.area_sqft || 0;
        floor = r.floor || 0;
        room_id = r.id;
        property_id = r.property_id;
      } else {
        const p = sourceData;
        title = `${p.name} - ${p.property_type}`;
        description = "";
        property_type = p.property_type === "apartment" ? "apartment" : "flat";
        division = p.division || "";
        district = p.district || "";
        thana = p.thana || "";
        area = p.area || "";
        location_address = p.address || "";
        property_id = p.id;
      }

      const { data: listing, error } = await supabase.from("sale_listings").insert({
        owner_id: user.id,
        title,
        description,
        price: parseFloat(price),
        property_type,
        division,
        district,
        thana,
        area,
        location_address,
        bedrooms,
        bathrooms,
        area_sqft,
        floor,
        contact_phone: finalPhone,
        contact_whatsapp: finalWhatsapp,
        status: "active",
        room_id,
        property_id,
        sale_slot_used: true,
        show_contact_phone: showContactPhone,
        sale_scope: sourceType === "room" ? "unit" : "property",
      }).select("id").single();

      if (error) throw error;

      // Copy images
      if (sourceType === "room" && listing) {
        const { data: roomImages } = await supabase.from("room_images").select("image_url, sort_order").eq("room_id", sourceData.id);
        if (roomImages?.length) {
          await supabase.from("sale_listing_images").insert(
            roomImages.map((img: any) => ({ listing_id: listing.id, image_url: img.image_url, sort_order: img.sort_order }))
          );
        }
      } else if (sourceType === "property" && listing) {
        const { data: propImages } = await supabase.from("property_images").select("image_url, sort_order").eq("property_id", sourceData.id);
        if (propImages?.length) {
          await supabase.from("sale_listing_images").insert(
            propImages.map((img: any) => ({ listing_id: listing.id, image_url: img.image_url, sort_order: img.sort_order }))
          );
        }
      }

      toast.success(language === "bn" ? "বিক্রয় লিস্টিং তৈরি হয়েছে!" : "Sale listing created!");
      queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["room-sale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["property-sale-listings"] });
      onOpenChange(false);
      setPrice("");
      setUseDifferentNumber(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {language === "bn" ? "বিক্রয় করুন" : "Sell This Property"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="font-semibold text-sm">
              {sourceType === "room"
                ? `${sourceData?.room_number} — ${propertyData?.name || ""}`
                : sourceData?.name}
            </p>
            {sourceType === "room" && (
              <p className="text-xs text-muted-foreground">
                {sourceData?.room_type === "flat" ? "Flat" : sourceData?.room_type === "shop" ? "Shop" : "Room"} • Floor {sourceData?.floor}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{language === "bn" ? "বিক্রয় মূল্য (৳)" : "Sell Price (৳)"}</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={language === "bn" ? "যেমন: ৫০০০০০০" : "e.g. 5000000"}
            />
          </div>

          {/* Contact info - auto-filled from profile */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{language === "bn" ? "যোগাযোগ নম্বর" : "Contact Number"}</p>
                <p className="text-xs text-muted-foreground">{profile?.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{language === "bn" ? "অন্য নম্বর ব্যবহার করুন" : "Use different number"}</Label>
              <Switch checked={useDifferentNumber} onCheckedChange={setUseDifferentNumber} />
            </div>
          </div>

          {useDifferentNumber && (
            <>
              <div className="space-y-2">
                <Label>{language === "bn" ? "যোগাযোগ নম্বর" : "Contact Number"}</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "bn" ? "WhatsApp নম্বর (ঐচ্ছিক)" : "WhatsApp (Optional)"}</Label>
                <Input
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <Label>{language === "bn" ? "ফোন নম্বর দেখান" : "Show Phone Number"}</Label>
            <Switch checked={showContactPhone} onCheckedChange={setShowContactPhone} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{language === "bn" ? "বাতিল" : "Cancel"}</Button>
          <Button onClick={handleSave} disabled={saving || !price}>
            {saving ? "..." : (language === "bn" ? "বিক্রয়ে দিন" : "List for Sale")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
