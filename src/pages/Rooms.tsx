import { useState, useMemo } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { format, startOfMonth, addMonths } from "date-fns";
import { CalendarIcon, Building2, Flame, Rocket, CheckCircle, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { DoorOpen, Pencil, Trash2, Package, Megaphone, AlertTriangle, Home, Store } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import RoomFormDialog, { RoomFormData, getDefaultForm, formFromRoom } from "@/components/rooms/RoomFormDialog";
import BulkRoomAddDialog from "@/components/rooms/BulkRoomAddDialog";
import RoomAmenityBadges from "@/components/rooms/RoomAmenityBadges";
import BulkRoomManageDialog from "@/components/rooms/BulkRoomManageDialog";
import { SellDialog } from "@/components/sale/SellDialog";

const Rooms = () => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toletConfirmRoom, setToletConfirmRoom] = useState<any>(null);
  const [boostDialogRoom, setBoostDialogRoom] = useState<any>(null);
  const [selectedBoostType, setSelectedBoostType] = useState<"3_day" | "7_day">("3_day");
  const [boostApplying, setBoostApplying] = useState(false);
  const [sellDialogRoom, setSellDialogRoom] = useState<any>(null);
  const [sellDialogProperty, setSellDialogProperty] = useState<any>(null);

  const { data: subscriptions } = useQuery({
    queryKey: ["user_subscriptions", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", effectiveOwnerId!)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString());
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: boostBalances } = useQuery({
    queryKey: ["boost_balances", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("boost_balances").select("*").eq("user_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: activeBoosts } = useQuery({
    queryKey: ["room_boosts", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("room_boosts").select("*").eq("owner_id", effectiveOwnerId!).gt("expires_at", new Date().toISOString());
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: properties } = useQuery({
    queryKey: ["properties", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("id, name").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms", effectiveOwnerId, selectedProperty],
    queryFn: async () => {
      let query = supabase.from("rooms").select("*, properties!inner(name, owner_id)").eq("properties.owner_id", effectiveOwnerId!);
      if (selectedProperty !== "all") query = query.eq("property_id", selectedProperty);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  // Fetch active tenants to cross-reference room occupancy
  const { data: activeTenants } = useQuery({
    queryKey: ["tenants-room-check", effectiveOwnerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("id, room_id, status").eq("owner_id", effectiveOwnerId!).eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  // Fetch sale listings linked to rooms
  const { data: roomSaleListings } = useQuery({
    queryKey: ["room-sale-listings", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("sale_listings").select("id, room_id, status").eq("owner_id", effectiveOwnerId!).not("room_id", "is", null);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  // Helper: check if a room is effectively occupied (status OR has active tenant assigned)
  const isRoomOccupied = (room: any) => {
    if (room.status === "occupied" || room.status === "partially_occupied") return true;
    if (room.tenant_id) return true;
    return activeTenants?.some(t => t.room_id === room.id) || false;
  };

  const formToPayload = (form: RoomFormData) => {
    const base: any = {
      room_number: form.room_number,
      room_type: form.room_type,
      floor: Number(form.floor),
      rent_amount: Number(form.rent_amount),
      property_id: form.property_id,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      has_drawing_room: form.has_drawing_room,
      has_dining_room: form.has_dining_room,
      has_kitchen: form.has_kitchen,
      balconies: Number(form.balconies),
      has_roof_access: form.has_roof_access,
      area_sqft: Number(form.area_sqft),
      description: form.description,
    };
    if (form.status) base.status = form.status;
    return base;
  };

  const createMutation = useMutation({
    mutationFn: async (form: RoomFormData) => {
      const payload = formToPayload(form);

      // Check current active room count vs slots to determine status
      const { data: currentRooms } = await supabase
        .from("rooms")
        .select("id, status, properties!inner(owner_id)")
        .eq("properties.owner_id", effectiveOwnerId!)
        .neq("status", "inactive");
      const activeCount = currentRooms?.length || 0;

      const { data: activeSubs } = await supabase
        .from("user_subscriptions")
        .select("room_count")
        .eq("user_id", effectiveOwnerId!)
        .eq("product_type", "room_management")
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString());
      const paidSlots = (activeSubs || []).reduce((sum, s) => sum + s.room_count, 0);

      const totalSlots = paidSlots;

      const isOverLimit = activeCount >= totalSlots;
      const insertPayload = isOverLimit ? { ...payload, status: "inactive" } : payload;

      const { data: roomData, error } = await supabase.from("rooms").insert(insertPayload).select();
      if (error) throw error;

      // Auto to-let logic only for non-inactive rooms
      if (roomData && roomData[0] && !isOverLimit) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("auto_tolet")
            .eq("user_id", effectiveOwnerId!)
            .single();

          if (profileData?.auto_tolet) {
            const { data: subs } = await supabase
              .from("user_subscriptions")
              .select("tolet_count")
              .eq("user_id", effectiveOwnerId!)
              .eq("product_type", "tolet")
              .eq("status", "active")
              .gte("expires_at", new Date().toISOString());

            if (subs && subs.some(s => s.tolet_count > 0)) {
              await supabase.from("rooms").update({ is_tolet: true }).eq("id", roomData[0].id);
            }
          }
        } catch {
          // Non-critical
        }
      }

      return isOverLimit;
    },
    onSuccess: (isOverLimit) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["user_subscriptions"] });
      setOpen(false);
      setEditing(null);
      if (isOverLimit) {
        toast.warning(t("room.activate_no_balance") || "No room balance. Room added as inactive.");
      } else {
        toast.success(t("room.added") || "Room added");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ form, id }: { form: RoomFormData; id: string }) => {
      const { error } = await supabase.from("rooms").update(formToPayload(form)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
      setEditing(null);
      toast.success(t("room.updated") || "Room updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("rooms").delete().eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission denied or room not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("room.deleted") || "Room deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleToLetMutation = useMutation({
    mutationFn: async ({ id, is_tolet, available_from }: { id: string; is_tolet: boolean; available_from?: string | null }) => {
      const updatePayload: any = { is_tolet };
      if (!is_tolet) {
        updatePayload.available_from = null;
      } else {
        updatePayload.tolet_slot_used = true;
        if (available_from) {
          updatePayload.available_from = available_from;
        }
      }
      const { data, error } = await supabase.from("rooms").update(updatePayload).eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Permission denied or room not found");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("tolet.updated") || "To-Let status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSubmit = (form: RoomFormData) => {
    if (editing) {
      updateMutation.mutate({ form, id: editing.id });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleToggleToLet = (room: any, checked: boolean) => {
    if (checked) {
      // Show confirmation dialog before publishing
      setToletConfirmRoom(room);
    } else {
      // Unpublishing — no balance consumed, proceed directly
      toggleToLetMutation.mutate({ id: room.id, is_tolet: false, available_from: null });
    }
  };

  const confirmPublishToLet = () => {
    if (!toletConfirmRoom) return;
    const room = toletConfirmRoom;
    if (room.status === "occupied") {
      const nextMonth = startOfMonth(addMonths(new Date(), 1));
      const dateStr = format(nextMonth, "yyyy-MM-dd");
      toggleToLetMutation.mutate({ id: room.id, is_tolet: true, available_from: dateStr });
    } else {
      toggleToLetMutation.mutate({ id: room.id, is_tolet: true, available_from: null });
    }
    setToletConfirmRoom(null);
  };

  const handleAvailableFromChange = (roomId: string, date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      supabase.from("rooms").update({ available_from: dateStr }).eq("id", roomId).select().then(({ error }) => {
        if (error) {
          toast.error(error.message);
        } else {
          queryClient.invalidateQueries({ queryKey: ["rooms"] });
          toast.success(t("tolet.date_updated") || "Available date updated");
        }
      });
    }
  };

  const roomTypeLabels: Record<string, string> = {
    room: t("room.type_room") || "Room",
    flat: t("room.type_flat") || "Flat",
    shop: t("room.type_shop") || "Shop",
  };

  // Calculate subscription balances — inactive rooms don't count toward used slots
  const roomSub = subscriptions?.filter(s => s.product_type === "room_management") || [];
  const toletSub = subscriptions?.filter(s => s.product_type === "tolet") || [];
  const totalRoomSlots = roomSub.reduce((sum, s) => sum + s.room_count, 0);
  const totalToletSlots = toletSub.reduce((sum, s) => sum + s.tolet_count, 0);
  const activeRooms = rooms?.filter((r: any) => r.status !== "inactive") || [];
  const totalRooms = activeRooms.length;
  const totalToletUsed = rooms?.filter((r: any) => r.tolet_slot_used).length || 0;
  const roomRemaining = Math.max(0, totalRoomSlots - totalRooms);
  const toletRemaining = Math.max(0, totalToletSlots - totalToletUsed);
  const hasRoomSub = totalRoomSlots > 0;

  const handleActivateRoom = async (roomId: string) => {
    if (roomRemaining > 0) {
      const { error } = await supabase.from("rooms").update({ status: "vacant" }).eq("id", roomId);
      if (error) {
        toast.error(error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
        queryClient.invalidateQueries({ queryKey: ["user_subscriptions"] });
        toast.success(t("room.activate") || "Room activated");
      }
    } else {
      toast.error(t("room.activate_no_balance") || "No room balance. Buy subscription to activate.");
      navigate("/subscription");
    }
  };

  const handleDeactivateRoom = async (roomId: string) => {
    const { error } = await supabase.from("rooms").update({ status: "inactive" }).eq("id", roomId);
    if (error) {
      toast.error(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("room.deactivate") || "Room deactivated");
    }
  };

  const handleApplyBoost = async () => {
    if (!boostDialogRoom || !user) return;
    setBoostApplying(true);
    try {
      const balances = (boostBalances || []).filter((b: any) => b.boost_type === selectedBoostType);
      const remaining = balances.reduce((s: number, b: any) => s + b.total_count - b.used_count, 0);
      if (remaining <= 0) {
        toast.error(t("boost.no_balance") || "No boost balance. Purchase from Subscription page.");
        navigate("/subscription?tab=boosting");
        return;
      }
      // Find first balance row with remaining
      const balRow = balances.find((b: any) => b.total_count - b.used_count > 0);
      if (!balRow) throw new Error("No balance");

      const days = selectedBoostType === "3_day" ? 3 : 7;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const { error: boostErr } = await supabase.from("room_boosts").insert({
        room_id: boostDialogRoom.id,
        owner_id: effectiveOwnerId!,
        boost_type: selectedBoostType,
        expires_at: expiresAt,
      });
      if (boostErr) throw boostErr;

      // Increment used_count
      await supabase.from("boost_balances").update({ used_count: balRow.used_count + 1 }).eq("id", balRow.id);

      toast.success(t("boost.applied") || "Boost applied successfully!");
      queryClient.invalidateQueries({ queryKey: ["boost_balances"] });
      queryClient.invalidateQueries({ queryKey: ["room_boosts"] });
      setBoostDialogRoom(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBoostApplying(false);
    }
  };

  const roomHasSaleListing = (roomId: string) => roomSaleListings?.some((sl: any) => sl.room_id === roomId && sl.status === "active");

  const getPropertyForRoom = (room: any) => {
    return properties?.find(p => p.id === room.property_id);
  };

  const handleRemoveSale = async (roomId: string) => {
    const listing = roomSaleListings?.find((sl: any) => sl.room_id === roomId && sl.status === "active");
    if (listing) {
      await supabase.from("sale_listings").delete().eq("id", listing.id);
      toast.success(language === "bn" ? "বিক্রয় লিস্টিং সরানো হয়েছে" : "Sale listing removed");
      queryClient.invalidateQueries({ queryKey: ["room-sale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
    }
  };

  const boostedRoomIds = new Set((activeBoosts || []).map((b: any) => b.room_id));
  const boost3Remaining = (boostBalances || []).filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.total_count - b.used_count, 0);
  const boost7Remaining = (boostBalances || []).filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.total_count - b.used_count, 0);
  const hasToletSub = toletSub.length > 0;

  // Sale listing balance
  const saleSub = subscriptions?.filter(s => s.product_type === "sale_listing") || [];
  const totalSaleSlots = saleSub.reduce((sum, s) => sum + ((s as any).sale_listing_count || 0), 0);
  const saleUsed = roomSaleListings?.filter((sl: any) => sl.status === "active").length || 0;
  const saleRemaining = Math.max(0, totalSaleSlots - saleUsed);
  const hasSaleSub = saleSub.length > 0;

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    if (!rooms) return { all: 0, vacant: 0, occupied: 0, inactive: 0, tolet: 0, sale: 0 };
    const occupiedRooms = rooms.filter((r: any) => isRoomOccupied(r));
    const saleRoomIds = new Set((roomSaleListings || []).filter((sl: any) => sl.status === "active").map((sl: any) => sl.room_id));
    return {
      all: rooms.length,
      vacant: rooms.filter((r: any) => r.status !== "inactive" && !isRoomOccupied(r)).length,
      occupied: occupiedRooms.length,
      inactive: rooms.filter((r: any) => r.status === "inactive").length,
      tolet: rooms.filter((r: any) => r.is_tolet === true).length,
      sale: rooms.filter((r: any) => saleRoomIds.has(r.id)).length,
    };
  }, [rooms, activeTenants]);

  // Group rooms by property with status filter
  const groupedRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    let filteredRooms = rooms;
    if (statusFilter === "vacant") filteredRooms = rooms.filter((r: any) => r.status !== "inactive" && !isRoomOccupied(r));
    else if (statusFilter === "occupied") filteredRooms = rooms.filter((r: any) => isRoomOccupied(r));
    else if (statusFilter === "inactive") filteredRooms = rooms.filter((r: any) => r.status === "inactive");
    else if (statusFilter === "tolet") filteredRooms = rooms.filter((r: any) => r.is_tolet === true);
    else if (statusFilter === "sale") {
      const saleRoomIds = new Set((roomSaleListings || []).filter((sl: any) => sl.status === "active").map((sl: any) => sl.room_id));
      filteredRooms = rooms.filter((r: any) => saleRoomIds.has(r.id));
    }
    const groups = new Map<string, { name: string; rooms: any[] }>();
    for (const r of filteredRooms) {
      const pid = r.property_id;
      if (!groups.has(pid)) {
        groups.set(pid, { name: r.properties?.name || "Unknown", rooms: [] });
      }
      groups.get(pid)!.rooms.push(r);
    }
    return Array.from(groups.entries()).map(([id, g]) => ({ propertyId: id, ...g }));
  }, [rooms, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("nav.rooms")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={t("common.filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("room.all_properties") || "All Properties"}</SelectItem>
              {properties?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Filter badges moved below header */}
          <BulkRoomAddDialog
            properties={properties || []}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })}
          />
          <BulkRoomManageDialog
            rooms={rooms || []}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })}
          />
          <RoomFormDialog
            open={open}
            onOpenChange={setOpen}
            editing={editing}
            properties={properties || []}
            onSubmit={handleSubmit}
            isPending={createMutation.isPending || updateMutation.isPending}
            onReset={() => setEditing(null)}
          />
        </div>
      </div>

      {/* Status Filter Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: "all", label: language === "bn" ? "সব" : "All", count: statusCounts.all },
          { key: "vacant", label: language === "bn" ? "খালি" : "Vacant", count: statusCounts.vacant },
          { key: "occupied", label: language === "bn" ? "ভাড়া দেওয়া" : "Occupied", count: statusCounts.occupied },
          { key: "inactive", label: language === "bn" ? "নিষ্ক্রিয়" : "Inactive", count: statusCounts.inactive },
          { key: "tolet", label: language === "bn" ? "টু-লেট" : "To-Let", count: statusCounts.tolet },
          { key: "sale", label: language === "bn" ? "কেনা-বেচা" : "Buy-Sell", count: statusCounts.sale },
        ] as const).map(({ key, label, count }) => (
          <Button
            key={key}
            variant={statusFilter === key ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5 rounded-full px-3"
            onClick={() => setStatusFilter(key)}
          >
            {label}
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-4 min-w-[18px] justify-center", statusFilter === key && "bg-primary-foreground/20 text-primary-foreground")}>
              {count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Subscription Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="font-medium text-xs sm:text-sm truncate">{t("room.room_slots") || "Room/Flat Slots"}</span>
              </div>
              {hasRoomSub ? (
                <Badge variant={roomRemaining <= 0 ? "destructive" : roomRemaining <= 2 ? "secondary" : "default"} className={cn("text-[10px] sm:text-xs w-fit px-1.5 py-0.5", roomRemaining <= 2 && roomRemaining > 0 && "bg-orange-500 text-white border-orange-500")}>
                  {roomRemaining <= 0 && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                  {roomRemaining} {t("room.remaining") || "remaining"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] sm:text-xs w-fit px-1.5 py-0.5">{t("room.no_subscription") || "No subscription"}</Badge>
              )}
            </div>
            {hasRoomSub ? (
              <>
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 space-y-0.5">
                  <div>{t("room.used_of") || "Used"} {totalRooms}/{totalRoomSlots}</div>
                  <div className="text-right">
                    {totalRooms > totalRoomSlots ? (
                      <span className="text-destructive font-medium">{t("room.over_limit") || "Over limit"}</span>
                    ) : (
                      <span>{Math.round((totalRooms / totalRoomSlots) * 100)}%</span>
                    )}
                  </div>
                </div>
                <Progress value={Math.min(100, (totalRooms / totalRoomSlots) * 100)} className="h-1.5 sm:h-2" />
              </>
            ) : (
              <Button variant="outline" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => navigate("/subscription")}>
                {t("room.buy_subscription") || "Buy Subscription"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-foreground shrink-0" />
                <span className="font-medium text-xs sm:text-sm truncate">{t("room.tolet_slots") || "To-Let Slots"}</span>
              </div>
              {hasToletSub ? (
                <Badge variant={toletRemaining <= 0 ? "destructive" : toletRemaining <= 2 ? "secondary" : "default"} className={cn("text-[10px] sm:text-xs w-fit px-1.5 py-0.5", toletRemaining <= 2 && toletRemaining > 0 && "bg-orange-500 text-white border-orange-500")}>
                  {toletRemaining <= 0 && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                  {toletRemaining} {t("room.remaining") || "remaining"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] sm:text-xs w-fit px-1.5 py-0.5">{t("room.no_subscription") || "No subscription"}</Badge>
              )}
            </div>
            {hasToletSub ? (
              <>
                <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
                  <span>{t("room.used_of") || "Used"} {totalToletUsed}/{totalToletSlots}</span>
                  {totalToletUsed > totalToletSlots ? (
                    <span className="text-destructive font-medium">{t("room.over_limit") || "Over limit"}</span>
                  ) : (
                    <span>{Math.round((totalToletUsed / totalToletSlots) * 100)}%</span>
                  )}
                </div>
                <Progress value={Math.min(100, (totalToletUsed / totalToletSlots) * 100)} className="h-1.5 sm:h-2" />
              </>
            ) : (
              <Button variant="outline" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => navigate("/subscription?tab=tolet")}>
                {t("room.buy_subscription") || "Buy Subscription"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 3-Day Boost Balance */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                <span className="font-medium text-xs sm:text-sm truncate">{t("boost.3day") || "3-Day Boost"}</span>
              </div>
              <Badge variant={boost3Remaining <= 0 ? "destructive" : "default"} className="text-[10px] sm:text-xs w-fit px-1.5 py-0.5">
                {boost3Remaining} {t("room.remaining") || "remaining"}
              </Badge>
            </div>
            {boost3Remaining > 0 ? (
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                {t("room.used_of") || "Used"} {(boostBalances || []).filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.used_count, 0)}/{(boostBalances || []).filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.total_count, 0)}
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => navigate("/subscription?tab=boosting")}>
                {t("room.buy_subscription") || "Buy Boost"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 7-Day Boost Balance */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                <span className="font-medium text-xs sm:text-sm truncate">{t("boost.7day") || "7-Day Boost"}</span>
              </div>
              <Badge variant={boost7Remaining <= 0 ? "destructive" : "default"} className="text-[10px] sm:text-xs w-fit px-1.5 py-0.5">
                {boost7Remaining} {t("room.remaining") || "remaining"}
              </Badge>
            </div>
            {boost7Remaining > 0 ? (
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                {t("room.used_of") || "Used"} {(boostBalances || []).filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.used_count, 0)}/{(boostBalances || []).filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.total_count, 0)}
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => navigate("/subscription?tab=boosting")}>
                {t("room.buy_subscription") || "Buy Boost"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sale Listing Slots */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-2.5 sm:p-4">
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                <span className="font-medium text-xs sm:text-sm truncate">{language === "bn" ? "বিক্রয় স্লট" : "Sale Listing Slots"}</span>
              </div>
              {hasSaleSub ? (
                <Badge variant={saleRemaining <= 0 ? "destructive" : "default"} className="text-[10px] sm:text-xs w-fit px-1.5 py-0.5">
                  {saleRemaining} {t("room.remaining") || "remaining"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] sm:text-xs w-fit px-1.5 py-0.5">{t("room.no_subscription") || "No subscription"}</Badge>
              )}
            </div>
            {hasSaleSub ? (
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                {t("room.used_of") || "Used"} {saleUsed}/{totalSaleSlots}
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => navigate("/subscription?tab=sale")}>
                {language === "bn" ? "স্লট কিনুন" : "Buy Slots"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6 h-28 animate-pulse bg-muted" /></Card>
          ))}
        </div>
      ) : rooms?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("room.empty") || "No rooms yet. Add a property first, then add rooms!"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedRooms.map((group, idx) => {
            const totalInGroup = group.rooms.length;
            const occupiedCount = hasRoomSub ? group.rooms.filter((r: any) => isRoomOccupied(r)).length : 0;
            const vacantCount = hasRoomSub ? group.rooms.filter((r: any) => r.status !== "inactive" && !isRoomOccupied(r)).length : 0;
            const inactiveCount = hasRoomSub ? group.rooms.filter((r: any) => r.status === "inactive").length : totalInGroup;

            return (
              <div key={group.propertyId}>
                {idx > 0 && <Separator className="mb-6" />}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold">{group.name}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{t("room.total_under_property") || "Total Rooms/Flats"}: <span className="font-semibold text-foreground">{totalInGroup}</span></span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{t("dashboard.vacant") || "Vacant"}: {vacantCount}</Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t("dashboard.occupied") || "Occupied"}: {occupiedCount}</Badge>
                    {inactiveCount > 0 && (
                      <Badge variant="outline" className="border-orange-400 text-orange-600 dark:text-orange-400">{t("room.inactive") || "Inactive"}: {inactiveCount}</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.rooms.map((r: any) => {
                    const isDeactivated = !hasRoomSub || r.status === "inactive";
                    return (
                    <Card key={r.id} className={cn("hover:shadow-md transition-shadow overflow-hidden", isDeactivated && "opacity-60")}>
                      {/* Default room type image/icon header */}
                      <div className={cn(
                        "flex items-center justify-center py-3",
                        r.room_type === "flat" ? "bg-blue-100 dark:bg-blue-900/30" :
                        r.room_type === "shop" ? "bg-purple-100 dark:bg-purple-900/30" :
                        "bg-emerald-100 dark:bg-emerald-900/30"
                      )}>
                        {r.room_type === "flat" ? (
                          <Home className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        ) : r.room_type === "shop" ? (
                          <Store className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <DoorOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{r.room_number}</span>
                            {isDeactivated ? (
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  {t("room.inactive") || "Inactive"}
                                </Badge>
                              ) : (
                                <>
                                  <Badge variant={isRoomOccupied(r) ? "default" : "secondary"}>
                                    {isRoomOccupied(r) ? t("dashboard.occupied") : t("dashboard.vacant")}
                                  </Badge>
                                  {r.is_tolet && isRoomOccupied(r) && r.available_from && (
                                    <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-600 dark:text-orange-400">
                                      To-Let {format(new Date(r.available_from), "dd MMM")}
                                    </Badge>
                                  )}
                                  {roomHasSaleListing(r.id) && (
                                    <Badge className="text-[10px] bg-emerald-600 text-white">
                                      {language === "bn" ? "বিক্রয়" : "For Sale"}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t("room.floor")} {r.floor}
                            </p>
                            <p className="text-sm font-medium mt-1">৳{Number(r.rent_amount).toLocaleString()}/{t("bill.month") || "month"}</p>
                            <RoomAmenityBadges room={r} compact />

                            {!hasRoomSub ? (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                  {t("room.subscription_expired") || "Subscription expired. Buy to activate rooms."}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 border-orange-500 text-orange-600 hover:bg-orange-50"
                                  onClick={() => navigate("/subscription")}
                                >
                                  {t("room.buy_subscription") || "Buy Subscription"}
                                </Button>
                              </div>
                            ) : r.status === "inactive" ? null : (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={!!r.is_tolet}
                                    onCheckedChange={(checked) => handleToggleToLet(r, checked)}
                                    className="scale-75 origin-left"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {r.is_tolet ? (t("tolet.published") || "To-Let Published") : (t("tolet.publish") || "Publish To-Let")}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {r.is_tolet && (
                                    <Button
                                      size="sm"
                                      className={cn("gap-1 text-xs h-7 px-2.5", boostedRoomIds.has(r.id) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white")}
                                      onClick={() => setBoostDialogRoom(r)}
                                      disabled={boostedRoomIds.has(r.id)}
                                    >
                                      {boostedRoomIds.has(r.id) ? <CheckCircle className="h-3 w-3" /> : <><Rocket className="h-3 w-3" /><Flame className="h-3 w-3" /></>}
                                      {boostedRoomIds.has(r.id) ? (t("boost.active") || "Boosted") : (t("boost.boost") || "Boost")}
                                    </Button>
                                  )}
                                  {roomHasSaleListing(r.id) ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 text-xs h-7 px-2.5 border-emerald-500 text-emerald-600"
                                      onClick={() => handleRemoveSale(r.id)}
                                    >
                                      <ShoppingBag className="h-3 w-3" />
                                      {language === "bn" ? "বিক্রয় সরান" : "Remove Sale"}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 text-xs h-7 px-2.5 border-primary text-primary"
                                      onClick={() => { setSellDialogRoom(r); setSellDialogProperty(getPropertyForRoom(r)); }}
                                    >
                                      <ShoppingBag className="h-3 w-3" />
                                      {language === "bn" ? "বিক্রয় করুন" : "Sell"}
                                    </Button>
                                  )}
                                </div>
                                {r.available_from && (
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground">
                                      {t("tolet.available_from") || "Available from"}: {format(new Date(r.available_from), "dd MMM yyyy")}
                                    </p>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <CalendarIcon className="h-3 w-3" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={new Date(r.available_from)}
                                          onSelect={(date) => date && handleAvailableFromChange(r.id, date)}
                                          disabled={(date) => date <= new Date()}
                                          className="pointer-events-auto"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r); setOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(r.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              </div>
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
      <AlertDialog open={!!toletConfirmRoom} onOpenChange={(open) => !open && setToletConfirmRoom(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tolet.confirm_publish") || "Publish to To-Let?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {toletRemaining <= 0 ? (
                <span className="text-destructive font-medium">{t("tolet.no_balance") || "No To-Let balance available"}</span>
              ) : (
                <>
                  <span className="block mb-2">{t("tolet.confirm_publish_msg") || "Are you sure you want to publish this room/flat on To-Let? This will use 1 slot from your balance."}</span>
                  <span className="font-semibold">{t("tolet.balance_left") || "To-Let balance remaining"}: {toletRemaining}</span>
                  <span className="block text-xs text-muted-foreground mt-1">{t("tolet.not_refundable") || "Balance is non-refundable after publishing"}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.no") || "No"}</AlertDialogCancel>
            {toletRemaining > 0 ? (
              <AlertDialogAction onClick={confirmPublishToLet}>{t("common.yes") || "Yes"}</AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={() => { setToletConfirmRoom(null); navigate("/subscription?tab=tolet"); }}>
                {t("tolet.add_balance") || "Add To-Let Balance"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boost Dialog */}
      <Dialog open={!!boostDialogRoom} onOpenChange={(v) => { if (!v) setBoostDialogRoom(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              {t("boost.apply_boost") || "Apply Boost"}
            </DialogTitle>
          </DialogHeader>
          {boostDialogRoom && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="font-semibold">{boostDialogRoom.room_number}</p>
                <p className="text-sm text-muted-foreground">৳{Number(boostDialogRoom.rent_amount).toLocaleString()}/{t("bill.month") || "month"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedBoostType === "3_day" ? "default" : "outline"}
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => setSelectedBoostType("3_day")}
                >
                  <span className="font-bold">3 {t("common.days") || "Days"}</span>
                  <span className="text-xs opacity-80">{boost3Remaining} {t("room.remaining") || "remaining"}</span>
                </Button>
                <Button
                  variant={selectedBoostType === "7_day" ? "default" : "outline"}
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => setSelectedBoostType("7_day")}
                >
                  <span className="font-bold">7 {t("common.days") || "Days"}</span>
                  <span className="text-xs opacity-80">{boost7Remaining} {t("room.remaining") || "remaining"}</span>
                </Button>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setBoostDialogRoom(null)}>{t("common.cancel") || "Cancel"}</Button>
                <Button onClick={handleApplyBoost} disabled={boostApplying || (selectedBoostType === "3_day" ? boost3Remaining <= 0 : boost7Remaining <= 0)}>
                  <Flame className="h-4 w-4 mr-2" />
                  {boostApplying ? "..." : (t("boost.apply") || "Apply Boost")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <SellDialog
        open={!!sellDialogRoom}
        onOpenChange={(v) => { if (!v) { setSellDialogRoom(null); setSellDialogProperty(null); } }}
        sourceType="room"
        sourceData={sellDialogRoom}
        propertyData={sellDialogProperty}
      />
    </div>
  );
};

const RoomsPage = () => (
  <PermissionGuard permission="view_rooms">
    <Rooms />
  </PermissionGuard>
);

export default RoomsPage;
