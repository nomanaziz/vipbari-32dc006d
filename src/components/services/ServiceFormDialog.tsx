import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ServiceTypeGrid } from "./ServiceTypeGrid";

const PAYMENT_FREQUENCIES = [
  { value: "per_visit", bn: "প্রতি ভিজিটে", en: "Per Visit" },
  { value: "daily", bn: "দৈনিক", en: "Daily" },
  { value: "weekly", bn: "সাপ্তাহিক", en: "Weekly" },
  { value: "monthly", bn: "মাসিক", en: "Monthly" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: any;
  onSuccess: () => void;
}

export function ServiceFormDialog({ open, onOpenChange, service, onSuccess }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [serviceType, setServiceType] = useState("other");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isDailyHelp, setIsDailyHelp] = useState(false);
  const [paymentFrequency, setPaymentFrequency] = useState("per_visit");
  const [price, setPrice] = useState(0);
  const [propertyId, setPropertyId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (open && user) {
      supabase.from("properties").select("id, name").eq("owner_id", user.id).then(({ data }) => setProperties(data || []));
    }
  }, [open, user]);

  useEffect(() => {
    if (propertyId) {
      supabase.from("rooms").select("id, room_number").eq("property_id", propertyId).then(({ data }) => setRooms(data || []));
    } else {
      setRooms([]);
    }
  }, [propertyId]);

  useEffect(() => {
    if (service) {
      setServiceType(service.service_type || "other");
      setContactName(service.contact_name || "");
      setContactPhone(service.contact_phone || "");
      setCompanyName(service.company_name || "");
      setIsDailyHelp(service.is_daily_help || false);
      setPaymentFrequency(service.payment_frequency || "per_visit");
      setPrice(service.price || 0);
      setPropertyId(service.property_id || "");
      setRoomId(service.room_id || "");
      setDescription(service.description || "");
      setStatus(service.status || "available");
    } else {
      setServiceType("other"); setContactName(""); setContactPhone("");
      setCompanyName(""); setIsDailyHelp(false); setPaymentFrequency("per_visit");
      setPrice(0); setPropertyId(""); setRoomId(""); setDescription(""); setStatus("available");
    }
  }, [service, open]);

  const handleSubmit = async () => {
    if (!contactName.trim() || !user) return;
    setLoading(true);
    const payload = {
      owner_id: user.id,
      service_type: serviceType,
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      company_name: companyName.trim(),
      is_daily_help: isDailyHelp,
      payment_frequency: paymentFrequency,
      price,
      property_id: propertyId || null,
      room_id: roomId || null,
      description: description.trim(),
      status,
    };

    let error;
    if (service) {
      ({ error } = await supabase.from("services").update(payload).eq("id", service.id));
    } else {
      ({ error } = await supabase.from("services").insert(payload));
    }
    setLoading(false);
    if (error) {
      toast.error(L("Failed to save", "সংরক্ষণ ব্যর্থ"));
    } else {
      toast.success(service ? L("Updated", "আপডেট হয়েছে") : L("Added", "যোগ হয়েছে"));
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? L("Edit Service", "সেবা সম্পাদনা") : L("Add Service", "সেবা যোগ করুন")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{L("Service Type", "সেবার ধরন")} *</Label>
            <ServiceTypeGrid selected={serviceType} onSelect={setServiceType} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Contact Person", "যোগাযোগ ব্যক্তি")} *</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
            <div>
              <Label>{L("Phone", "ফোন")}</Label>
              <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{L("Company/Organization", "প্রতিষ্ঠান")}</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isDailyHelp} onCheckedChange={setIsDailyHelp} />
            <Label>{L("Daily Help (Regular Visitor)", "দৈনিক সাহায্যকারী")}</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Payment Frequency", "পেমেন্ট ফ্রিকোয়েন্সি")}</Label>
              <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{language === "bn" ? f.bn : f.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Price (৳)", "মূল্য (৳)")}</Label>
              <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{L("Property", "প্রপার্টি")}</Label>
              <Select value={propertyId} onValueChange={v => { setPropertyId(v); setRoomId(""); }}>
                <SelectTrigger><SelectValue placeholder={L("Select", "নির্বাচন")} /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{L("Room/Flat", "রুম/ফ্ল্যাট")}</Label>
              <Select value={roomId} onValueChange={setRoomId} disabled={!propertyId}>
                <SelectTrigger><SelectValue placeholder={L("Select", "নির্বাচন")} /></SelectTrigger>
                <SelectContent>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{L("Status", "অবস্থা")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">{L("Available", "সক্রিয়")}</SelectItem>
                <SelectItem value="unavailable">{L("Unavailable", "নিষ্ক্রিয়")}</SelectItem>
                <SelectItem value="on_leave">{L("On Leave", "ছুটিতে")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{L("Description", "বিবরণ")}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !contactName.trim()} className="w-full">
            {loading ? L("Saving...", "সংরক্ষণ হচ্ছে...") : service ? L("Update", "আপডেট") : L("Add", "যোগ করুন")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
