import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DollarSign, ShoppingCart, Users, Clock,
  Building2, MapPin, CheckCircle, XCircle, Loader2, Trash2, Plus, Search, Check, Percent, Gift, X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { format, differenceInDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number;
  product_type: string;
  room_count: number;
  tolet_count: number;
  duration_months: number;
  discount_percent: number;
  coupon_code: string | null;
  transaction_id: string | null;
  status: string;
  payment_method: string | null;
  created_at: string;
  profiles?: { full_name: string; phone: string } | null;
};

type SubRow = {
  id: string;
  user_id: string;
  product_type: string;
  room_count: number;
  tolet_count: number;
  duration_months: number;
  starts_at: string;
  expires_at: string | null;
  status: string;
  profiles?: { full_name: string; phone: string } | null;
};

type MonthlyData = { month: string; room: number; tolet: number };

const AdminSubscriptions = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"payments" | "subs">("payments");
  const [deleting, setDeleting] = useState(false);

  // Add Balance dialog state
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [landlords, setLandlords] = useState<{ user_id: string; full_name: string; phone: string }[]>([]);
  const [balanceUserId, setBalanceUserId] = useState("");
  const [balanceProductType, setBalanceProductType] = useState<"room_management" | "tolet" | "sale_listing" | "boost_3_day" | "boost_7_day">("room_management");
  const [balanceCount, setBalanceCount] = useState(1);
  const [balanceDuration, setBalanceDuration] = useState(1);
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);
  const [landlordSearchOpen, setLandlordSearchOpen] = useState(false);

  // Gift All dialog state
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftProductType, setGiftProductType] = useState<"room_management" | "tolet" | "sale_listing" | "boost_3_day" | "boost_7_day">("room_management");
  const [giftCount, setGiftCount] = useState(1);
  const [giftDuration, setGiftDuration] = useState(1);
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [giftProgress, setGiftProgress] = useState(0);
  const [giftTotal, setGiftTotal] = useState(0);

  // Discount management state
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [discountUserId, setDiscountUserId] = useState("");
  const [discountType, setDiscountType] = useState<"free_forever" | "percentage">("percentage");
  const [discountPercent, setDiscountPercent] = useState(30);
  const [discountNotes, setDiscountNotes] = useState("");
  const [discountSubmitting, setDiscountSubmitting] = useState(false);
  const [discountSearchOpen, setDiscountSearchOpen] = useState(false);
  const [discountListOpen, setDiscountListOpen] = useState(false);

  useEffect(() => {
    fetchData();
    fetchDiscounts();
  }, []);

  const fetchLandlords = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "landlord");
    if (!roles || roles.length === 0) return;
    const ids = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", ids);
    setLandlords(profiles || []);
  };

  const handleAddBalance = async () => {
    if (!balanceUserId) { toast.error(t("admin.select_landlord")); return; }
    setBalanceSubmitting(true);
    try {
      const isBoost = balanceProductType === "boost_3_day" || balanceProductType === "boost_7_day";
      const { data, error } = await supabase.functions.invoke("admin-add-balance", {
        body: {
          user_id: balanceUserId,
          product_type: balanceProductType,
          room_count: balanceProductType === "room_management" ? balanceCount : 0,
          tolet_count: balanceProductType === "tolet" ? balanceCount : 0,
          sale_listing_count: balanceProductType === "sale_listing" ? balanceCount : 0,
          duration_months: isBoost ? 0 : balanceDuration,
          boost_count: isBoost ? balanceCount : 0,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(t("admin.balance_added"));
      setBalanceOpen(false);
      setBalanceUserId("");
      setBalanceCount(1);
      setBalanceDuration(1);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add balance");
    } finally {
      setBalanceSubmitting(false);
    }
  };

  const handleGiftAll = async () => {
    if (landlords.length === 0) { toast.error("No landlords found"); return; }
    setGiftSubmitting(true);
    setGiftProgress(0);
    setGiftTotal(landlords.length);
    let success = 0;
    let fail = 0;
    const isBoost = giftProductType === "boost_3_day" || giftProductType === "boost_7_day";
    const batchSize = 5;
    for (let i = 0; i < landlords.length; i += batchSize) {
      const batch = landlords.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(l =>
          supabase.functions.invoke("admin-add-balance", {
            body: {
              user_id: l.user_id,
              product_type: giftProductType,
              room_count: giftProductType === "room_management" ? giftCount : 0,
              tolet_count: giftProductType === "tolet" ? giftCount : 0,
              sale_listing_count: giftProductType === "sale_listing" ? giftCount : 0,
              duration_months: isBoost ? 0 : giftDuration,
              boost_count: isBoost ? giftCount : 0,
            },
          })
        )
      );
      results.forEach(r => {
        if (r.status === "fulfilled" && !r.value.error && !r.value.data?.error) success++;
        else fail++;
      });
      setGiftProgress(Math.min(i + batchSize, landlords.length));
    }
    toast.success(`Gift completed: ${success} succeeded, ${fail} failed`);
    setGiftOpen(false);
    setGiftSubmitting(false);
    fetchData();
  };


  const fetchDiscounts = async () => {
    const { data } = await supabase
      .from("landlord_discounts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const ids = data.map((d: any) => d.user_id);
      const adminIds = [...new Set(data.map((d: any) => d.applied_by))];
      const allIds = [...new Set([...ids, ...adminIds])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", allIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setDiscounts(data.map((d: any) => ({
        ...d,
        landlord_profile: profileMap.get(d.user_id) || null,
        admin_profile: profileMap.get(d.applied_by) || null,
      })));
    } else {
      setDiscounts([]);
    }
  };

  const handleSaveDiscount = async () => {
    if (!discountUserId) { toast.error(t("admin.select_landlord")); return; }
    setDiscountSubmitting(true);
    try {
      const { error } = await supabase
        .from("landlord_discounts")
        .upsert({
          user_id: discountUserId,
          discount_type: discountType,
          discount_percent: discountType === "free_forever" ? 100 : discountPercent,
          applied_by: (await supabase.auth.getUser()).data.user?.id || "",
          notes: discountNotes,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success(t("admin.discount_saved"));
      setDiscountOpen(false);
      setDiscountUserId("");
      setDiscountNotes("");
      fetchDiscounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save discount");
    } finally {
      setDiscountSubmitting(false);
    }
  };

  const handleRemoveDiscount = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("landlord_discounts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(t("admin.discount_removed"));
      fetchDiscounts();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove discount");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [payRes, subRes] = await Promise.all([
      supabase
        .from("subscription_payments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    let payData = payRes.data as any[] || [];
    let subData = subRes.data as any[] || [];

    const userIds = [...new Set([...payData.map(p => p.user_id), ...subData.map(s => s.user_id)])];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      payData = payData.map(p => ({ ...p, profiles: profileMap.get(p.user_id) || null }));
      subData = subData.map(s => ({ ...s, profiles: profileMap.get(s.user_id) || null }));
    }

    setPayments(payData);
    setSubs(subData);
    setSelectedPayments(new Set());
    setSelectedSubs(new Set());
    setLoading(false);
  };

  const completed = payments.filter(p => p.status === "completed");
  const totalRevenue = completed.reduce((s, p) => s + Number(p.amount), 0);
  const roomRevenue = completed.filter(p => p.product_type === "room_management").reduce((s, p) => s + Number(p.amount), 0);
  const toletRevenue = completed.filter(p => p.product_type === "tolet").reduce((s, p) => s + Number(p.amount), 0);
  const activeSubs = subs.filter(s => s.status === "active" && s.expires_at && new Date(s.expires_at) > new Date()).length;
  const pendingCount = payments.filter(p => p.status === "pending").length;
  const manualPending = payments.filter(p => p.status === "manual_pending");

  const handleManualAction = async (paymentId: string, action: "approve" | "reject") => {
    setProcessingId(paymentId);
    try {
      const { data, error } = await supabase.functions.invoke("approve-manual-payment", {
        body: { payment_id: paymentId, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(action === "approve" ? "Payment approved & subscription activated!" : "Payment rejected.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget === "payments") {
        const ids = Array.from(selectedPayments);
        const { error } = await supabase
          .from("subscription_payments")
          .delete()
          .in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} payment(s) deleted`);
      } else {
        const ids = Array.from(selectedSubs);
        const { error } = await supabase
          .from("user_subscriptions")
          .delete()
          .in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} subscription(s) deleted`);
      }
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const togglePaymentSelection = (id: string) => {
    setSelectedPayments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllPayments = (data: PaymentRow[]) => {
    const allSelected = data.every(p => selectedPayments.has(p.id));
    if (allSelected) {
      setSelectedPayments(prev => {
        const next = new Set(prev);
        data.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedPayments(prev => {
        const next = new Set(prev);
        data.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  const toggleSubSelection = (id: string) => {
    setSelectedSubs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllSubs = (data: SubRow[]) => {
    const allSelected = data.every(s => selectedSubs.has(s.id));
    if (allSelected) {
      setSelectedSubs(prev => {
        const next = new Set(prev);
        data.forEach(s => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedSubs(prev => {
        const next = new Set(prev);
        data.forEach(s => next.add(s.id));
        return next;
      });
    }
  };

  const filteredPayments = (type?: string) => {
    let list = payments;
    if (type) list = list.filter(p => p.product_type === type);
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    return list;
  };

  const activeSorted = subs
    .filter(s => s.status === "active" && s.expires_at && new Date(s.expires_at) > new Date());

  const monthlyData: MonthlyData[] = (() => {
    const map = new Map<string, { room: number; tolet: number }>();
    completed.forEach(p => {
      const m = format(new Date(p.created_at), "yyyy-MM");
      const cur = map.get(m) || { room: 0, tolet: 0 };
      if (p.product_type === "room_management") cur.room += Number(p.amount);
      else cur.tolet += Number(p.amount);
      map.set(m, cur);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, v]) => ({ month, ...v }));
  })();

  const statusBadge = (status: string) => {
    const variant = status === "completed" ? "default" : status === "pending" ? "secondary" : "destructive";
    return <Badge variant={variant}>{status}</Badge>;
  };

  const productBadge = (type: string) => (
    <Badge variant="outline" className="gap-1">
      {type === "room_management" ? <Building2 className="h-3 w-3" /> : type === "sale_listing" ? <ShoppingCart className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
      {type === "room_management" ? "Room" : type === "tolet" ? "To-Let" : type === "sale_listing" ? "Sale Listing" : type}
    </Badge>
  );

  const BulkDeleteBar = ({ count, onDelete }: { count: number; onDelete: () => void }) => {
    if (count === 0) return null;
    return (
      <div className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <span className="text-sm font-medium text-destructive">{count} selected</span>
        <Button size="sm" variant="destructive" className="h-7 px-3 text-xs gap-1" onClick={onDelete}>
          <Trash2 className="h-3 w-3" /> Delete Selected
        </Button>
      </div>
    );
  };

  const OrdersTable = ({ data }: { data: PaymentRow[] }) => {
    const allSelected = data.length > 0 && data.every(p => selectedPayments.has(p.id));
    return (
      <>
        <BulkDeleteBar
          count={data.filter(p => selectedPayments.has(p.id)).length}
          onDelete={() => { setDeleteTarget("payments"); setDeleteDialogOpen(true); }}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={() => toggleAllPayments(data)} />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>TXN ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">No orders found</TableCell></TableRow>
              ) : data.map(p => (
                <TableRow key={p.id} className={selectedPayments.has(p.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox checked={selectedPayments.has(p.id)} onCheckedChange={() => togglePaymentSelection(p.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.profiles?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.profiles?.phone || ""}</div>
                  </TableCell>
                  <TableCell>{productBadge(p.product_type)}</TableCell>
                  <TableCell>
                    {p.product_type === "room_management" ? `${p.room_count} room` : `${p.tolet_count} slot`}
                  </TableCell>
                  <TableCell>{p.duration_months}mo</TableCell>
                  <TableCell>{p.discount_percent > 0 ? `${p.discount_percent}%` : "—"}</TableCell>
                  <TableCell className="font-semibold">৳{Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{p.payment_method || "—"}</TableCell>
                  <TableCell className="text-xs font-mono max-w-[120px] truncate">{p.transaction_id || "—"}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-xs">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t("admin.subscriptions")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchLandlords(); fetchDiscounts(); setDiscountListOpen(true); }} className="gap-2">
            <Percent className="h-4 w-4" /> {t("admin.manage_discounts")}
          </Button>
          <Button variant="secondary" onClick={() => { fetchLandlords(); setGiftOpen(true); }} className="gap-2">
            <Gift className="h-4 w-4" /> Gift All Landlords
          </Button>
          <Button onClick={() => { fetchLandlords(); setBalanceOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> {t("admin.add_balance")}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
          { label: "Room Revenue", value: `৳${roomRevenue.toLocaleString()}`, icon: Building2, color: "text-blue-600" },
          { label: "To-Let Revenue", value: `৳${toletRevenue.toLocaleString()}`, icon: MapPin, color: "text-purple-600" },
          { label: "Active Subs", value: activeSubs, icon: Users, color: "text-emerald-600" },
          { label: "Total Orders", value: payments.length, icon: ShoppingCart, color: "text-primary" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-orange-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="room" name="Room Mgmt" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tolet" name="To-Let" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All Orders ({payments.length})</TabsTrigger>
            <TabsTrigger value="manual">
              Manual ({manualPending.length})
              {manualPending.length > 0 && <span className="ml-1 w-2 h-2 rounded-full bg-orange-500 inline-block" />}
            </TabsTrigger>
            <TabsTrigger value="room">Room ({payments.filter(p => p.product_type === "room_management").length})</TabsTrigger>
            <TabsTrigger value="tolet">To-Let ({payments.filter(p => p.product_type === "tolet").length})</TabsTrigger>
            <TabsTrigger value="active">Active Subs ({activeSorted.length})</TabsTrigger>
          </TabsList>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="manual_pending">Manual Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all"><OrdersTable data={filteredPayments()} /></TabsContent>
        <TabsContent value="room"><OrdersTable data={filteredPayments("room_management")} /></TabsContent>
        <TabsContent value="tolet"><OrdersTable data={filteredPayments("tolet")} /></TabsContent>

        {/* Manual Payments Tab */}
        <TabsContent value="manual">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>TXN ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manualPending.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No manual payments pending</TableCell></TableRow>
                ) : manualPending.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{p.profiles?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.profiles?.phone || ""}</div>
                    </TableCell>
                    <TableCell>{productBadge(p.product_type)}</TableCell>
                    <TableCell>
                      {p.product_type === "room_management" ? `${p.room_count} room` : `${p.tolet_count} slot`}
                    </TableCell>
                    <TableCell>{p.duration_months}mo</TableCell>
                    <TableCell className="font-semibold">৳{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{p.payment_method || "—"}</Badge></TableCell>
                    <TableCell className="text-xs font-mono max-w-[120px] truncate">{p.transaction_id || "—"}</TableCell>
                    <TableCell className="text-xs">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => handleManualAction(p.id, "approve")}
                          disabled={processingId === p.id}
                        >
                          {processingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => handleManualAction(p.id, "reject")}
                          disabled={processingId === p.id}
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="active">
          <BulkDeleteBar
            count={activeSorted.filter(s => selectedSubs.has(s.id)).length}
            onDelete={() => { setDeleteTarget("subs"); setDeleteDialogOpen(true); }}
          />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={activeSorted.length > 0 && activeSorted.every(s => selectedSubs.has(s.id))}
                      onCheckedChange={() => toggleAllSubs(activeSorted)}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSorted.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No active subscriptions</TableCell></TableRow>
                ) : activeSorted.map(s => {
                  const daysLeft = s.expires_at ? differenceInDays(new Date(s.expires_at), new Date()) : 0;
                  return (
                    <TableRow key={s.id} className={selectedSubs.has(s.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox checked={selectedSubs.has(s.id)} onCheckedChange={() => toggleSubSelection(s.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{s.profiles?.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.profiles?.phone || ""}</div>
                      </TableCell>
                      <TableCell>{productBadge(s.product_type)}</TableCell>
                      <TableCell>
                        {s.product_type === "room_management" ? `${s.room_count} rooms` : `${s.tolet_count} slots`}
                      </TableCell>
                      <TableCell className="text-xs">{format(new Date(s.starts_at), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-xs">{s.expires_at ? format(new Date(s.expires_at), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"}>{daysLeft}d</Badge>
                      </TableCell>
                      <TableCell><Badge>{s.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${deleteTarget === "payments" ? selectedPayments.size : selectedSubs.size} ${deleteTarget === "payments" ? "payment(s)" : "subscription(s)"}?`}
        description="This action cannot be undone. The selected records will be permanently deleted."
        isPending={deleting}
      />

      {/* Add Balance Dialog */}
      <Dialog open={balanceOpen} onOpenChange={setBalanceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.add_balance")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.select_landlord")}</Label>
              <Popover open={landlordSearchOpen} onOpenChange={setLandlordSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {balanceUserId
                      ? (landlords.find(l => l.user_id === balanceUserId)?.full_name || landlords.find(l => l.user_id === balanceUserId)?.phone)
                      : t("admin.select_landlord")}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("admin.select_landlord")} />
                    <CommandList>
                      <CommandEmpty>No landlord found.</CommandEmpty>
                      <CommandGroup>
                        {landlords.map(l => (
                          <CommandItem
                            key={l.user_id}
                            value={`${l.full_name} ${l.phone}`}
                            onSelect={() => {
                              setBalanceUserId(l.user_id);
                              setLandlordSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", balanceUserId === l.user_id ? "opacity-100" : "opacity-0")} />
                            {l.full_name || l.phone} — {l.phone}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.product_type")}</Label>
              <Select value={balanceProductType} onValueChange={(v) => setBalanceProductType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_management">Room/Flat</SelectItem>
                  <SelectItem value="tolet">To-Let</SelectItem>
                  <SelectItem value="sale_listing">Sale Listing</SelectItem>
                  <SelectItem value="boost_3_day">Boost 3-Day</SelectItem>
                  <SelectItem value="boost_7_day">Boost 7-Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.count")} ({balanceProductType === "room_management" ? "Rooms" : balanceProductType === "tolet" ? "Slots" : balanceProductType === "sale_listing" ? "Listings" : "Boosts"})</Label>
              <Input type="number" min={1} value={balanceCount} onChange={e => setBalanceCount(Number(e.target.value))} />
            </div>
            {(balanceProductType === "room_management" || balanceProductType === "tolet" || balanceProductType === "sale_listing") && (
            <div className="space-y-2">
              <Label>{t("admin.duration_months")}</Label>
              <Input type="number" min={1} max={36} value={balanceDuration} onChange={e => setBalanceDuration(Number(e.target.value))} />
            </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBalance} disabled={balanceSubmitting}>
              {balanceSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("admin.add_balance")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount List Dialog */}
      <Dialog open={discountListOpen} onOpenChange={setDiscountListOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {t("admin.manage_discounts")}
              <Button size="sm" onClick={() => { setDiscountOpen(true); }} className="gap-1">
                <Plus className="h-3 w-3" /> {t("admin.add_discount")}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {discounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("admin.no_discounts")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Applied By</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{d.landlord_profile?.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{d.landlord_profile?.phone || ""}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.discount_type === "free_forever" ? "default" : "secondary"} className="gap-1">
                          {d.discount_type === "free_forever" ? <Gift className="h-3 w-3" /> : <Percent className="h-3 w-3" />}
                          {d.discount_type === "free_forever" ? t("admin.free_forever") : t("admin.percentage_discount")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{d.discount_percent}%</TableCell>
                      <TableCell>
                        <div className="text-sm">{d.admin_profile?.full_name || "—"}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{d.notes || "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => handleRemoveDiscount(d.user_id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Discount Dialog */}
      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.add_discount")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("admin.select_landlord")}</Label>
              <Popover open={discountSearchOpen} onOpenChange={setDiscountSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {discountUserId
                      ? (landlords.find(l => l.user_id === discountUserId)?.full_name || landlords.find(l => l.user_id === discountUserId)?.phone)
                      : t("admin.select_landlord")}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("admin.select_landlord")} />
                    <CommandList>
                      <CommandEmpty>No landlord found.</CommandEmpty>
                      <CommandGroup>
                        {landlords.map(l => (
                          <CommandItem
                            key={l.user_id}
                            value={`${l.full_name} ${l.phone}`}
                            onSelect={() => {
                              setDiscountUserId(l.user_id);
                              setDiscountSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", discountUserId === l.user_id ? "opacity-100" : "opacity-0")} />
                            {l.full_name || l.phone} — {l.phone}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="flex gap-3">
                <Button
                  variant={discountType === "free_forever" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setDiscountType("free_forever")}
                >
                  <Gift className="h-4 w-4" /> {t("admin.free_forever")}
                </Button>
                <Button
                  variant={discountType === "percentage" ? "default" : "outline"}
                  className="flex-1 gap-2"
                  onClick={() => setDiscountType("percentage")}
                >
                  <Percent className="h-4 w-4" /> {t("admin.percentage_discount")}
                </Button>
              </div>
            </div>
            {discountType === "percentage" && (
              <div className="space-y-2">
                <Label>{t("admin.discount_percent")}</Label>
                <Input type="number" min={1} max={99} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("admin.discount_notes")}</Label>
              <Input value={discountNotes} onChange={e => setDiscountNotes(e.target.value)} placeholder="e.g. Special partner, early adopter..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDiscount} disabled={discountSubmitting}>
              {discountSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift All Landlords Dialog */}
      <Dialog open={giftOpen} onOpenChange={setGiftOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Gift All Landlords</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Select value={giftProductType} onValueChange={(v) => setGiftProductType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="room_management">Room/Flat</SelectItem>
                  <SelectItem value="tolet">To-Let</SelectItem>
                  <SelectItem value="sale_listing">Sale Listing</SelectItem>
                  <SelectItem value="boost_3_day">Boost 3-Day</SelectItem>
                  <SelectItem value="boost_7_day">Boost 7-Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Count ({giftProductType === "room_management" ? "Rooms" : giftProductType === "tolet" ? "Slots" : giftProductType === "sale_listing" ? "Listings" : "Boosts"})</Label>
              <Input type="number" min={1} value={giftCount} onChange={e => setGiftCount(Number(e.target.value))} />
            </div>
            {(giftProductType === "room_management" || giftProductType === "tolet" || giftProductType === "sale_listing") && (
              <div className="space-y-2">
                <Label>Duration (months)</Label>
                <Input type="number" min={1} max={36} value={giftDuration} onChange={e => setGiftDuration(Number(e.target.value))} />
              </div>
            )}
            {giftSubmitting && giftTotal > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Processing...</span>
                  <span>{giftProgress}/{giftTotal}</span>
                </div>
                <Progress value={(giftProgress / giftTotal) * 100} className="h-2" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">This will add balance to all {landlords.length} landlord(s) in the system.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftOpen(false)} disabled={giftSubmitting}>Cancel</Button>
            <Button onClick={handleGiftAll} disabled={giftSubmitting}>
              {giftSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Gift All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
