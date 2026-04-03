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

interface BillGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  effectiveOwnerId?: string | null;
}

export function BillGenerateDialog({ open, onOpenChange, onSubmit, isPending, effectiveOwnerId }: BillGenerateDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const ownerId = effectiveOwnerId || user?.id;
  const [tenantId, setTenantId] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [charges, setCharges] = useState({
    rent_amount: 0, electricity_charge: 0, water_charge: 0,
    gas_charge: 0, service_charge: 0, garage_charge: 0, other_charges: 0,
    wifi_charge: 0, generator_charge: 0, security_charge: 0,
  });
  const [dueDate, setDueDate] = useState("");

  // Fetch utility config from landlord_settings
  const { data: utilityConfig } = useQuery({
    queryKey: ["utility-config", ownerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("landlord_settings")
        .select("value")
        .eq("owner_id", ownerId!)
        .eq("key", "utility_config")
        .maybeSingle();
      if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
        return data.value as Record<string, { enabled: boolean; rate: string }>;
      }
      return null;
    },
    enabled: !!ownerId && open,
  });

  const { data: tenants } = useQuery({
    queryKey: ["landlord-tenants-for-bill", ownerId],
    queryFn: async () => {
      const { data: owned } = await supabase
        .from("tenants")
        .select("id, full_name, phone, room_id, rooms(id, room_number, rent_amount)")
        .eq("owner_id", ownerId!)
        .eq("status", "active");

      const { data: requests } = await supabase
        .from("tolet_requests")
        .select("tenant_user_id, room_id, rooms(id, room_number, rent_amount)")
        .eq("landlord_user_id", ownerId!)
        .eq("status", "accepted");

      const tenantMap = new Map<string, any>();
      (owned || []).forEach((t: any) => tenantMap.set(t.id, t));

      if (requests && requests.length > 0) {
        const requestUserIds = requests
          .map((r: any) => r.tenant_user_id)
          .filter((uid: string) => ![...tenantMap.values()].some((t: any) => t.user_id === uid));

        if (requestUserIds.length > 0) {
          const { data: reqTenants } = await supabase
            .from("tenants")
            .select("id, full_name, phone, room_id, user_id, rooms(id, room_number, rent_amount)")
            .in("user_id", requestUserIds)
            .eq("status", "active");

          (reqTenants || []).forEach((t: any) => {
            if (!tenantMap.has(t.id)) {
              const req = requests.find((r: any) => r.tenant_user_id === t.user_id);
              if (!t.rooms && req?.rooms) {
                t.rooms = req.rooms;
                t.room_id = req.room_id;
              }
              tenantMap.set(t.id, t);
            }
          });
        }
      }

      return Array.from(tenantMap.values());
    },
    enabled: !!ownerId && open,
  });

  const selectedTenant = tenants?.find((t: any) => t.id === tenantId);

  // Auto-populate charges from utility config + rent when tenant is selected
  useEffect(() => {
    if (selectedTenant?.rooms) {
      const rentAmount = Number(selectedTenant.rooms.rent_amount) || 0;
      const cfg = utilityConfig;
      setCharges({
        rent_amount: rentAmount,
        electricity_charge: cfg?.electricity?.enabled ? Number(cfg.electricity.rate) || 0 : 0,
        water_charge: cfg?.water?.enabled ? Number(cfg.water.rate) || 0 : 0,
        gas_charge: cfg?.gas?.enabled ? Number(cfg.gas.rate) || 0 : 0,
        service_charge: 0,
        garage_charge: 0,
        other_charges: cfg?.other?.enabled ? Number(cfg.other.rate) || 0 : 0,
        wifi_charge: cfg?.wifi?.enabled ? Number(cfg.wifi.rate) || 0 : 0,
        generator_charge: cfg?.generator?.enabled ? Number(cfg.generator.rate) || 0 : 0,
        security_charge: cfg?.security?.enabled ? Number(cfg.security.rate) || 0 : 0,
      });
    }
  }, [selectedTenant, utilityConfig]);

  const total = Object.values(charges).reduce((a, b) => a + (Number(b) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !month) return;
    onSubmit({
      tenant_id: tenantId,
      room_id: selectedTenant?.room_id || selectedTenant?.rooms?.id,
      owner_id: user!.id,
      month,
      due_date: dueDate || null,
      ...charges,
      total_amount: total,
    });
  };

  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{L("Generate Bill", "বিল তৈরি করুন")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{L("Select Tenant", "ভাড়াটিয়া নির্বাচন করুন")}</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger><SelectValue placeholder={L("Choose tenant...", "ভাড়াটিয়া বাছুন...")} /></SelectTrigger>
              <SelectContent>
                {tenants?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name} — {t.rooms?.room_number || t.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{L("Month", "মাস")}</Label>
              <Input type="month" value={month} onChange={e => setMonth(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{L("Due Date", "পরিশোধের তারিখ")}</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "rent_amount", en: "Rent", bn: "ভাড়া" },
              { key: "electricity_charge", en: "Electricity", bn: "বিদ্যুৎ" },
              { key: "water_charge", en: "Water", bn: "পানি" },
              { key: "gas_charge", en: "Gas", bn: "গ্যাস" },
              { key: "wifi_charge", en: "WiFi/Internet", bn: "ওয়াইফাই" },
              { key: "generator_charge", en: "Generator", bn: "জেনারেটর" },
              { key: "security_charge", en: "Security", bn: "সিকিউরিটি" },
              { key: "service_charge", en: "Service", bn: "সার্ভিস" },
              { key: "garage_charge", en: "Garage", bn: "গ্যারেজ" },
              { key: "other_charges", en: "Other", bn: "অন্যান্য" },
            ].map(({ key, en, bn }) => (
              <div key={key} className="space-y-1.5">
                <Label>{L(en, bn)} (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={charges[key as keyof typeof charges]}
                  onChange={e => setCharges(c => ({ ...c, [key]: Number(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="font-medium">{L("Total", "মোট")}</span>
            <span className="text-lg font-bold text-primary">৳{total.toLocaleString()}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{L("Cancel", "বাতিল")}</Button>
            <Button type="submit" disabled={isPending || !tenantId}>{L("Generate Bill", "বিল তৈরি করুন")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
