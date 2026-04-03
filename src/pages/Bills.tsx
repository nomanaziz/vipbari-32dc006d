import { useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CreditCard, Plus, Trash2, CheckCircle2, CheckCircle, XCircle, Zap, Banknote, Bell, ChevronDown, ChevronUp, Printer, Pencil, Eye, MessageSquare, Phone, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import { BillStatsCards } from "@/components/bills/BillStatsCards";
import { BillGenerateDialog } from "@/components/bills/BillGenerateDialog";
import { QuickPaymentDialog } from "@/components/bills/QuickPaymentDialog";
import RentReceipt from "@/components/bills/RentReceipt";
import { BillEditDialog } from "@/components/bills/BillEditDialog";
import { SendBillMessageDialog } from "@/components/bills/SendBillMessageDialog";
import { StatusSchedulerDialog } from "@/components/bills/StatusSchedulerDialog";
import { TenantDetailDialog } from "@/components/bills/TenantDetailDialog";

const Bills = () => {
  const { t, language } = useLanguage();
  const { user, effectiveOwnerId } = useAuth();
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [payBill, setPayBill] = useState<any>(null);
  const [tab, setTab] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [markPaidBill, setMarkPaidBill] = useState<any>(null);
  const [rejectPayment, setRejectPayment] = useState<any>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [activeTab, setActiveTab] = useState("bills");
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [editBill, setEditBill] = useState<any>(null);

  // New state for action dialogs
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [messageBills, setMessageBills] = useState<any[]>([]);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [schedulerTenant, setSchedulerTenant] = useState<any>(null);
  const [viewTenantId, setViewTenantId] = useState<string | null>(null);
  const [acceptPayment, setAcceptPayment] = useState<any>(null);
  const [printBills, setPrintBills] = useState<any[]>([]);

  // Tenant tab selection
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());

  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-for-receipt", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: bills, isLoading } = useQuery({
    queryKey: ["bills", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*, tenants(full_name, phone, billing_type), rooms(room_number, property_id, properties(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: payments } = useQuery({
    queryKey: ["all-payments-for-stats", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("amount, payment_date").eq("owner_id", effectiveOwnerId!);
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: pendingOnlinePayments } = useQuery({
    queryKey: ["pending-online-payments", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, bill_id, amount, payment_method, tenant_id, tenants(full_name)")
        .eq("owner_id", effectiveOwnerId!)
        .eq("status", "pending")
        .neq("payment_method", "cash");
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  const { data: tenants } = useQuery({
    queryKey: ["rent-tenants", effectiveOwnerId],
    queryFn: async () => {
      const { data: owned } = await supabase
        .from("tenants")
        .select("id, full_name, phone, user_id, room_id, rooms(room_number, rent_amount, property_id, properties(name))")
        .eq("owner_id", effectiveOwnerId!)
        .eq("status", "active");

      const { data: requests } = await supabase
        .from("tolet_requests")
        .select("tenant_user_id, room_id, rooms(room_number, rent_amount, property_id, properties(name))")
        .eq("landlord_user_id", effectiveOwnerId!)
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
            .select("id, full_name, phone, user_id, room_id, rooms(room_number, rent_amount, property_id, properties(name))")
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
    enabled: !!effectiveOwnerId,
  });

  const { data: rentPayments } = useQuery({
    queryKey: ["rent-payments", effectiveOwnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("tenant_id, amount, payment_date")
        .eq("owner_id", effectiveOwnerId!)
        .order("payment_date", { ascending: false });
      return data || [];
    },
    enabled: !!effectiveOwnerId,
  });

  // --- Mutations ---
  const createBill = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("bills").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setShowGenerate(false);
      toast.success(L("Bill generated successfully", "বিল সফলভাবে তৈরি হয়েছে"));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async (bill: any) => {
      const { error } = await supabase.from("bills").update({
        status: "paid",
        received_amount: Number(bill.total_amount),
      }).eq("id", bill.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      setMarkPaidBill(null);
      toast.success(L("Bill marked as paid", "বিল পরিশোধিত হিসেবে চিহ্নিত"));
    },
  });

  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(L("Bill deleted", "বিল মুছে ফেলা হয়েছে"));
    },
  });

  const acceptOnlinePayment = useMutation({
    mutationFn: async (payment: any) => {
      const { error } = await supabase.from("payments").update({
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        status: "accepted",
      }).eq("id", payment.id);
      if (error) throw error;

      const { data: bill } = await supabase.from("bills").select("received_amount, total_amount").eq("id", payment.bill_id).single();
      if (bill) {
        const newReceived = Number(bill.received_amount || 0) + Number(payment.amount);
        const newStatus = newReceived >= Number(bill.total_amount) ? "paid" : "partial";
        await supabase.from("bills").update({ received_amount: newReceived, status: newStatus }).eq("id", payment.bill_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["pending-online-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(L("Payment accepted", "পেমেন্ট গৃহীত হয়েছে"));
    },
  });

  const rejectOnlinePayment = useMutation({
    mutationFn: async ({ paymentId, note }: { paymentId: string; note: string }) => {
      const { error } = await supabase.from("payments").update({ status: "rejected", rejection_note: note || null }).eq("id", paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-online-payments"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success(L("Payment rejected", "পেমেন্ট প্রত্যাখ্যাত"));
      setRejectPayment(null);
      setRejectionNote("");
    },
  });

  const generateAll = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`;

      const { data: utilCfgData } = await supabase
        .from("landlord_settings")
        .select("value")
        .eq("owner_id", effectiveOwnerId!)
        .eq("key", "utility_config")
        .maybeSingle();
      const cfg = (utilCfgData?.value && typeof utilCfgData.value === "object" && !Array.isArray(utilCfgData.value))
        ? utilCfgData.value as Record<string, { enabled: boolean; rate: string }>
        : null;

      const { data: tenantsList } = await supabase
        .from("tenants")
        .select("id, owner_id, room_id, rooms(id, rent_amount)")
        .eq("owner_id", effectiveOwnerId!)
        .eq("status", "active")
        .eq("billing_type", "billing")
        .not("room_id", "is", null);

      const { data: requests } = await supabase
        .from("tolet_requests")
        .select("tenant_user_id, room_id, rooms(id, rent_amount)")
        .eq("landlord_user_id", effectiveOwnerId!)
        .eq("status", "accepted");

      const tenantMap = new Map<string, any>();
      (tenantsList || []).forEach((t: any) => tenantMap.set(t.id, t));

      if (requests?.length) {
        const userIds = requests.map((r: any) => r.tenant_user_id);
        const { data: reqTenants } = await supabase
          .from("tenants")
          .select("id, owner_id, room_id, user_id, billing_type, rooms(id, rent_amount)")
          .in("user_id", userIds)
          .eq("status", "active")
          .eq("billing_type", "billing");

        (reqTenants || []).forEach((t: any) => {
          if (!tenantMap.has(t.id)) {
            const req = requests.find((r: any) => r.tenant_user_id === t.user_id);
            if (!t.rooms && req?.rooms) {
              t.rooms = req.rooms;
              t.room_id = req.room_id;
            }
            tenantMap.set(t.id, { ...t, owner_id: effectiveOwnerId! });
          }
        });
      }

      const { data: existing } = await supabase
        .from("bills")
        .select("tenant_id")
        .eq("month", month)
        .eq("owner_id", effectiveOwnerId!);

      const existingIds = new Set((existing || []).map((b: any) => b.tenant_id));

      const newBills = Array.from(tenantMap.values())
        .filter((t: any) => !existingIds.has(t.id) && t.rooms)
        .map((t: any) => {
          const rent = Number(t.rooms.rent_amount) || 0;
          const elec = cfg?.electricity?.enabled ? Number(cfg.electricity.rate) || 0 : 0;
          const water = cfg?.water?.enabled ? Number(cfg.water.rate) || 0 : 0;
          const gas = cfg?.gas?.enabled ? Number(cfg.gas.rate) || 0 : 0;
          const wifi = cfg?.wifi?.enabled ? Number(cfg.wifi.rate) || 0 : 0;
          const generator = cfg?.generator?.enabled ? Number(cfg.generator.rate) || 0 : 0;
          const security = cfg?.security?.enabled ? Number(cfg.security.rate) || 0 : 0;
          const other = cfg?.other?.enabled ? Number(cfg.other.rate) || 0 : 0;
          const total = rent + elec + water + gas + wifi + generator + security + other;
          return {
            tenant_id: t.id,
            room_id: t.room_id || t.rooms?.id,
            owner_id: effectiveOwnerId!,
            month,
            due_date: dueDate,
            rent_amount: rent,
            electricity_charge: elec,
            water_charge: water,
            gas_charge: gas,
            wifi_charge: wifi,
            generator_charge: generator,
            security_charge: security,
            other_charges: other,
            total_amount: total,
            status: "unpaid",
          };
        });

      if (newBills.length > 0) {
        const { error } = await supabase.from("bills").insert(newBills as any);
        if (error) throw error;
      }
      return newBills.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(L(`${count} bills generated`, `${count}টি বিল তৈরি হয়েছে`));
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendReminder = useMutation({
    mutationFn: async ({ tenantUserId, tenantName }: { tenantUserId: string; tenantName: string }) => {
      const { error } = await supabase.from("notifications").insert({
        user_id: tenantUserId,
        title: L("Payment Reminder", "পেমেন্ট রিমাইন্ডার"),
        body: L(`Dear ${tenantName}, please pay your rent.`, `প্রিয় ${tenantName}, অনুগ্রহ করে ভাড়া পরিশোধ করুন।`),
        type: "payment_reminder",
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success(L("Reminder sent", "রিমাইন্ডার পাঠানো হয়েছে")),
    onError: (e: any) => toast.error(e.message),
  });

  const sendAllDueReminder = useMutation({
    mutationFn: async () => {
      const dueTenants = rentRows.filter((r: any) => r.user_id && r.status !== "paid" && r.status !== "no_bill");
      if (!dueTenants.length) throw new Error(L("No due tenants found", "কোনো বকেয়া ভাড়াটিয়া নেই"));
      const notifications = dueTenants.map((r: any) => ({
        user_id: r.user_id,
        title: L("Payment Reminder", "পেমেন্ট রিমাইন্ডার"),
        body: L(`Dear ${r.full_name}, please pay your rent.`, `প্রিয় ${r.full_name}, অনুগ্রহ করে ভাড়া পরিশোধ করুন।`),
        type: "payment_reminder",
      }));
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
      return dueTenants.length;
    },
    onSuccess: (count) => toast.success(L(`Reminder sent to ${count} tenants`, `${count} জন ভাড়াটিয়াকে রিমাইন্ডার পাঠানো হয়েছে`)),
    onError: (e: any) => toast.error(e.message),
  });

  // Stats
  const totalDue = bills?.filter((b: any) => b.status !== "paid").reduce((s: number, b: any) => s + Number(b.total_amount) - Number(b.received_amount || 0), 0) || 0;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paidThisMonth = payments?.filter((p: any) => p.payment_date?.startsWith(thisMonth)).reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const totalPaid = payments?.reduce((s: number, p: any) => s + Number(p.amount), 0) || 0;
  const overdueCount = bills?.filter((b: any) => b.status === "unpaid" && b.due_date && new Date(b.due_date) < now).length || 0;

  // Filter by tab
  const filtered = bills?.filter((b: any) => {
    if (tab === "paid") return b.status === "paid";
    if (tab === "due") return b.status === "unpaid" || b.status === "partial";
    if (tab === "free") return b.tenants?.billing_type === "free";
    return true;
  }) || [];

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{L("Paid", "পরিশোধিত")}</Badge>;
    if (status === "partial") return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">{L("Partial", "আংশিক")}</Badge>;
    return <Badge variant="destructive">{L("Due", "বকেয়া")}</Badge>;
  };

  const getPendingForBill = (billId: string) =>
    pendingOnlinePayments?.filter((p: any) => p.bill_id === billId) || [];

  // Tenant rent rows
  const rentRows = tenants?.map((t: any) => {
    const tenantBills = bills?.filter((b: any) => b.tenant_id === t.id) || [];
    const latestBill = tenantBills[0];
    const lastPayment = rentPayments?.find((p: any) => p.tenant_id === t.id);
    const status = !latestBill ? "no_bill" : latestBill.status;
    const isOverdue = latestBill?.status === "unpaid" && latestBill.due_date && new Date(latestBill.due_date) < now;
    return { ...t, latestBill, lastPayment, status, isOverdue };
  }) || [];

  const currentMonthBills = bills?.filter((b: any) => b.month === thisMonth) || [];

  const handlePrintAll = () => {
    setTimeout(() => window.print(), 300);
  };

  // --- Helpers for new actions ---
  const toggleBillSelection = (billId: string) => {
    setSelectedBillIds(prev => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      return next;
    });
  };

  const toggleAllBills = () => {
    if (selectedBillIds.size === filtered.length) {
      setSelectedBillIds(new Set());
    } else {
      setSelectedBillIds(new Set(filtered.map((b: any) => b.id)));
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenantIds(prev => {
      const next = new Set(prev);
      if (next.has(tenantId)) next.delete(tenantId);
      else next.add(tenantId);
      return next;
    });
  };

  const toggleAllTenants = () => {
    if (selectedTenantIds.size === rentRows.length) {
      setSelectedTenantIds(new Set());
    } else {
      setSelectedTenantIds(new Set(rentRows.map((r: any) => r.id)));
    }
  };

  const billToMessageData = (bill: any) => ({
    tenantName: bill.tenants?.full_name || "—",
    phone: bill.tenants?.phone || "",
    roomNumber: bill.rooms?.room_number || "—",
    month: bill.month,
    totalAmount: Number(bill.total_amount),
    dueAmount: Number(bill.total_amount) - Number(bill.received_amount || 0),
    dueDate: bill.due_date,
  });

  const handleSingleReceipt = (bill: any) => {
    setPrintBills([{ ...bill, landlordName: myProfile?.full_name, landlordPhone: myProfile?.phone }]);
    setTimeout(() => window.print(), 300);
  };

  const handleBulkReceipt = () => {
    const selected = filtered.filter((b: any) => selectedBillIds.has(b.id));
    if (selected.length === 0) {
      toast.error(L("Select bills first", "প্রথমে বিল নির্বাচন করুন"));
      return;
    }
    setPrintBills(selected.map((b: any) => ({ ...b, landlordName: myProfile?.full_name, landlordPhone: myProfile?.phone })));
    setTimeout(() => window.print(), 300);
  };

  const handleBulkMessage = () => {
    const selected = filtered.filter((b: any) => selectedBillIds.has(b.id) && b.tenants?.phone);
    if (selected.length === 0) {
      toast.error(L("Select bills with phone numbers", "ফোন নম্বর সহ বিল নির্বাচন করুন"));
      return;
    }
    setMessageBills(selected.map(billToMessageData));
    setShowMessageDialog(true);
  };

  const handleTenantBulkMessage = () => {
    const selected = rentRows.filter((r: any) => selectedTenantIds.has(r.id) && r.phone && r.latestBill);
    if (selected.length === 0) {
      toast.error(L("Select tenants with bills", "বিল সহ ভাড়াটিয়া নির্বাচন করুন"));
      return;
    }
    setMessageBills(selected.map((r: any) => ({
      tenantName: r.full_name,
      phone: r.phone,
      roomNumber: r.rooms?.room_number || "—",
      month: r.latestBill?.month || "—",
      totalAmount: Number(r.latestBill?.total_amount || 0),
      dueAmount: Number(r.latestBill?.total_amount || 0) - Number(r.latestBill?.received_amount || 0),
      dueDate: r.latestBill?.due_date,
    })));
    setShowMessageDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("nav.bills")}</h1>
        <div className="flex flex-wrap gap-2">
          {currentMonthBills.length > 0 && (
            <Button variant="outline" size="sm" onClick={handlePrintAll} className="gap-1.5">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">{L("Print Receipts", "রশিদ প্রিন্ট")}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => generateAll.mutate()} disabled={generateAll.isPending} className="gap-1.5">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">{L("Generate All", "সব তৈরি করুন")}</span>
          </Button>
          <Button size="sm" onClick={() => setShowGenerate(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{L("Generate Bill", "বিল তৈরি করুন")}</span>
          </Button>
        </div>
      </div>

      {/* Hidden print-only receipt container */}
      <div className="hidden print:block">
        <RentReceipt bills={printBills.length > 0 ? printBills : currentMonthBills.map((b: any) => ({ ...b, landlordName: myProfile?.full_name, landlordPhone: myProfile?.phone }))} />
      </div>

      <BillStatsCards totalDue={totalDue} paidThisMonth={paidThisMonth} totalPaid={totalPaid} overdueCount={overdueCount} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bills">{L("Bills", "বিল তালিকা")}</TabsTrigger>
          <TabsTrigger value="tenants">{L("Tenants List", "ভাড়াটিয়া তালিকা")}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Bills */}
        <TabsContent value="bills" className="mt-4 space-y-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">{L("All", "সব")} ({bills?.length || 0})</TabsTrigger>
              <TabsTrigger value="due">{L("Due", "বকেয়া")} ({bills?.filter((b: any) => b.status !== "paid").length || 0})</TabsTrigger>
              <TabsTrigger value="paid">{L("Paid", "পরিশোধিত")} ({bills?.filter((b: any) => b.status === "paid").length || 0})</TabsTrigger>
              <TabsTrigger value="free">{L("Free", "ফ্রি")} ({bills?.filter((b: any) => b.tenants?.billing_type === "free").length || 0})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Bulk action bar */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedBillIds.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAllBills}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedBillIds.size > 0
                    ? L(`${selectedBillIds.size} selected`, `${selectedBillIds.size}টি নির্বাচিত`)
                    : L("Select All", "সব নির্বাচন")}
                </span>
              </div>
              {selectedBillIds.size > 0 && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleBulkReceipt}>
                    <Download className="h-3.5 w-3.5" />
                    {L("Download Receipts", "রশিদ ডাউনলোড")}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={handleBulkMessage}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    {L("Send SMS/WhatsApp", "SMS/WhatsApp পাঠান")}
                  </Button>
                </>
              )}
            </div>
          )}

          <BillGenerateDialog
            open={showGenerate}
            onOpenChange={setShowGenerate}
            onSubmit={(data) => createBill.mutate(data)}
            isPending={createBill.isPending}
            effectiveOwnerId={effectiveOwnerId}
          />

          <QuickPaymentDialog
            open={!!payBill}
            onOpenChange={(v) => { if (!v) setPayBill(null); }}
            bill={payBill}
          />

          <BillEditDialog
            open={!!editBill}
            onOpenChange={(v) => { if (!v) setEditBill(null); }}
            bill={editBill}
          />

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted" /></Card>)}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{L("No bills found", "কোনো বিল পাওয়া যায়নি")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {filtered.map((bill: any) => {
                  const balance = Number(bill.total_amount) - Number(bill.received_amount || 0);
                  const pendingPayments = getPendingForBill(bill.id);
                  const isExpanded = expandedBillId === bill.id;
                  const isSelected = selectedBillIds.has(bill.id);
                  const breakdownItems = [
                    { label: L("House Rent", "বাড়ি ভাড়া"), value: Number(bill.rent_amount || 0) },
                    { label: L("Electricity", "বিদ্যুৎ"), value: Number(bill.electricity_charge || 0) },
                    { label: L("Water", "পানি"), value: Number(bill.water_charge || 0) },
                    { label: L("Gas", "গ্যাস"), value: Number(bill.gas_charge || 0) },
                    { label: L("Service Charge", "সার্ভিস চার্জ"), value: Number(bill.service_charge || 0) },
                    { label: L("Garage", "গ্যারেজ"), value: Number(bill.garage_charge || 0) },
                    { label: L("Other", "অন্যান্য"), value: Number(bill.other_charges || 0) },
                    { label: L("VAT", "ভ্যাট"), value: Number(bill.vat || 0) },
                    { label: L("Advance", "অগ্রিম"), value: Number(bill.advance || 0) },
                  ].filter(item => item.value > 0);
                  return (
                    <Card key={bill.id} className={`overflow-hidden hover:shadow-md transition-shadow ${isSelected ? "ring-2 ring-primary" : ""}`}>
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleBillSelection(bill.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex items-center justify-between flex-1 cursor-pointer" onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}>
                              <div className="flex items-center gap-2 min-w-0">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                                <div className="min-w-0">
                                  <span className="font-medium truncate block">{bill.tenants?.full_name || "—"}</span>
                                  <span className="text-xs text-muted-foreground">{bill.tenants?.phone || ""}</span>
                                </div>
                              </div>
                              {statusBadge(bill.status)}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm ml-8">
                            <div className="text-muted-foreground">{L("Property", "প্রপার্টি")}: <span className="text-foreground">{bill.rooms?.properties?.name || "—"}</span></div>
                            <div className="text-muted-foreground">{L("Room", "রুম")}: <span className="text-foreground">{bill.rooms?.room_number || "—"}</span></div>
                            <div className="text-muted-foreground">{L("Month", "মাস")}: <span className="text-foreground">{bill.month}</span></div>
                            <div className="text-muted-foreground">{L("Total", "মোট")}: <span className="text-foreground font-medium">৳{Number(bill.total_amount).toLocaleString()}</span></div>
                            <div className="text-muted-foreground">{L("Received", "প্রাপ্ত")}: <span className="text-emerald-600">৳{Number(bill.received_amount || 0).toLocaleString()}</span></div>
                            <div className="text-muted-foreground">{L("Due", "বকেয়া")}: <span className="text-foreground font-semibold">{balance > 0 ? `৳${balance.toLocaleString()}` : "—"}</span></div>
                            <div className="text-muted-foreground">{L("Advance", "অগ্রিম")}: <span className="text-foreground">৳{Number(bill.advance || 0).toLocaleString()}</span></div>
                          </div>
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 mt-2 ml-8 flex-wrap" onClick={(e) => e.stopPropagation()}>
                            {pendingPayments.map((pp: any) => (
                              <div key={pp.id} className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">{pp.payment_method} ৳{Number(pp.amount).toLocaleString()}</Badge>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => setAcceptPayment(pp)} title={L("Accept", "গ্রহণ")}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setRejectPayment(pp)} title={L("Reject", "বাতিল")}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {bill.status !== "paid" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => setPayBill(bill)} title={L("Pay", "পেমেন্ট")}>
                                  <Banknote className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => setMarkPaidBill(bill)} title={L("Mark Paid", "পরিশোধিত")}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {/* Receipt */}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSingleReceipt(bill)} title={L("Receipt", "রশিদ")}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            {/* SMS/WhatsApp */}
                            {bill.tenants?.phone && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMessageBills([billToMessageData(bill)]); setShowMessageDialog(true); }} title={L("SMS/WhatsApp", "SMS/WhatsApp")}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                            {/* View tenant */}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewTenantId(bill.tenant_id)} title={L("View", "বিস্তারিত")}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* Edit */}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditBill(bill)} title={L("Edit", "সম্পাদনা")}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {/* Delete - current month only */}
                            {bill.month === new Date().toISOString().slice(0, 7) && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(bill.id)} title={L("Delete", "মুছুন")}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {isExpanded && breakdownItems.length > 0 && (
                          <div className="border-t bg-muted/40 p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                              {breakdownItems.map((item) => (
                                <div key={item.label} className="flex flex-col rounded-md border bg-background p-2">
                                  <span className="text-xs text-muted-foreground">{item.label}</span>
                                  <span className="font-semibold text-sm">৳{item.value.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="flex flex-col rounded-md border border-primary/30 bg-primary/5 p-2">
                                <span className="text-xs text-muted-foreground">{L("Total", "মোট")}</span>
                                <span className="font-bold text-sm text-primary">৳{Number(bill.total_amount).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Tenants List */}
        <TabsContent value="tenants" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTenantIds.size === rentRows.length && rentRows.length > 0}
                onCheckedChange={toggleAllTenants}
              />
              <span className="text-sm text-muted-foreground">
                {selectedTenantIds.size > 0
                  ? L(`${selectedTenantIds.size} selected`, `${selectedTenantIds.size}টি নির্বাচিত`)
                  : L("Select All", "সব নির্বাচন")}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedTenantIds.size > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleTenantBulkMessage}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  {L("SMS/WhatsApp", "SMS/WhatsApp")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={sendAllDueReminder.isPending}
                onClick={() => sendAllDueReminder.mutate()}
              >
                <Bell className="h-4 w-4" />
                {L("Notify All Due", "সকল বকেয়া নোটিফাই")}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {rentRows.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">{L("No tenants found", "কোনো ভাড়াটিয়া পাওয়া যায়নি")}</CardContent></Card>
            ) : rentRows.map((r: any) => (
              <Card key={r.id} className={`hover:shadow-md transition-shadow ${selectedTenantIds.has(r.id) ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={selectedTenantIds.has(r.id)}
                      onCheckedChange={() => toggleTenantSelection(r.id)}
                    />
                    <div className="flex items-center justify-between flex-1">
                      <div>
                        <p className="font-medium">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                      </div>
                      {r.isOverdue ? (
                        <Badge variant="destructive">{L("Overdue", "মেয়াদোত্তীর্ণ")}</Badge>
                      ) : r.status === "paid" ? (
                        <Badge>{L("Paid", "পরিশোধিত")}</Badge>
                      ) : r.status === "unpaid" || r.status === "partial" ? (
                        <Badge variant="secondary">{L("Due", "বকেয়া")}</Badge>
                      ) : (
                        <Badge variant="outline">{L("No Bill", "বিল নেই")}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm ml-8">
                    <div className="text-muted-foreground">{L("Room", "রুম")}: <span className="text-foreground">{r.rooms?.room_number || "—"}</span></div>
                    <div className="text-muted-foreground">{L("Rent", "ভাড়া")}: <span className="text-foreground">৳{Number(r.rooms?.rent_amount || 0).toLocaleString()}</span></div>
                    <div className="text-muted-foreground">{L("Month", "মাস")}: <span className="text-foreground">{r.latestBill?.month || "—"}</span></div>
                    <div className="text-muted-foreground">{L("Last Payment", "সর্বশেষ")}: <span className="text-foreground">{r.lastPayment ? new Date(r.lastPayment.payment_date).toLocaleDateString() : "—"}</span></div>
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 mt-2 ml-8 flex-wrap">
                    {/* View details */}
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => setViewTenantId(r.id)}>
                      <Eye className="h-3.5 w-3.5" />
                      {L("View", "দেখুন")}
                    </Button>
                    {/* SMS/WhatsApp */}
                    {r.phone && r.latestBill && (
                      <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => {
                        setMessageBills([{
                          tenantName: r.full_name,
                          phone: r.phone,
                          roomNumber: r.rooms?.room_number || "—",
                          month: r.latestBill?.month || "—",
                          totalAmount: Number(r.latestBill?.total_amount || 0),
                          dueAmount: Number(r.latestBill?.total_amount || 0) - Number(r.latestBill?.received_amount || 0),
                          dueDate: r.latestBill?.due_date,
                        }]);
                        setShowMessageDialog(true);
                      }}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        {L("Message", "মেসেজ")}
                      </Button>
                    )}
                    {/* Status scheduler */}
                    <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => setSchedulerTenant({ id: r.id, full_name: r.full_name })}>
                      <Calendar className="h-3.5 w-3.5" />
                      {L("Schedule", "সিডিউল")}
                    </Button>
                    {/* Remind */}
                    {r.user_id && r.status !== "paid" && (
                      <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => sendReminder.mutate({ tenantUserId: r.user_id, tenantName: r.full_name })} disabled={sendReminder.isPending}>
                        <Bell className="h-3.5 w-3.5" />
                        {L("Remind", "স্মরণ")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New action dialogs */}
      <SendBillMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        bills={messageBills}
      />
      <StatusSchedulerDialog
        open={!!schedulerTenant}
        onOpenChange={(v) => { if (!v) setSchedulerTenant(null); }}
        tenant={schedulerTenant}
      />
      <TenantDetailDialog
        open={!!viewTenantId}
        onOpenChange={(v) => { if (!v) setViewTenantId(null); }}
        tenantId={viewTenantId}
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteBill.mutate(deleteId); setDeleteId(null); } }}
        isPending={deleteBill.isPending}
      />

      {/* Accept payment confirmation */}
      <DeleteConfirmDialog
        open={!!acceptPayment}
        onOpenChange={(open) => !open && setAcceptPayment(null)}
        onConfirm={() => { if (acceptPayment) { acceptOnlinePayment.mutate(acceptPayment); setAcceptPayment(null); } }}
        isPending={acceptOnlinePayment.isPending}
        title={language === "bn" ? "পেমেন্ট গ্রহণ করুন" : "Accept Payment"}
        description={language === "bn"
          ? `আপনি কি ৳${Number(acceptPayment?.amount || 0).toLocaleString()} পেমেন্ট গ্রহণ করতে চান?`
          : `Are you sure you want to accept this payment of ৳${Number(acceptPayment?.amount || 0).toLocaleString()}?`}
      />

      {/* Mark as Paid confirmation */}
      <Dialog open={!!markPaidBill} onOpenChange={(o) => { if (!o) setMarkPaidBill(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{L("Confirm Mark as Paid", "পরিশোধিত হিসেবে নিশ্চিত করুন")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {L(
              `Are you sure you want to mark the bill for "${markPaidBill?.tenants?.full_name}" (${markPaidBill?.month}) as fully paid?`,
              `আপনি কি "${markPaidBill?.tenants?.full_name}" (${markPaidBill?.month}) এর বিল সম্পূর্ণ পরিশোধিত হিসেবে চিহ্নিত করতে চান?`
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidBill(null)}>{L("Cancel", "বাতিল")}</Button>
            <Button onClick={() => markPaid.mutate(markPaidBill)} disabled={markPaid.isPending}>
              {L("Confirm", "নিশ্চিত করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject online payment dialog */}
      <Dialog open={!!rejectPayment} onOpenChange={(o) => { if (!o) { setRejectPayment(null); setRejectionNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{L("Reject Payment", "পেমেন্ট প্রত্যাখ্যান")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{L("Enter reason (optional):", "কারণ লিখুন (ঐচ্ছিক):")}</p>
            <Input value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder={L("Reason for rejection...", "প্রত্যাখ্যানের কারণ...")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectPayment(null); setRejectionNote(""); }}>{L("Cancel", "বাতিল")}</Button>
            <Button variant="destructive" onClick={() => rejectOnlinePayment.mutate({ paymentId: rejectPayment.id, note: rejectionNote })} disabled={rejectOnlinePayment.isPending}>
              {L("Reject", "প্রত্যাখ্যান করুন")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BillsPage = () => (
  <PermissionGuard permission="view_bills">
    <Bills />
  </PermissionGuard>
);

export default BillsPage;
