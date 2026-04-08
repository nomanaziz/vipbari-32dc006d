import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Building2, MapPin, Pencil, Trash2, Shield, Flame, Zap, Users, Wifi, Tv, Camera, ArrowUpFromLine, BatteryCharging, Car, Fuel, Droplets, Home, Phone, Map, ShoppingBag, ArrowRightLeft, Check, X, UserCheck, UserX } from "lucide-react";
import { SellDialog } from "@/components/sale/SellDialog";
import PropertyHistoryDialog from "@/components/properties/PropertyHistoryDialog";
import { toast } from "sonner";
import { DIVISIONS, DIVISIONS_BN, DISTRICTS, DISTRICTS_BN, THANAS, THANAS_BN, getBnLabel } from "@/data/bangladeshAddress";
import ImageUploader from "@/components/ImageUploader";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type Property = {
  id: string;
  name: string;
  address: string;
  property_type: string;
  total_rooms: number;
  owner_id: string;
  division: string;
  district: string;
  thana: string;
  area: string;
  house_number: string;
  road_number: string;
  sector: string;
  block: string;
  postal_code: string;
  nearest_police_station: string;
  nearest_fire_service: string;
  nearest_electricity_office: string;
  tolet_phone: string;
  has_garage: boolean;
  has_internet: boolean;
  has_dish: boolean;
  has_security: boolean;
  has_cctv: boolean;
  has_lift: boolean;
  has_generator: boolean;
  has_parking: boolean;
  has_gas_supply: boolean;
  has_water_supply: boolean;
  has_rooftop_access: boolean;
  map_url: string;
  common_bathrooms: number;
  common_washrooms: number;
  common_kitchens: number;
  common_stoves: number;
  utilities_included: boolean;
};

type PropertyImage = { id: string; image_url: string; sort_order: number; property_id: string };
type StaffProfile = { user_id: string; full_name: string };

const facilityKeys = [
  "has_garage", "has_internet", "has_dish", "has_security", "has_cctv",
  "has_lift", "has_generator", "has_parking", "has_gas_supply", "has_water_supply", "has_rooftop_access",
] as const;

const defaultForm = {
  name: "", property_type: "building", division: "", district: "", thana: "", area: "",
  house_number: "", road_number: "", sector: "", block: "",
  postal_code: "", nearest_police_station: "", nearest_fire_service: "", nearest_electricity_office: "",
  tolet_phone: "", map_url: "",
  has_garage: false, has_internet: false, has_dish: false, has_security: false, has_cctv: false,
  has_lift: false, has_generator: false, has_parking: false, has_gas_supply: false, has_water_supply: false, has_rooftop_access: false,
  common_bathrooms: 0, common_washrooms: 0, common_kitchens: 0, common_stoves: 0, utilities_included: false,
};

const Properties = () => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [sellDialogProperty, setSellDialogProperty] = useState<any>(null);

  const districts = form.division ? DISTRICTS[form.division] || [] : [];
  const thanas = form.district ? THANAS[form.district] || [] : [];

  const composeAddress = (f: typeof form) => {
    const parts: string[] = [];
    if (f.house_number) parts.push(`House ${f.house_number}`);
    if (f.road_number) parts.push(`Road ${f.road_number}`);
    if (f.block) parts.push(`Block ${f.block}`);
    if (f.sector) parts.push(`Sector ${f.sector}`);
    if (f.area) parts.push(f.area);
    if (f.thana) parts.push(f.thana);
    if (f.district) parts.push(f.district);
    if (f.division) parts.push(f.division);
    if (f.postal_code) parts.push(f.postal_code);
    return parts.join(", ");
  };

  const { data: properties, isLoading } = useQuery({
    queryKey: ["properties", effectiveOwnerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("owner_id", effectiveOwnerId!);
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: allPropertyImages } = useQuery({
    queryKey: ["property_images", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("property_images").select("*").order("sort_order");
      return (data || []) as PropertyImage[];
    },
    enabled: !!user,
  });

  // Fetch landlord's staff members
  const { data: staffMembers } = useQuery({
    queryKey: ["landlord_staff", effectiveOwnerId],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from("staff_assignments")
        .select("user_id")
        .eq("landlord_id", effectiveOwnerId!)
        .eq("scope", "landlord");
      if (!assignments?.length) return [] as StaffProfile[];
      const userIds = assignments.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      return (profiles || []) as StaffProfile[];
    },
    enabled: !!effectiveOwnerId,
  });

  // Fetch property_staff assignments for all properties
  const { data: allPropertyStaff } = useQuery({
    queryKey: ["property_staff", effectiveOwnerId],
    queryFn: async () => {
      const client = supabase as any;
      const { data } = await client.from("property_staff").select("*").eq("owner_id", effectiveOwnerId!);
      return (data || []) as { id: string; property_id: string; staff_user_id: string; owner_id: string }[];
    },
    enabled: !!effectiveOwnerId,
  });

  const getStaffForProperty = (propertyId: string) =>
    (allPropertyStaff || []).filter(ps => ps.property_id === propertyId);

  // Fetch sale listings linked to properties
  const { data: propertySaleListings } = useQuery({
    queryKey: ["property-sale-listings", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("sale_listings").select("id, property_id, status").eq("owner_id", effectiveOwnerId!).not("property_id", "is", null);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  // Fetch pending incoming transfers for the buyer
  const { data: pendingTransfers } = useQuery({
    queryKey: ["pending-transfers", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("property_transfers")
        .select("*, sale_listings:source_listing_id(title, price, sale_scope, property_type)")
        .eq("to_user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const [acceptingTransfer, setAcceptingTransfer] = useState<string | null>(null);

  const handleTransferAction = async (transferId: string, action: "accept" | "reject") => {
    setAcceptingTransfer(transferId);
    try {
      const { data, error } = await supabase.functions.invoke("transfer-property", {
        body: {
          transfer_id: transferId,
          mode: action === "accept" ? "complete_buyer" : "reject_buyer",
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(action === "accept"
        ? (language === "bn" ? "প্রপার্টি গ্রহণ করা হয়েছে!" : "Property accepted!")
        : (language === "bn" ? "প্রপার্টি প্রত্যাখ্যান করা হয়েছে" : "Transfer rejected"));
      queryClient.invalidateQueries({ queryKey: ["pending-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAcceptingTransfer(null);
    }
  };

  const propertyHasSaleListing = (propertyId: string) => propertySaleListings?.some((sl: any) => sl.property_id === propertyId && sl.status === "active");

  const handleRemovePropertySale = async (propertyId: string) => {
    const listing = propertySaleListings?.find((sl: any) => sl.property_id === propertyId && sl.status === "active");
    if (listing) {
      await supabase.from("sale_listings").delete().eq("id", listing.id);
      toast.success(language === "bn" ? "বিক্রয় লিস্টিং সরানো হয়েছে" : "Sale listing removed");
      queryClient.invalidateQueries({ queryKey: ["property-sale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
    }
  };

  const getImagesForProperty = (propertyId: string) =>
    (allPropertyImages || []).filter((img) => img.property_id === propertyId);

  // Check if user is on trial-only (all subs have discount_percent = 100)
  const { data: userSubs } = useQuery({
    queryKey: ["user_subscriptions_for_property_limit", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, discount_percent, status")
        .eq("user_id", effectiveOwnerId!)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString());
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const isTrialOnly = userSubs && userSubs.length > 0 && userSubs.every(s => Number(s.discount_percent) >= 100);
  const trialPropertyLimit = 1;
  const propertyCount = properties?.length || 0;
  const canAddProperty = !isTrialOnly || propertyCount < trialPropertyLimit;

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      // Enforce trial property limit
      if (isTrialOnly && propertyCount >= trialPropertyLimit) {
        throw new Error(language === "bn" ? "ট্রায়াল পিরিয়ডে সর্বোচ্চ ১টি সম্পত্তি যোগ করা যায়। সাবস্ক্রিপশন কিনুন।" : "Trial allows max 1 property. Please subscribe for more.");
      }
      const facilityData = Object.fromEntries(facilityKeys.map(k => [k, values[k]]));
      const { data, error } = await supabase.from("properties").insert({
        name: values.name,
        address: composeAddress(values),
        property_type: values.property_type,
        division: values.division,
        district: values.district,
        thana: values.thana,
        area: values.area,
        house_number: values.house_number,
        road_number: values.road_number,
        sector: values.sector,
        block: values.block,
        postal_code: values.postal_code,
        nearest_police_station: values.nearest_police_station,
        nearest_fire_service: values.nearest_fire_service,
        nearest_electricity_office: values.nearest_electricity_office,
        owner_id: effectiveOwnerId!,
        tolet_phone: values.tolet_phone,
        map_url: values.map_url,
        ...facilityData,
        common_bathrooms: values.common_bathrooms,
        common_washrooms: values.common_washrooms,
        common_kitchens: values.common_kitchens,
        common_stoves: values.common_stoves,
        utilities_included: values.utilities_included,
      } as any).select("id").single();
      if (error) throw error;
      // Save staff assignments for new property
      if (selectedStaff.length > 0) {
        const client = supabase as any;
        await client.from("property_staff").insert(
          selectedStaff.map(sid => ({ property_id: data.id, staff_user_id: sid, owner_id: effectiveOwnerId! }))
        );
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property_images"] });
      queryClient.invalidateQueries({ queryKey: ["property_staff"] });
      setOpen(false);
      resetForm();
      toast.success(t("property.added") || "Property added");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form & { id: string }) => {
      const facilityData = Object.fromEntries(facilityKeys.map(k => [k, values[k]]));
      const { error } = await supabase.from("properties").update({
        name: values.name,
        address: composeAddress(values),
        property_type: values.property_type,
        division: values.division,
        district: values.district,
        thana: values.thana,
        area: values.area,
        house_number: values.house_number,
        road_number: values.road_number,
        sector: values.sector,
        block: values.block,
        postal_code: values.postal_code,
        nearest_police_station: values.nearest_police_station,
        nearest_fire_service: values.nearest_fire_service,
        nearest_electricity_office: values.nearest_electricity_office,
        tolet_phone: values.tolet_phone,
        map_url: values.map_url,
        ...facilityData,
        common_bathrooms: values.common_bathrooms,
        common_washrooms: values.common_washrooms,
        common_kitchens: values.common_kitchens,
        common_stoves: values.common_stoves,
        utilities_included: values.utilities_included,
      } as any).eq("id", values.id);
      if (error) throw error;
      const client = supabase as any;
      await client.from("property_staff").delete().eq("property_id", values.id);
      if (selectedStaff.length > 0) {
        await client.from("property_staff").insert(
          selectedStaff.map(sid => ({ property_id: values.id, staff_user_id: sid, owner_id: effectiveOwnerId! }))
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property_staff"] });
      setOpen(false);
      setEditing(null);
      resetForm();
      toast.success(t("property.updated") || "Property updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("properties").delete().eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission denied or property not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property_images"] });
      queryClient.invalidateQueries({ queryKey: ["property_staff"] });
      toast.success(t("property.deleted") || "Property deleted");
    },
    onError: (e) => {
      const msg = e?.message || "";
      if (msg.includes("rooms_property_id_fkey")) {
        toast.error(language === "bn" ? "এই সম্পত্তিতে রুম আছে। প্রথমে রুমগুলো মুছুন।" : "This property has rooms. Please delete the rooms first.");
      } else if (msg.includes("garages_property_id_fkey")) {
        toast.error(language === "bn" ? "এই সম্পত্তিতে গ্যারেজ আছে। প্রথমে গ্যারেজগুলো মুছুন।" : "This property has garages. Please delete the garages first.");
      } else {
        toast.error(msg);
      }
    },
  });

  const resetForm = () => { setForm(defaultForm); setSelectedStaff([]); };

  const openEdit = (p: Property) => {
    setEditing(p);
    setForm({
      name: p.name,
      property_type: p.property_type,
      division: p.division || "",
      district: p.district || "",
      thana: p.thana || "",
      area: p.area || "",
      house_number: p.house_number || "",
      road_number: p.road_number || "",
      sector: p.sector || "",
      block: p.block || "",
      postal_code: p.postal_code || "",
      nearest_police_station: p.nearest_police_station || "",
      nearest_fire_service: p.nearest_fire_service || "",
      nearest_electricity_office: p.nearest_electricity_office || "",
      tolet_phone: (p as any).tolet_phone || "",
      map_url: (p as any).map_url || "",
      has_garage: !!p.has_garage, has_internet: !!p.has_internet, has_dish: !!p.has_dish,
      has_security: !!p.has_security, has_cctv: !!p.has_cctv, has_lift: !!p.has_lift,
      has_generator: !!p.has_generator, has_parking: !!p.has_parking, has_gas_supply: !!p.has_gas_supply,
      has_water_supply: !!p.has_water_supply, has_rooftop_access: !!p.has_rooftop_access,
      common_bathrooms: (p as any).common_bathrooms || 0,
      common_washrooms: (p as any).common_washrooms || 0,
      common_kitchens: (p as any).common_kitchens || 0,
      common_stoves: (p as any).common_stoves || 0,
      utilities_included: !!(p as any).utilities_included,
    });
    setSelectedStaff(getStaffForProperty(p.id).map(ps => ps.staff_user_id));
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate mandatory address fields
    if (!form.house_number.trim()) {
      toast.error(language === "bn" ? "বাড়ি/হোল্ডিং নম্বর দিতে হবে" : "House/Holding number is required");
      return;
    }
    if (!form.division) {
      toast.error(language === "bn" ? "বিভাগ নির্বাচন করতে হবে" : "Division is required");
      return;
    }
    if (!form.district) {
      toast.error(language === "bn" ? "জেলা নির্বাচন করতে হবে" : "District is required");
      return;
    }
    if (!form.thana) {
      toast.error(language === "bn" ? "থানা/উপজেলা নির্বাচন করতে হবে" : "Thana is required");
      return;
    }
    if (!form.postal_code.trim()) {
      toast.error(language === "bn" ? "পোস্টাল কোড দিতে হবে" : "Postal code is required");
      return;
    }
    if (editing) {
      updateMutation.mutate({ ...form, id: editing.id });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleImageUploaded = async (url: string, propertyId: string) => {
    const images = getImagesForProperty(propertyId);
    await supabase.from("property_images").insert({
      property_id: propertyId,
      image_url: url,
      sort_order: images.length,
    });
    queryClient.invalidateQueries({ queryKey: ["property_images"] });
  };

  const handleImageRemoved = async (imgId: string, url: string) => {
    const path = url.split("/property-images/")[1];
    if (path) {
      await supabase.storage.from("property-images").remove([path]);
    }
    await supabase.from("property_images").delete().eq("id", imgId);
    queryClient.invalidateQueries({ queryKey: ["property_images"] });
  };

  const toggleStaff = (userId: string) => {
    setSelectedStaff(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const typeLabels: Record<string, string> = {
    building: t("property.building") || "Building",
    house: t("property.house") || "House",
    
    shop: t("property.shop") || "Shop",
    tin_shed: language === "bn" ? "টিনশেড / কমন" : "Tin Shed / Common",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("nav.properties")}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("property.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? (t("common.edit") + " " + t("nav.properties")) : t("property.add")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("property.name")}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>{t("property.type")}</Label>
                <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="building">{typeLabels.building}</SelectItem>
                    <SelectItem value="house">{typeLabels.house}</SelectItem>
                    
                    <SelectItem value="shop">{typeLabels.shop}</SelectItem>
                    <SelectItem value="tin_shed">{typeLabels.tin_shed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Structured Address */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("property.division")} *</Label>
                  <Select value={form.division} onValueChange={v => setForm(f => ({ ...f, division: v, district: "", thana: "" }))}>
                    <SelectTrigger><SelectValue placeholder={t("property.division")} /></SelectTrigger>
                    <SelectContent>
                      {DIVISIONS.map(d => <SelectItem key={d} value={d}>{getBnLabel(DIVISIONS_BN, d, language)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("property.district")} *</Label>
                  <Select value={form.district} onValueChange={v => setForm(f => ({ ...f, district: v, thana: "" }))} disabled={!form.division}>
                    <SelectTrigger><SelectValue placeholder={t("property.district")} /></SelectTrigger>
                    <SelectContent>
                      {districts.map(d => <SelectItem key={d} value={d}>{getBnLabel(DISTRICTS_BN, d, language)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("property.thana")}</Label>
                  <Select value={form.thana} onValueChange={v => setForm(f => ({ ...f, thana: v }))} disabled={!form.district}>
                    <SelectTrigger><SelectValue placeholder={t("property.thana")} /></SelectTrigger>
                    <SelectContent>
                      {thanas.map(th => <SelectItem key={th} value={th}>{getBnLabel(THANAS_BN, th, language)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("property.area")}</Label>
                  <Input
                    value={form.area}
                    onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    placeholder={t("property.area")}
                  />
                </div>
              </div>

              {/* House/Road/Block/Sector/Postal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("property.house_number")}</Label>
                  <Input
                    value={form.house_number}
                    onChange={e => setForm(f => ({ ...f, house_number: e.target.value }))}
                    placeholder={t("property.house_number")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("property.road_number")}</Label>
                  <Input
                    value={form.road_number}
                    onChange={e => setForm(f => ({ ...f, road_number: e.target.value }))}
                    placeholder={t("property.road_number")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("property.block")}</Label>
                  <Input
                    value={form.block}
                    onChange={e => setForm(f => ({ ...f, block: e.target.value }))}
                    placeholder={t("property.block")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("property.sector")}</Label>
                  <Input
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    placeholder={t("property.sector")}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>{t("property.postal_code")}</Label>
                  <Input
                    value={form.postal_code}
                    onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
                    placeholder={t("property.postal_code")}
                  />
                </div>
              </div>

              {/* Nearby Services */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">{t("property.nearby_services")}</Label>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      {t("property.nearest_police")}
                    </Label>
                    <Input
                      value={form.nearest_police_station}
                      onChange={e => setForm(f => ({ ...f, nearest_police_station: e.target.value }))}
                      placeholder={t("property.nearest_police")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <Flame className="h-3.5 w-3.5 text-destructive" />
                      {t("property.nearest_fire")}
                    </Label>
                    <Input
                      value={form.nearest_fire_service}
                      onChange={e => setForm(f => ({ ...f, nearest_fire_service: e.target.value }))}
                      placeholder={t("property.nearest_fire")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm">
                      <Zap className="h-3.5 w-3.5 text-accent-foreground" />
                      {t("property.nearest_electricity")}
                    </Label>
                    <Input
                      value={form.nearest_electricity_office}
                      onChange={e => setForm(f => ({ ...f, nearest_electricity_office: e.target.value }))}
                      placeholder={t("property.nearest_electricity")}
                    />
                  </div>
                </div>
              </div>

              {/* To-Let Contact Number */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {language === "bn" ? "টু-লেট যোগাযোগ নম্বর" : "To-Let Contact Number"}
                </Label>
                <Input
                  value={form.tolet_phone}
                  onChange={e => setForm(f => ({ ...f, tolet_phone: e.target.value }))}
                  placeholder={language === "bn" ? "যেমন: 01812345678" : "e.g. 01812345678"}
                />
                <p className="text-xs text-muted-foreground">{language === "bn" ? "খালি রাখলে আপনার প্রোফাইলের নম্বর ব্যবহার হবে" : "Leave empty to use your profile phone"}</p>
               </div>

              {/* Google Maps URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Map className="h-3.5 w-3.5 text-primary" />
                  {language === "bn" ? "গুগল ম্যাপ লিংক" : "Google Maps Link"}
                </Label>
                <Input
                  value={form.map_url}
                  onChange={e => setForm(f => ({ ...f, map_url: e.target.value }))}
                  placeholder={language === "bn" ? "গুগল ম্যাপ URL পেস্ট করুন" : "Paste Google Maps URL"}
                />
                <p className="text-xs text-muted-foreground">{language === "bn" ? "আপনার সম্পত্তির গুগল ম্যাপ লিংক যোগ করুন" : "Add your property's Google Maps location link"}</p>
              </div>

              {/* Facilities */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{language === "bn" ? "সুবিধাসমূহ" : "Facilities"}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allChecked = facilityKeys.every(k => !!form[k]);
                      const update: any = {};
                      facilityKeys.forEach(k => { update[k] = !allChecked; });
                      setForm(f => ({ ...f, ...update }));
                    }}
                  >
                    {facilityKeys.every(k => !!form[k])
                      ? (language === "bn" ? "সব বাদ দিন" : "Unmark All")
                      : (language === "bn" ? "সব নির্বাচন" : "Mark All")}
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    ["has_garage", language === "bn" ? "গ্যারেজ" : "Garage", Car],
                    ["has_internet", language === "bn" ? "ইন্টারনেট" : "Internet", Wifi],
                    ["has_dish", language === "bn" ? "ডিশ/ক্যাবল" : "Dish/Cable", Tv],
                    ["has_security", language === "bn" ? "সিকিউরিটি" : "Security", Shield],
                    ["has_cctv", language === "bn" ? "সিসিটিভি" : "CCTV", Camera],
                    ["has_lift", language === "bn" ? "লিফট" : "Lift/Elevator", ArrowUpFromLine],
                    ["has_generator", language === "bn" ? "জেনারেটর" : "Generator", BatteryCharging],
                    ["has_parking", language === "bn" ? "পার্কিং" : "Parking", Car],
                    ["has_gas_supply", language === "bn" ? "গ্যাস সাপ্লাই" : "Gas Supply", Fuel],
                    ["has_water_supply", language === "bn" ? "পানি সাপ্লাই" : "Water Supply", Droplets],
                    ["has_rooftop_access", language === "bn" ? "ছাদ" : "Rooftop", Home],
                  ] as [keyof typeof form, string, any][]).map(([key, label, Icon]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`fac-${key}`}
                        checked={!!form[key]}
                        onCheckedChange={(v) => setForm(f => ({ ...f, [key]: !!v }))}
                      />
                      <label htmlFor={`fac-${key}`} className="text-sm cursor-pointer flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Facilities - only for Tin Shed */}
              {form.property_type === "tin_shed" && (
                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                  <Label className="text-base font-semibold">
                    {language === "bn" ? "🔁 কমন সুবিধাসমূহ" : "🔁 Common Facilities"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "এই সুবিধাগুলো সব রুমের জন্য শেয়ার্ড" : "These facilities are shared across all rooms"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm">{language === "bn" ? "বাথরুম সংখ্যা" : "Bathrooms"}</Label>
                      <Input type="number" min="0" value={form.common_bathrooms} onChange={e => setForm(f => ({ ...f, common_bathrooms: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{language === "bn" ? "ওয়াশরুম সংখ্যা" : "Washrooms"}</Label>
                      <Input type="number" min="0" value={form.common_washrooms} onChange={e => setForm(f => ({ ...f, common_washrooms: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{language === "bn" ? "রান্নাঘর সংখ্যা" : "Kitchens"}</Label>
                      <Input type="number" min="0" value={form.common_kitchens} onChange={e => setForm(f => ({ ...f, common_kitchens: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">{language === "bn" ? "চুলা সংখ্যা" : "Stoves (Chula)"}</Label>
                      <Input type="number" min="0" value={form.common_stoves} onChange={e => setForm(f => ({ ...f, common_stoves: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm font-medium">{language === "bn" ? "ইউটিলিটি অন্তর্ভুক্ত" : "Utilities Included"}</Label>
                      <p className="text-xs text-muted-foreground">
                        {language === "bn" ? "গ্যাস, পানি, বিদ্যুৎ ভাড়ায় অন্তর্ভুক্ত" : "Gas, water, electricity included in rent"}
                      </p>
                    </div>
                    <Switch
                      checked={form.utilities_included}
                      onCheckedChange={(checked) => setForm(f => ({ ...f, utilities_included: checked }))}
                    />
                  </div>
                </div>
              )}

              {(staffMembers && staffMembers.length > 0) && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {t("property.assign_staff")}
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                    {staffMembers.map(staff => (
                      <div key={staff.user_id} className="flex items-center gap-2">
                        <Checkbox
                          id={`staff-${staff.user_id}`}
                          checked={selectedStaff.includes(staff.user_id)}
                          onCheckedChange={() => toggleStaff(staff.user_id)}
                        />
                        <label htmlFor={`staff-${staff.user_id}`} className="text-sm cursor-pointer">
                          {staff.full_name || staff.user_id}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images - only when editing */}
              {editing && (
                <div className="space-y-2">
                  <Label>{t("image.upload") || "Images"} ({t("image.max_3") || "Max 3"})</Label>
                  <ImageUploader
                    maxImages={3}
                    existingImages={getImagesForProperty(editing.id)}
                    bucketPath={`${user?.id}/${editing.id}`}
                    onImageUploaded={(url) => handleImageUploaded(url, editing.id)}
                    onImageRemoved={handleImageRemoved}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditing(null); resetForm(); }}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Incoming Transfers */}
      {pendingTransfers && pendingTransfers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            {language === "bn" ? "হ্যান্ডওভার পেন্ডিং" : "Pending Transfers"}
          </h2>
          {pendingTransfers.map((t: any) => {
            const listing = t.sale_listings;
            return (
              <Card key={t.id} className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{listing?.title || "Property Transfer"}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {t.transfer_scope === "unit"
                            ? (language === "bn" ? "ইউনিট" : "Unit")
                            : (language === "bn" ? "সম্পূর্ণ প্রপার্টি" : "Full Property")}
                        </Badge>
                        {t.transfer_scope === "unit" && (
                          <Badge variant="outline" className={`text-[10px] gap-1 ${t.include_tenants ? "border-green-300 text-green-700" : "border-orange-300 text-orange-700"}`}>
                            {t.include_tenants
                              ? <><UserCheck className="h-3 w-3" /> {language === "bn" ? "ভাড়াটিয়া সহ" : "With Tenants"}</>
                              : <><UserX className="h-3 w-3" /> {language === "bn" ? "ভাড়াটিয়া ছাড়া" : "Without Tenants"}</>}
                          </Badge>
                        )}
                        {listing?.price && (
                          <span className="text-xs text-primary font-bold">৳ {Number(listing.price).toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === "bn"
                          ? "আপনার জন্য একটি প্রপার্টি হ্যান্ডওভার পেন্ডিং আছে"
                          : "You have a pending property transfer"}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={acceptingTransfer === t.id}
                        onClick={() => handleTransferAction(t.id, "accept")}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {language === "bn" ? "গ্রহণ" : "Accept"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                        disabled={acceptingTransfer === t.id}
                        onClick={() => handleTransferAction(t.id, "reject")}
                      >
                        <X className="h-3.5 w-3.5" />
                        {language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6 h-32 animate-pulse bg-muted" /></Card>
          ))}
        </div>
      ) : properties?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("property.empty") || "No properties yet. Add your first property!"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties?.map((p) => {
            const coverImage = getImagesForProperty(p.id)?.[0];
            const assignedStaff = getStaffForProperty(p.id);
            const assignedStaffNames = assignedStaff
              .map(ps => staffMembers?.find(s => s.user_id === ps.staff_user_id)?.full_name)
              .filter(Boolean);
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow overflow-hidden">
                {coverImage && (
                  <div className="h-36 overflow-hidden">
                    <img src={coverImage.image_url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4">
                  {/* Header: icon + name + type badge */}
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-base truncate flex-1">{p.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                      {typeLabels[p.property_type] || p.property_type}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5 ml-8">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {[p.house_number ? `House ${p.house_number}` : "", p.road_number ? `Road ${p.road_number}` : "", p.block ? `Block ${p.block}` : "", p.sector ? `Sector ${p.sector}` : "", p.area, p.thana ? getBnLabel(THANAS_BN, p.thana, language) : "", p.district ? getBnLabel(DISTRICTS_BN, p.district, language) : "", p.division ? getBnLabel(DIVISIONS_BN, p.division, language) : "", p.postal_code || ""].filter(Boolean).join(", ") || p.address || "—"}
                    </span>
                  </div>

                  {/* Tin shed extras */}
                  {p.property_type === "tin_shed" && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-8">
                      <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300">
                        🏠 {language === "bn" ? "টিনশেড" : "Tin Shed"}
                      </Badge>
                      {(p as any).utilities_included && (
                        <Badge variant="outline" className="text-[10px] font-normal border-emerald-400 text-emerald-700 dark:text-emerald-400">
                          ⚡ {language === "bn" ? "ইউটিলিটি অন্তর্ভুক্ত" : "Utilities Included"}
                        </Badge>
                      )}
                      {(p as any).common_bathrooms > 0 && <Badge variant="secondary" className="text-[10px]">🚿 {(p as any).common_bathrooms}</Badge>}
                      {(p as any).common_washrooms > 0 && <Badge variant="secondary" className="text-[10px]">🚻 {(p as any).common_washrooms}</Badge>}
                      {(p as any).common_kitchens > 0 && <Badge variant="secondary" className="text-[10px]">🍳 {(p as any).common_kitchens}</Badge>}
                      {(p as any).common_stoves > 0 && <Badge variant="secondary" className="text-[10px]">🔥 {(p as any).common_stoves}</Badge>}
                    </div>
                  )}

                  {/* Facilities + Nearby — compact, max 2 lines */}
                  {(() => {
                    const facs = [
                      [p.has_garage, language === "bn" ? "গ্যারেজ" : "Garage"],
                      [p.has_internet, language === "bn" ? "ইন্টারনেট" : "Internet"],
                      [p.has_dish, language === "bn" ? "ডিশ" : "Dish"],
                      [p.has_security, language === "bn" ? "সিকিউরিটি" : "Security"],
                      [p.has_cctv, "CCTV"],
                      [p.has_lift, language === "bn" ? "লিফট" : "Lift"],
                      [p.has_generator, language === "bn" ? "জেনারেটর" : "Generator"],
                      [p.has_parking, language === "bn" ? "পার্কিং" : "Parking"],
                      [p.has_gas_supply, language === "bn" ? "গ্যাস" : "Gas"],
                      [p.has_water_supply, language === "bn" ? "পানি" : "Water"],
                      [p.has_rooftop_access, language === "bn" ? "ছাদ" : "Roof"],
                    ].filter(([v]) => v) as [boolean, string][];
                    const services = [
                      p.nearest_police_station && `🛡 ${p.nearest_police_station}`,
                      p.nearest_fire_service && `🔥 ${p.nearest_fire_service}`,
                      p.nearest_electricity_office && `⚡ ${p.nearest_electricity_office}`,
                    ].filter(Boolean) as string[];
                    const all = [...facs.map(([, l]) => l), ...services];
                    return all.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2 ml-8 max-h-[3rem] overflow-hidden">
                        {facs.map(([, label]) => (
                          <Badge key={label} variant="outline" className="text-[10px] font-normal">{label}</Badge>
                        ))}
                        {services.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Staff */}
                  {assignedStaffNames.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 ml-8 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{assignedStaffNames.join(", ")}</span>
                    </div>
                  )}

                  {/* Bottom actions row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    {propertyHasSaleListing(p.id) ? (
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7 border-emerald-500 text-emerald-600" onClick={() => handleRemovePropertySale(p.id)}>
                        <ShoppingBag className="h-3 w-3" />
                        {language === "bn" ? "বিক্রয় সরান" : "Remove Sale"}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1 text-xs h-7 border-primary text-primary" onClick={() => setSellDialogProperty(p)}>
                        <ShoppingBag className="h-3 w-3" />
                        {language === "bn" ? "বিক্রয় করুন" : "Sell"}
                      </Button>
                    )}
                    <div className="flex gap-0.5">
                      <PropertyHistoryDialog propertyId={p.id} propertyName={p.name} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}
        isPending={deleteMutation.isPending}
      />

      {/* Sell Dialog */}
      <SellDialog
        open={!!sellDialogProperty}
        onOpenChange={(v) => { if (!v) setSellDialogProperty(null); }}
        sourceType="property"
        sourceData={sellDialogProperty}
      />
    </div>
  );
};

const PropertiesPage = () => (
  <PermissionGuard permission="view_properties">
    <Properties />
  </PermissionGuard>
);

export default PropertiesPage;
