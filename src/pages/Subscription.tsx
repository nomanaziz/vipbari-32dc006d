import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Crown,
  Clock,
  History,
  Info,
  ShoppingCart,
  CheckCircle2,
  Package,
  Hourglass,
  Tag,
  Home,
  Megaphone,
  Gift,
  Loader2,
  XCircle,
  Banknote,
  Flame,
  ShoppingBag,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import ManualPaymentDialog from "@/components/subscription/ManualPaymentDialog";
import CartDrawer from "@/components/subscription/CartDrawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActiveSub {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  room_count: number;
  duration_months: number;
  discount_percent: number;
  coupon_code: string | null;
  product_type: string;
  tolet_count: number;
  tolet_price_per_unit: number;
  sale_listing_count: number;
}

interface HistorySub extends ActiveSub {
  created_at: string;
}

const PRICE_PER_ROOM = 10;
const PRICE_PER_TOLET = 50;
const PRICE_PER_SALE_LISTING = 200;
const BOOST_PRICES: Record<string, number> = { "3_day": 30, "7_day": 50 };
const PRICE_PER_SMS = 0.5;

const ROOM_CHIPS = [0, 5, 10, 15, 20, 30, 50];
const TOLET_CHIPS = [0, 1, 2, 3, 5, 10];
const SALE_CHIPS = [0, 1, 2, 3, 5];
const DURATION_CHIPS = [1, 3, 6, 12, 24, 36];
const BOOST3_CHIPS = [0, 1, 3, 5, 10];
const BOOST7_CHIPS = [0, 1, 3, 5, 10];
const SMS_CHIPS = [0, 100, 200, 500, 1000];

const getDurationDiscount = (months: number): number =>
  months < 6 ? 0 : Math.min(35, Math.round(5 + (months - 6)));

const getDurationLabel = (months: number, language: string): string => {
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (language === "bn") {
    if (years > 0 && remMonths > 0) return `${years} বছর ${remMonths} মাস`;
    if (years > 0) return `${years} বছর`;
    return `${months} মাস`;
  }
  if (years > 0 && remMonths > 0) return `${years}y ${remMonths}m`;
  if (years > 0) return `${years} Year${years > 1 ? "s" : ""}`;
  return `${months} Month${months > 1 ? "s" : ""}`;
};

/* ─── Chip Selector Component ─── */
const ChipSelector = ({
  chips,
  value,
  onChange,
  suffix,
}: {
  chips: number[];
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) => (
  <div className="flex flex-wrap gap-2">
    {chips.map((chip) => (
      <button
        key={chip}
        onClick={() => onChange(chip)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
          value === chip
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted/50 text-foreground border-border hover:border-primary/50"
        }`}
      >
        {chip === 0 ? "—" : `${chip}${suffix || ""}`}
      </button>
    ))}
  </div>
);

const Subscription = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { addItem, cartCount, setIsCartOpen } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();

  const [activeRoomSub, setActiveRoomSub] = useState<ActiveSub | null>(null);
  const [activeToletSub, setActiveToletSub] = useState<ActiveSub | null>(null);
  const [activeSaleSub, setActiveSaleSub] = useState<ActiveSub | null>(null);
  const [history, setHistory] = useState<HistorySub[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<"success" | "cancel" | "failed" | null>(null);
  const [manualPayOpen, setManualPayOpen] = useState(false);
  const [manualPayType, setManualPayType] = useState<"room_management" | "tolet" | "boost" | "sale_listing">("room_management");
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [landlordDiscount, setLandlordDiscount] = useState<{ discount_type: string; discount_percent: number } | null>(null);

  // Product visibility flags from admin settings
  const [productFlags, setProductFlags] = useState({
    room: true, tolet: true, sale_listing: true, boost: true, sms: false,
  });

  // Boost & SMS balances
  const [boostBalances, setBoostBalances] = useState<any[]>([]);
  const [smsBalance, setSmsBalance] = useState({ total: 0, used: 0 });
  const [saleUsedCount, setSaleUsedCount] = useState(0);

  // ─── Configurator State ───
  const [roomCount, setRoomCount] = useState(0);
  const [toletCount, setToletCount] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [duration, setDuration] = useState(1);
  const [boost3Count, setBoost3Count] = useState(0);
  const [boost7Count, setBoost7Count] = useState(0);
  const [smsCount, setSmsCount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [mobileSummaryExpanded, setMobileSummaryExpanded] = useState(false);

  const hasAnyToletSub = useMemo(
    () => history.some((h) => h.product_type === "tolet"),
    [history]
  );

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [subsRes, payRes, discountRes, boostRes, smsRes] = await Promise.all([
      supabase.from("user_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("subscription_payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("landlord_discounts").select("discount_type, discount_percent").eq("user_id", user.id).eq("is_active", true).limit(1),
      supabase.from("boost_balances").select("*").eq("user_id", user.id),
      supabase.from("sms_balances").select("*").eq("user_id", user.id),
    ]);

    const allSubs = subsRes.data;
    if (allSubs) {
      const now = new Date();
      const isActive = (s: any) => s.status === "active" && (!s.expires_at || new Date(s.expires_at) > now);

      // Aggregate all active subs per product type
      const aggregateSubs = (productType: string): ActiveSub | null => {
        const activeSubs = allSubs.filter((s: any) => s.product_type === productType && isActive(s));
        if (activeSubs.length === 0) return null;
        // Use the first sub as base, then aggregate counts and find latest expiry
        const base = { ...activeSubs[0] } as ActiveSub;
        base.room_count = activeSubs.reduce((sum: number, s: any) => sum + (s.room_count || 0), 0);
        base.tolet_count = activeSubs.reduce((sum: number, s: any) => sum + (s.tolet_count || 0), 0);
        base.sale_listing_count = activeSubs.reduce((sum: number, s: any) => sum + (s.sale_listing_count || 0), 0);
        // Use the latest expires_at
        const latestExpiry = activeSubs.reduce((latest: string | null, s: any) => {
          if (!s.expires_at) return latest;
          if (!latest) return s.expires_at;
          return new Date(s.expires_at) > new Date(latest) ? s.expires_at : latest;
        }, null as string | null);
        base.expires_at = latestExpiry;
        return base;
      };

      setActiveRoomSub(aggregateSubs("room_management"));
      setActiveToletSub(aggregateSubs("tolet"));
      setActiveSaleSub(aggregateSubs("sale_listing"));
      setHistory(allSubs as HistorySub[]);
    }

    const { data: usedSaleListings } = await supabase.from("sale_listings").select("id").eq("owner_id", user.id).eq("sale_slot_used", true);
    setSaleUsedCount(usedSaleListings?.length || 0);
    setPaymentHistory(payRes.data || []);
    setBoostBalances(boostRes.data || []);

    const smsData = smsRes.data || [];
    setSmsBalance({ total: smsData.reduce((s: number, b: any) => s + b.total_count, 0), used: smsData.reduce((s: number, b: any) => s + b.used_count, 0) });

    if (discountRes.data && discountRes.data.length > 0) {
      setLandlordDiscount(discountRes.data[0]);
    } else {
      setLandlordDiscount(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Payment callback
  useEffect(() => {
    const payment = searchParams.get("payment");
    const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id");
    if (payment === "success" && transactionId && user) {
      setVerifying(true);
      setPaymentResult(null);
      supabase.functions.invoke("verify-subscription-payment", { body: { transaction_id: transactionId } }).then(({ data, error }) => {
        if (error) { setPaymentResult("failed"); toast.error(language === "bn" ? "পেমেন্ট ভেরিফিকেশন ব্যর্থ" : "Payment verification failed"); }
        else if (data?.status === "completed") { setPaymentResult("success"); toast.success(language === "bn" ? "সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে!" : "Subscription activated successfully!"); fetchData(); }
        else if (data?.status === "pending") { setPaymentResult("success"); toast.info(language === "bn" ? "পেমেন্ট প্রসেসিং হচ্ছে..." : "Payment is being processed..."); }
        else { setPaymentResult("failed"); toast.error(data?.message || "Payment verification failed"); }
        setVerifying(false);
        setSearchParams({}, { replace: true });
      });
    } else if (payment === "cancel") {
      setPaymentResult("cancel");
      toast.error(language === "bn" ? "পেমেন্ট বাতিল করা হয়েছে" : "Payment was cancelled");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user]);

  // ─── Pricing Calculations ───
  const isFreeForever = landlordDiscount?.discount_type === "free_forever";
  const specialDiscountPct = landlordDiscount ? landlordDiscount.discount_percent : 0;
  const durationDiscountPct = getDurationDiscount(duration);

  const calcLinePrice = (count: number, unitPrice: number, useDuration: boolean) => {
    if (count === 0) return { base: 0, durationDiscount: 0, specialDiscount: 0, total: 0 };
    const base = count * unitPrice * (useDuration ? duration : 1);
    const durationDiscountAmt = useDuration ? Math.round(base * (durationDiscountPct / 100)) : 0;
    const afterDuration = base - durationDiscountAmt;
    const specialDiscountAmt = isFreeForever ? afterDuration : Math.round(afterDuration * (specialDiscountPct / 100));
    const total = afterDuration - specialDiscountAmt;
    return { base, durationDiscount: durationDiscountAmt, specialDiscount: specialDiscountAmt, total };
  };

  const roomPrice = calcLinePrice(roomCount, PRICE_PER_ROOM, true);
  const toletPrice = calcLinePrice(toletCount, PRICE_PER_TOLET, true);
  const salePrice = calcLinePrice(saleCount, PRICE_PER_SALE_LISTING, true);
  const boost3Price = calcLinePrice(boost3Count, BOOST_PRICES["3_day"], false);
  const boost7Price = calcLinePrice(boost7Count, BOOST_PRICES["7_day"], false);
  const smsPrice = calcLinePrice(smsCount, PRICE_PER_SMS, false);

  const grandTotal = roomPrice.total + toletPrice.total + salePrice.total + boost3Price.total + boost7Price.total + smsPrice.total;
  const totalBase = roomPrice.base + toletPrice.base + salePrice.base + boost3Price.base + boost7Price.base + smsPrice.base;
  const totalDiscount = totalBase - grandTotal;
  const hasSelection = roomCount > 0 || toletCount > 0 || saleCount > 0 || boost3Count > 0 || boost7Count > 0 || smsCount > 0;

  // Active sub stats
  const boost3DayTotal = boostBalances.filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.total_count, 0);
  const boost3DayUsed = boostBalances.filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.used_count, 0);
  const boost7DayTotal = boostBalances.filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.total_count, 0);
  const boost7DayUsed = boostBalances.filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.used_count, 0);
  const smsRemaining = smsBalance.total - smsBalance.used;
  const saleSubs = history.filter(s => s.product_type === "sale_listing" && s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date()));
  const saleTotalSlots = saleSubs.reduce((sum, s) => sum + (s.sale_listing_count || 0), 0);
  const saleRemainingSlots = Math.max(0, saleTotalSlots - saleUsedCount);

  const roomDaysRemaining = activeRoomSub?.expires_at ? Math.max(0, Math.ceil((new Date(activeRoomSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const toletDaysRemaining = activeToletSub?.expires_at ? Math.max(0, Math.ceil((new Date(activeToletSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  const saleDaysRemaining = activeSaleSub?.expires_at ? Math.max(0, Math.ceil((new Date(activeSaleSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  // ─── Add all to cart ───
  const handleAddAllToCart = () => {
    if (!hasSelection) return;
    let added = 0;
    if (roomCount > 0) { addItem({ type: "room_management", label: "Room/Flat", labelBn: "রুম/ফ্ল্যাট", count: roomCount, durationMonths: duration, unitPrice: PRICE_PER_ROOM, discountPercent: durationDiscountPct, couponCode, lineTotal: roomPrice.total }); added++; }
    if (toletCount > 0) { addItem({ type: "tolet", label: "To-Let", labelBn: "টু-লেট", count: toletCount, durationMonths: duration, unitPrice: PRICE_PER_TOLET, discountPercent: durationDiscountPct, couponCode, lineTotal: toletPrice.total }); added++; }
    if (saleCount > 0) { addItem({ type: "sale_listing", label: "Sale Listing", labelBn: "বিক্রয় লিস্টিং", count: saleCount, durationMonths: duration, unitPrice: PRICE_PER_SALE_LISTING, discountPercent: durationDiscountPct, couponCode, lineTotal: salePrice.total }); added++; }
    if (boost3Count > 0) { addItem({ type: "boost_3_day", label: "3-Day Boost", labelBn: "৩ দিনের বুস্ট", count: boost3Count, durationMonths: 0, unitPrice: BOOST_PRICES["3_day"], discountPercent: 0, couponCode: "", lineTotal: boost3Price.total }); added++; }
    if (boost7Count > 0) { addItem({ type: "boost_7_day", label: "7-Day Boost", labelBn: "৭ দিনের বুস্ট", count: boost7Count, durationMonths: 0, unitPrice: BOOST_PRICES["7_day"], discountPercent: 0, couponCode: "", lineTotal: boost7Price.total }); added++; }
    if (smsCount > 0) { addItem({ type: "sms", label: "SMS", labelBn: "SMS", count: smsCount, durationMonths: 0, unitPrice: PRICE_PER_SMS, discountPercent: 0, couponCode: "", lineTotal: smsPrice.total }); added++; }
    if (added > 0) {
      toast.success(language === "bn" ? `${added}টি আইটেম কার্টে যোগ হয়েছে!` : `${added} item(s) added to cart!`);
      setIsCartOpen(true);
    }
  };

  // ─── Early returns ───
  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">{language === "bn" ? "পেমেন্ট ভেরিফাই হচ্ছে..." : "Verifying payment..."}</p>
        <p className="text-sm text-muted-foreground">{language === "bn" ? "অনুগ্রহ করে অপেক্ষা করুন" : "Please wait"}</p>
      </div>
    );
  }

  if (paymentResult === "cancel") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium text-foreground">{language === "bn" ? "পেমেন্ট বাতিল হয়েছে" : "Payment Cancelled"}</p>
        <Button onClick={() => setPaymentResult(null)}>{language === "bn" ? "আবার চেষ্টা করুন" : "Try Again"}</Button>
      </div>
    );
  }

  if (paymentResult === "failed") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium text-foreground">{language === "bn" ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment Failed"}</p>
        <Button onClick={() => setPaymentResult(null)}>{language === "bn" ? "আবার চেষ্টা করুন" : "Try Again"}</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  /* ─── Summary Line Items ─── */
  const summaryLines: { label: string; detail: string; price: number }[] = [];
  if (roomCount > 0) summaryLines.push({ label: language === "bn" ? "রুম/ফ্ল্যাট" : "Room/Flat", detail: `${roomCount} × ${getDurationLabel(duration, language)}`, price: roomPrice.total });
  if (toletCount > 0) summaryLines.push({ label: language === "bn" ? "টু-লেট" : "To-Let", detail: `${toletCount} × ${getDurationLabel(duration, language)}`, price: toletPrice.total });
  if (saleCount > 0) summaryLines.push({ label: language === "bn" ? "বিক্রয় লিস্টিং" : "Sale Listing", detail: `${saleCount} × ${getDurationLabel(duration, language)}`, price: salePrice.total });
  if (boost3Count > 0) summaryLines.push({ label: language === "bn" ? "৩ দিনের বুস্ট" : "3-Day Boost", detail: `× ${boost3Count}`, price: boost3Price.total });
  if (boost7Count > 0) summaryLines.push({ label: language === "bn" ? "৭ দিনের বুস্ট" : "7-Day Boost", detail: `× ${boost7Count}`, price: boost7Price.total });
  if (smsCount > 0) summaryLines.push({ label: "SMS", detail: `× ${smsCount}`, price: smsPrice.total });

  /* ─── Summary Panel (reused desktop + mobile) ─── */
  const SummaryContent = () => (
    <div className="space-y-3">
      {summaryLines.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {language === "bn" ? "আইটেম নির্বাচন করুন" : "Select items to see summary"}
        </p>
      ) : (
        <>
          {summaryLines.map((line, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-foreground">{line.label}</span>
                <span className="text-muted-foreground ml-1 text-xs">{line.detail}</span>
              </div>
              <span className="font-medium text-foreground">৳{line.price}</span>
            </div>
          ))}
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{language === "bn" ? "মোট ছাড়" : "Total Discount"}</span>
              <span>-৳{totalDiscount}</span>
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="font-semibold text-foreground">{language === "bn" ? "সর্বমোট" : "Grand Total"}</span>
            <span className="text-2xl font-bold text-primary">৳{grandTotal}</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Crown className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{language === "bn" ? "সাবস্ক্রিপশন" : "Subscription"}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {cartCount > 0 && (
            <Button variant="outline" size="sm" className="gap-2 relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-4 w-4" />
              {language === "bn" ? "কার্ট" : "Cart"}
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{cartCount}</Badge>
            </Button>
          )}
          <Dialog open={paymentStatusOpen} onOpenChange={setPaymentStatusOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Banknote className="h-4 w-4" />
                {language === "bn" ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}
                {paymentHistory.filter(p => p.status === "manual_pending" || p.status === "pending").length > 0 && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-orange-500 inline-block" />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" />{language === "bn" ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {paymentHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{language === "bn" ? "কোনো পেমেন্ট নেই" : "No payments found"}</p>
                ) : (
                  paymentHistory.map((p) => {
                    const statusConfig: Record<string, { label: string; labelBn: string; className: string }> = {
                      pending: { label: "Pending", labelBn: "অপেক্ষমাণ", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
                      manual_pending: { label: "Awaiting Approval", labelBn: "অনুমোদনের অপেক্ষায়", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
                      completed: { label: "Completed", labelBn: "সম্পন্ন", className: "bg-green-500/10 text-green-600 border-green-500/20" },
                      rejected: { label: "Rejected", labelBn: "প্রত্যাখ্যাত", className: "bg-red-500/10 text-red-600 border-red-500/20" },
                      failed: { label: "Failed", labelBn: "ব্যর্থ", className: "bg-red-500/10 text-red-600 border-red-500/20" },
                    };
                    const sc = statusConfig[p.status] || statusConfig.pending;
                    return (
                      <Card key={p.id} className="border">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{p.product_type === "tolet" ? `${p.tolet_count} ${language === "bn" ? "টু-লেট" : "To-Let"}` : `${p.room_count} ${language === "bn" ? "রুম" : "Rooms"}`} × {p.duration_months} {language === "bn" ? "মাস" : "mo"}</span>
                            <Badge className={`${sc.className} hover:${sc.className}`}>{language === "bn" ? sc.labelBn : sc.label}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between"><span>{language === "bn" ? "পরিমাণ:" : "Amount:"}</span><span className="font-medium text-foreground">৳{Number(p.amount).toLocaleString()}</span></div>
                            {p.transaction_id && <div className="flex justify-between"><span>TXN ID:</span><span className="font-mono text-xs">{p.transaction_id}</span></div>}
                            <div className="flex justify-between"><span>{language === "bn" ? "তারিখ:" : "Date:"}</span><span>{formatDate(p.created_at)}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2"><History className="h-4 w-4" />{language === "bn" ? "ক্রয়ের ইতিহাস" : "Purchase History"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" />{language === "bn" ? "ক্রয়ের ইতিহাস" : "Purchase History"}</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{language === "bn" ? "কোনো ইতিহাস নেই" : "No purchase history"}</p>
                ) : (
                  history.map((sub) => (
                    <Card key={sub.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {sub.product_type === "tolet" ? `${sub.tolet_count} ${language === "bn" ? "টু-লেট" : "To-Let"}` : sub.product_type === "sale_listing" ? `${sub.sale_listing_count} ${language === "bn" ? "বিক্রয়" : "Sale"}` : `${sub.room_count || 1} ${language === "bn" ? "রুম" : "Rooms"}`} × {sub.duration_months || 1} {language === "bn" ? "মাস" : "mo"}
                          </span>
                          <Badge className={sub.status === "active" ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10" : "bg-muted text-muted-foreground"}>
                            {sub.status === "active" ? (language === "bn" ? "সক্রিয়" : "Active") : (language === "bn" ? "মেয়াদোত্তীর্ণ" : "Expired")}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex justify-between"><span>{language === "bn" ? "শুরু:" : "Start:"}</span><span>{formatDate(sub.starts_at)}</span></div>
                          {sub.expires_at && <div className="flex justify-between"><span>{language === "bn" ? "মেয়াদ:" : "Expires:"}</span><span>{formatDate(sub.expires_at)}</span></div>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Special Discount Banner */}
      {landlordDiscount && (
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-purple-600/10 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Gift className="h-5 w-5 text-purple-600" />
            <p className="font-semibold text-foreground">
              {isFreeForever
                ? (language === "bn" ? "🎉 আপনার অ্যাকাউন্টে চিরকাল ফ্রি সুবিধা সক্রিয়!" : "🎉 Free Forever discount is active on your account!")
                : (language === "bn" ? `🎉 আপনার সব কেনাকাটায় ${specialDiscountPct}% বিশেষ ছাড় সক্রিয়!` : `🎉 ${specialDiscountPct}% special discount is active on all your purchases!`)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Subscriptions — compact */}
      {(activeRoomSub || activeToletSub || activeSaleSub || boost3DayTotal > 0 || boost7DayTotal > 0 || smsBalance.total > 0) && (
        <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-600/10 dark:from-green-950/30 dark:to-green-900/20">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {language === "bn" ? "সক্রিয় ব্যালেন্স" : "Active Balance"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeRoomSub && (
                <div className="bg-background/60 rounded-lg p-2.5 border text-center">
                  <Package className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">{activeRoomSub.room_count}</p>
                  <p className="text-[10px] text-muted-foreground">{language === "bn" ? "রুম" : "Rooms"} · {roomDaysRemaining}{language === "bn" ? " দিন" : "d"}</p>
                </div>
              )}
              {activeToletSub && (
                <div className="bg-background/60 rounded-lg p-2.5 border text-center">
                  <Megaphone className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                  <p className="text-lg font-bold text-foreground">{activeToletSub.tolet_count}</p>
                  <p className="text-[10px] text-muted-foreground">{language === "bn" ? "টু-লেট" : "To-Let"} · {toletDaysRemaining}{language === "bn" ? " দিন" : "d"}</p>
                </div>
              )}
              {activeSaleSub && (
                <div className="bg-background/60 rounded-lg p-2.5 border text-center">
                  <ShoppingBag className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-bold text-foreground">{saleRemainingSlots}</p>
                  <p className="text-[10px] text-muted-foreground">{language === "bn" ? "বিক্রয়" : "Sale"} · {saleDaysRemaining}{language === "bn" ? " দিন" : "d"}</p>
                </div>
              )}
              {(boost3DayTotal > 0 || boost7DayTotal > 0) && (
                <div className="bg-background/60 rounded-lg p-2.5 border text-center">
                  <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                  <p className="text-lg font-bold text-foreground">{(boost3DayTotal - boost3DayUsed) + (boost7DayTotal - boost7DayUsed)}</p>
                  <p className="text-[10px] text-muted-foreground">{language === "bn" ? "বুস্ট বাকি" : "Boosts Left"}</p>
                </div>
              )}
              {smsBalance.total > 0 && (
                <div className="bg-background/60 rounded-lg p-2.5 border text-center">
                  <MessageSquare className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold text-foreground">{smsRemaining}</p>
                  <p className="text-[10px] text-muted-foreground">{language === "bn" ? "SMS বাকি" : "SMS Left"}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Main Configurator Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Sections */}
        <div className="lg:col-span-2 space-y-5">
          {/* Room/Flat */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">{language === "bn" ? "রুম/ফ্ল্যাট" : "Room/Flat"}</h3>
                <span className="text-xs text-muted-foreground ml-auto">৳{PRICE_PER_ROOM}/{language === "bn" ? "রুম" : "room"}/{language === "bn" ? "মাস" : "mo"}</span>
              </div>
              <ChipSelector chips={ROOM_CHIPS} value={roomCount} onChange={setRoomCount} />
            </CardContent>
          </Card>

          {/* To-Let */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-foreground">{language === "bn" ? "টু-লেট" : "To-Let"}</h3>
                <span className="text-xs text-muted-foreground ml-auto">৳{PRICE_PER_TOLET}/{language === "bn" ? "স্লট" : "slot"}/{language === "bn" ? "মাস" : "mo"}</span>
              </div>
              {!hasAnyToletSub && (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-2.5 flex items-start gap-2">
                  <Gift className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{language === "bn" ? "🎉 প্রথম ক্রয়ে ২টি ফ্রি টু-লেট!" : "🎉 2 Free To-Let on First Purchase!"}</p>
                </div>
              )}
              <ChipSelector chips={TOLET_CHIPS} value={toletCount} onChange={setToletCount} />
            </CardContent>
          </Card>

          {/* Sale Listing */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-foreground">{language === "bn" ? "বিক্রয় লিস্টিং" : "Sale Listing"}</h3>
                <span className="text-xs text-muted-foreground ml-auto">৳{PRICE_PER_SALE_LISTING}/{language === "bn" ? "লিস্টিং" : "listing"}/{language === "bn" ? "মাস" : "mo"}</span>
              </div>
              <ChipSelector chips={SALE_CHIPS} value={saleCount} onChange={setSaleCount} />
            </CardContent>
          </Card>

          {/* Duration (shared) */}
          {(roomCount > 0 || toletCount > 0 || saleCount > 0) && (
            <Card className="border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{language === "bn" ? "মেয়াদ" : "Duration"}</h3>
                </div>
                <ChipSelector
                  chips={DURATION_CHIPS}
                  value={duration}
                  onChange={setDuration}
                  suffix={language === "bn" ? " মাস" : " mo"}
                />
                {durationDiscountPct > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500 text-white hover:bg-green-500"><Tag className="h-3 w-3 mr-1" />{durationDiscountPct}% {language === "bn" ? "ছাড়" : "OFF"}</Badge>
                    <span className="text-xs text-muted-foreground">{language === "bn" ? "৬+ মাসে ৫%-৩৫% ছাড়" : "5%-35% discount for 6+ months"}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Boost */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-foreground">{language === "bn" ? "বুস্ট" : "Boost"}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-foreground mb-2">{language === "bn" ? "৩ দিনের বুস্ট" : "3-Day Boost"} <span className="text-xs text-muted-foreground">(৳{BOOST_PRICES["3_day"]}/{language === "bn" ? "টি" : "ea"})</span></p>
                  <ChipSelector chips={BOOST3_CHIPS} value={boost3Count} onChange={setBoost3Count} />
                </div>
                <div>
                  <p className="text-sm text-foreground mb-2">{language === "bn" ? "৭ দিনের বুস্ট" : "7-Day Boost"} <span className="text-xs text-muted-foreground">(৳{BOOST_PRICES["7_day"]}/{language === "bn" ? "টি" : "ea"})</span></p>
                  <ChipSelector chips={BOOST7_CHIPS} value={boost7Count} onChange={setBoost7Count} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-foreground">SMS</h3>
                <span className="text-xs text-muted-foreground ml-auto">৳{PRICE_PER_SMS}/SMS</span>
              </div>
              <ChipSelector chips={SMS_CHIPS} value={smsCount} onChange={setSmsCount} />
            </CardContent>
          </Card>

          {/* Coupon */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={language === "bn" ? "কুপন কোড (ঐচ্ছিক)" : "Coupon code (optional)"}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" disabled={!couponCode}>{language === "bn" ? "প্রয়োগ" : "Apply"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Sticky Summary (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <Card className="border-primary/20">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {language === "bn" ? "অর্ডার সারাংশ" : "Order Summary"}
                </h3>
                <SummaryContent />
                <Button
                  className="w-full h-12 text-base gap-2"
                  onClick={handleAddAllToCart}
                  disabled={!hasSelection}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {hasSelection
                    ? (language === "bn" ? `৳${grandTotal} — কার্টে যোগ করুন` : `৳${grandTotal} — Add to Cart`)
                    : (language === "bn" ? "আইটেম নির্বাচন করুন" : "Select Items")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => { setManualPayType("room_management"); setManualPayOpen(true); }}
                >
                  <Banknote className="h-4 w-4" />
                  {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Pay Manually"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile: Sticky Bottom Summary Bar */}
      {isMobile && (
        <div className="fixed bottom-16 inset-x-0 z-40 bg-background border-t border-border shadow-lg">
          {mobileSummaryExpanded && (
            <div className="p-4 border-b border-border max-h-60 overflow-y-auto">
              <SummaryContent />
              <Button
                variant="outline"
                className="w-full mt-3 gap-2"
                size="sm"
                onClick={() => { setManualPayType("room_management"); setManualPayOpen(true); }}
              >
                <Banknote className="h-3.5 w-3.5" />
                {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Pay Manually"}
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setMobileSummaryExpanded(!mobileSummaryExpanded)}
              className="flex items-center gap-1 text-sm"
            >
              {mobileSummaryExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              <span className="font-bold text-lg text-primary">৳{grandTotal}</span>
              {totalDiscount > 0 && <span className="text-xs text-green-600 ml-1">(-৳{totalDiscount})</span>}
            </button>
            <Button
              className="flex-1 h-10 gap-2"
              onClick={handleAddAllToCart}
              disabled={!hasSelection}
            >
              <ShoppingCart className="h-4 w-4" />
              {language === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ManualPaymentDialog
        open={manualPayOpen}
        onOpenChange={setManualPayOpen}
        productType={manualPayType}
        roomCount={roomCount}
        toletCount={toletCount}
        durationMonths={duration}
        discountPercent={durationDiscountPct}
        couponCode={couponCode}
        totalPrice={grandTotal}
        onSuccess={() => fetchData()}
      />
      <CartDrawer />
    </div>
  );
};

export default Subscription;
