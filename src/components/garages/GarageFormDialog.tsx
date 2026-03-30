import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface GarageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  editData?: any;
}

export function GarageFormDialog({ open, onOpenChange, onSubmit, isPending, editData }: GarageFormDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [form, setForm] = useState({
    property_id: "", garage_number: "", garage_type: "car",
    rent_amount: 0, assignment_type: "vacant", tenant_id: "",
    room_id: "", external_tenant_name: "", external_tenant_phone: "",
    description: "", is_tolet: false,
  });

  useEffect(() => {
    if (editData) {
      setForm({
        property_id: editData.property_id || "",
        garage_number: editData.garage_number || "",
        garage_type: editData.garage_type || "car",
        rent_amount: Number(editData.rent_amount) || 0,
        assignment_type: editData.assignment_type || (editData.tenant_id ? "individual" : "vacant"),
        tenant_id: editData.tenant_id || "",
        room_id: editData.room_id || "",
        external_tenant_name: editData.external_tenant_name || "",
        external_tenant_phone: editData.external_tenant_phone || "",
        description: editData.description || "",
        is_tolet: editData.is_tolet || false,
      });
    } else {
      setForm({
        property_id: "", garage_number: "", garage_type: "car",
        rent_amount: 0, assignment_type: "vacant", tenant_id: "",
        room_id: "", external_tenant_name: "", external_tenant_phone: "",
        description: "", is_tolet: false,
      });
    }
  }, [editData, open]);

  const { data: properties } = useQuery({
    queryKey: ["properties-for-garage", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user && open,
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-garage", form.property_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_number, tenant_id, tenants:tenant_id(id, full_name)")
        .eq("property_id", form.property_id);
      return data || [];
    },
    enabled: !!form.property_id && open && form.assignment_type === "with_room",
  });

  const { data: tenants } = useQuery({
    queryKey: ["tenants-for-garage", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, full_name").eq("owner_id", user!.id).eq("status", "active");
      return data || [];
    },
    enabled: !!user && open && form.assignment_type === "individual",
  });

  // Auto-fill tenant when room is selected in with_room mode
  useEffect(() => {
    if (form.assignment_type === "with_room" && form.room_id && rooms) {
      const selectedRoom = rooms.find((r: any) => r.id === form.room_id);
      if (selectedRoom?.tenant_id) {
        setForm(f => ({ ...f, tenant_id: selectedRoom.tenant_id }));
      } else {
        setForm(f => ({ ...f, tenant_id: "" }));
      }
    }
  }, [form.room_id, form.assignment_type, rooms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isOccupied = form.assignment_type !== "vacant";
    onSubmit({
      owner_id: user!.id,
      property_id: form.property_id,
      garage_number: form.garage_number,
      garage_type: form.garage_type,
      rent_amount: Number(form.rent_amount) || 0,
      assignment_type: form.assignment_type,
      room_id: form.assignment_type === "with_room" && form.room_id ? form.room_id : null,
      tenant_id: (form.assignment_type === "with_room" || form.assignment_type === "individual") && form.tenant_id ? form.tenant_id : null,
      external_tenant_name: form.assignment_type === "external" ? form.external_tenant_name : null,
      external_tenant_phone: form.assignment_type === "external" ? form.external_tenant_phone : null,
      status: isOccupied ? "occupied" : "vacant",
      description: form.description,
      is_tolet: !isOccupied ? form.is_tolet : false,
    });
  };

  const selectedRoomTenant = rooms?.find((r: any) => r.id === form.room_id)?.tenants as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? L("Edit Garage", "গ্যারেজ সম্পাদনা") : L("Add Garage", "গ্যারেজ যোগ করুন")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property */}
          <div className="space-y-1.5">
            <Label>{L("Property", "প্রপার্টি")} *</Label>
            <Select value={form.property_id} onValueChange={v => setForm(f => ({ ...f, property_id: v, room_id: "", tenant_id: "" }))}>
              <SelectTrigger><SelectValue placeholder={L("Select property", "প্রপার্টি নির্বাচন")} /></SelectTrigger>
              <SelectContent>
                {properties?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Garage Number + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{L("Garage Number", "গ্যারেজ নম্বর")} *</Label>
              <Input value={form.garage_number} onChange={e => setForm(f => ({ ...f, garage_number: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>{L("Type", "ধরন")}</Label>
              <Select value={form.garage_type} onValueChange={v => setForm(f => ({ ...f, garage_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">{L("Car", "গাড়ি")}</SelectItem>
                  <SelectItem value="bike">{L("Bike", "বাইক")}</SelectItem>
                  <SelectItem value="other">{L("Other", "অন্যান্য")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rent + Assignment Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{L("Rent (৳)", "ভাড়া (৳)")}</Label>
              <Input type="number" min="0" value={form.rent_amount} onChange={e => setForm(f => ({ ...f, rent_amount: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{L("Assignment", "বরাদ্দ")}</Label>
              <Select value={form.assignment_type} onValueChange={v => setForm(f => ({ ...f, assignment_type: v, tenant_id: "", room_id: "", external_tenant_name: "", external_tenant_phone: "" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">{L("Vacant", "খালি")}</SelectItem>
                  <SelectItem value="with_room">{L("With Room/Flat", "রুম/ফ্ল্যাট সহ")}</SelectItem>
                  <SelectItem value="individual">{L("Individual Tenant", "একক ভাড়াটিয়া")}</SelectItem>
                  <SelectItem value="external">{L("External / Third Party", "বাইরের / তৃতীয় পক্ষ")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* With Room: Room selector */}
          {form.assignment_type === "with_room" && form.property_id && (
            <div className="space-y-1.5">
              <Label>{L("Select Room/Flat", "রুম/ফ্ল্যাট নির্বাচন")}</Label>
              <Select value={form.room_id || "none"} onValueChange={v => setForm(f => ({ ...f, room_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder={L("Select room", "রুম নির্বাচন")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{L("Select...", "নির্বাচন...")}</SelectItem>
                  {rooms?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number} {r.tenants?.full_name ? `(${r.tenants.full_name})` : `(${L("Vacant", "খালি")})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoomTenant?.full_name && (
                <p className="text-xs text-muted-foreground">
                  {L("Tenant", "ভাড়াটিয়া")}: {selectedRoomTenant.full_name}
                </p>
              )}
            </div>
          )}

          {/* Individual: Tenant selector */}
          {form.assignment_type === "individual" && (
            <div className="space-y-1.5">
              <Label>{L("Select Tenant", "ভাড়াটিয়া নির্বাচন")}</Label>
              <Select value={form.tenant_id || "none"} onValueChange={v => setForm(f => ({ ...f, tenant_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder={L("Select tenant", "ভাড়াটিয়া নির্বাচন")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{L("Select...", "নির্বাচন...")}</SelectItem>
                  {tenants?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* External: Name + Phone */}
          {form.assignment_type === "external" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{L("Renter Name", "ভাড়াটিয়ার নাম")}</Label>
                <Input value={form.external_tenant_name} onChange={e => setForm(f => ({ ...f, external_tenant_name: e.target.value }))} placeholder={L("Full name", "পুরো নাম")} />
              </div>
              <div className="space-y-1.5">
                <Label>{L("Phone", "ফোন")}</Label>
                <Input value={form.external_tenant_phone} onChange={e => setForm(f => ({ ...f, external_tenant_phone: e.target.value }))} placeholder="01XXXXXXXXX" />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label>{L("Description", "বিবরণ")}</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          {/* To-Let Toggle (only for vacant) */}
          {form.assignment_type === "vacant" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">{L("Publish on To-Let", "টু-লেটে প্রকাশ করুন")}</Label>
                <p className="text-xs text-muted-foreground">{L("Show this garage on the To-Let listings page", "টু-লেট পেজে এই গ্যারেজ দেখান")}</p>
              </div>
              <Switch checked={form.is_tolet} onCheckedChange={v => setForm(f => ({ ...f, is_tolet: v }))} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{L("Cancel", "বাতিল")}</Button>
            <Button type="submit" disabled={isPending || !form.property_id || !form.garage_number}>
              {editData ? L("Update", "আপডেট") : L("Add", "যোগ করুন")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
