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
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Crown,
  Minus,
  Plus,
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
} from "lucide-react";
import { toast } from "sonner";
import ManualPaymentDialog from "@/components/subscription/ManualPaymentDialog";
import CartDrawer from "@/components/subscription/CartDrawer";

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
const SMS_PACKAGES = [100, 200, 500, 1000];

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

const Subscription = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { addItem, cartCount, setIsCartOpen } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRoomSub, setActiveRoomSub] = useState<ActiveSub | null>(null);
  const [activeToletSub, setActiveToletSub] = useState<ActiveSub | null>(null);
  const [activeSaleSub, setActiveSaleSub] = useState<ActiveSub | null>(null);
  const [history, setHistory] = useState<HistorySub[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [productTab, setProductTab] = useState(() => {
    const tab = searchParams.get("tab");
    if (tab === "tolet") return "tolet";
    if (tab === "boosting") return "boosting";
    if (tab === "sale_listing") return "sale_listing";
    return "room_management";
  });
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<"success" | "cancel" | "failed" | null>(null);
  const [manualPayOpen, setManualPayOpen] = useState(false);
  const [manualPayType, setManualPayType] = useState<"room_management" | "tolet" | "boost" | "sale_listing">("room_management");
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [landlordDiscount, setLandlordDiscount] = useState<{ discount_type: string; discount_percent: number } | null>(null);

  // Boost state
  const [boostBalances, setBoostBalances] = useState<any[]>([]);
  const [boostType, setBoostType] = useState<"3_day" | "7_day">("3_day");
  const [boostCount, setBoostCount] = useState(1);

  // Room configurator state
  const [roomCount, setRoomCount] = useState(5);
  const [roomDuration, setRoomDuration] = useState(1);
  const [roomCoupon, setRoomCoupon] = useState("");

  // To-Let configurator state
  const [toletCount, setToletCount] = useState(1);
  const [toletDuration, setToletDuration] = useState(1);
  const [toletCoupon, setToletCoupon] = useState("");

  // Sale listing configurator state
  const [saleCount, setSaleCount] = useState(1);
  const [saleDuration, setSaleDuration] = useState(1);
  const [saleCoupon, setSaleCoupon] = useState("");

  // Sale listing used count
  const [saleUsedCount, setSaleUsedCount] = useState(0);

  const hasAnyToletSub = useMemo(
    () => history.some((h) => h.product_type === "tolet"),
    [history]
  );

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [subsRes, payRes, discountRes, boostRes] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscription_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("landlord_discounts")
        .select("discount_type, discount_percent")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1),
      supabase
        .from("boost_balances")
        .select("*")
        .eq("user_id", user.id),
    ]);

    const allSubs = subsRes.data;
    if (allSubs) {
      const now = new Date();
      const activeRoom = allSubs.find(
        (s: any) =>
          s.product_type === "room_management" &&
          s.status === "active" &&
          (!s.expires_at || new Date(s.expires_at) > now)
      );
      const activeTolet = allSubs.find(
        (s: any) =>
          s.product_type === "tolet" &&
          s.status === "active" &&
          (!s.expires_at || new Date(s.expires_at) > now)
      );
      const activeSale = allSubs.find(
        (s: any) =>
          s.product_type === "sale_listing" &&
          s.status === "active" &&
          (!s.expires_at || new Date(s.expires_at) > now)
      );
      setActiveRoomSub((activeRoom as ActiveSub) || null);
      setActiveToletSub((activeTolet as ActiveSub) || null);
      setActiveSaleSub((activeSale as ActiveSub) || null);
      setHistory(allSubs as HistorySub[]);
    }

    // Fetch sale listing used count
    const { data: usedSaleListings } = await supabase
      .from("sale_listings")
      .select("id")
      .eq("owner_id", user.id)
      .eq("sale_slot_used", true);
    setSaleUsedCount(usedSaleListings?.length || 0);

    setPaymentHistory(payRes.data || []);
    setBoostBalances(boostRes.data || []);
    
    // Set landlord discount
    if (discountRes.data && discountRes.data.length > 0) {
      setLandlordDiscount(discountRes.data[0]);
    } else {
      setLandlordDiscount(null);
    }
    
    setLoading(false);
  };

  // Boost balance calculations
  const boost3DayTotal = boostBalances.filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.total_count, 0);
  const boost3DayUsed = boostBalances.filter((b: any) => b.boost_type === "3_day").reduce((s: number, b: any) => s + b.used_count, 0);
  const boost7DayTotal = boostBalances.filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.total_count, 0);
  const boost7DayUsed = boostBalances.filter((b: any) => b.boost_type === "7_day").reduce((s: number, b: any) => s + b.used_count, 0);
  const boost3DayRemaining = boost3DayTotal - boost3DayUsed;
  const boost7DayRemaining = boost7DayTotal - boost7DayUsed;
  const boostTotalPrice = BOOST_PRICES[boostType] * boostCount;

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle payment callback from URL params
  useEffect(() => {
    const payment = searchParams.get("payment");
    const transactionId = searchParams.get("transactionId") || searchParams.get("transaction_id");

    if (payment === "success" && transactionId && user) {
      setVerifying(true);
      setPaymentResult(null);

      supabase.functions
        .invoke("verify-subscription-payment", {
          body: { transaction_id: transactionId },
        })
        .then(({ data, error }) => {
          if (error) {
            setPaymentResult("failed");
            toast.error(language === "bn" ? "পেমেন্ট ভেরিফিকেশন ব্যর্থ" : "Payment verification failed");
          } else if (data?.status === "completed") {
            setPaymentResult("success");
            toast.success(language === "bn" ? "সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে!" : "Subscription activated successfully!");
            fetchData();
          } else if (data?.status === "pending") {
            setPaymentResult("success");
            toast.info(language === "bn" ? "পেমেন্ট প্রসেসিং হচ্ছে..." : "Payment is being processed...");
          } else {
            setPaymentResult("failed");
            toast.error(data?.message || "Payment verification failed");
          }
          setVerifying(false);
          // Clean URL params
          setSearchParams({}, { replace: true });
        });
    } else if (payment === "cancel") {
      setPaymentResult("cancel");
      toast.error(language === "bn" ? "পেমেন্ট বাতিল করা হয়েছে" : "Payment was cancelled");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user]);

  // Landlord special discount
  const isFreeForever = landlordDiscount?.discount_type === "free_forever";
  const specialDiscountPct = landlordDiscount ? landlordDiscount.discount_percent : 0;

  // Room pricing
  const roomDurationDiscountPct = getDurationDiscount(roomDuration);
  const roomBasePrice = roomCount * PRICE_PER_ROOM * roomDuration;
  const roomDurationDiscountAmount = Math.round(roomBasePrice * (roomDurationDiscountPct / 100));
  const roomAfterDurationDiscount = roomBasePrice - roomDurationDiscountAmount;
  const roomSpecialDiscountAmount = isFreeForever ? roomAfterDurationDiscount : Math.round(roomAfterDurationDiscount * (specialDiscountPct / 100));
  const roomTotalPrice = roomAfterDurationDiscount - roomSpecialDiscountAmount;
  const roomDiscountPct = roomDurationDiscountPct;
  const roomDiscountAmount = roomDurationDiscountAmount;

  const roomCurrentExpiry = activeRoomSub?.expires_at ? new Date(activeRoomSub.expires_at) : new Date();
  const roomNewExpiry = new Date(roomCurrentExpiry.getTime() + roomDuration * 30 * 24 * 60 * 60 * 1000);
  const roomDaysRemaining = activeRoomSub?.expires_at
    ? Math.max(0, Math.ceil((new Date(activeRoomSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // To-Let pricing
  const toletDurationDiscountPct = getDurationDiscount(toletDuration);
  const toletBasePrice = toletCount * PRICE_PER_TOLET * toletDuration;
  const toletDurationDiscountAmount = Math.round(toletBasePrice * (toletDurationDiscountPct / 100));
  const toletAfterDurationDiscount = toletBasePrice - toletDurationDiscountAmount;
  const toletSpecialDiscountAmount = isFreeForever ? toletAfterDurationDiscount : Math.round(toletAfterDurationDiscount * (specialDiscountPct / 100));
  const toletTotalPrice = toletAfterDurationDiscount - toletSpecialDiscountAmount;
  const toletDiscountPct = toletDurationDiscountPct;
  const toletDiscountAmount = toletDurationDiscountAmount;

  const toletCurrentExpiry = activeToletSub?.expires_at ? new Date(activeToletSub.expires_at) : new Date();
  const toletNewExpiry = new Date(toletCurrentExpiry.getTime() + toletDuration * 30 * 24 * 60 * 60 * 1000);
  const toletDaysRemaining = activeToletSub?.expires_at
    ? Math.max(0, Math.ceil((new Date(activeToletSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Sale Listing pricing
  const saleDurationDiscountPct = getDurationDiscount(saleDuration);
  const saleBasePrice = saleCount * PRICE_PER_SALE_LISTING * saleDuration;
  const saleDurationDiscountAmount = Math.round(saleBasePrice * (saleDurationDiscountPct / 100));
  const saleAfterDurationDiscount = saleBasePrice - saleDurationDiscountAmount;
  const saleSpecialDiscountAmount = isFreeForever ? saleAfterDurationDiscount : Math.round(saleAfterDurationDiscount * (specialDiscountPct / 100));
  const saleTotalPrice = saleAfterDurationDiscount - saleSpecialDiscountAmount;
  const saleDiscountPct = saleDurationDiscountPct;
  const saleDiscountAmount = saleDurationDiscountAmount;

  const saleCurrentExpiry = activeSaleSub?.expires_at ? new Date(activeSaleSub.expires_at) : new Date();
  const saleNewExpiry = new Date(saleCurrentExpiry.getTime() + saleDuration * 30 * 24 * 60 * 60 * 1000);
  const saleDaysRemaining = activeSaleSub?.expires_at
    ? Math.max(0, Math.ceil((new Date(activeSaleSub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Sale listing balance
  const saleSubs = history.filter(s => s.product_type === "sale_listing" && s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date()));
  const saleTotalSlots = saleSubs.reduce((sum, s) => sum + (s.sale_listing_count || 0), 0);
  const saleRemainingSlots = Math.max(0, saleTotalSlots - saleUsedCount);

  const handleSubscribe = async (type: "room_management" | "tolet" | "sale_listing") => {
    if (!user) return;
    setSubscribing(true);

    try {
      const isRoom = type === "room_management";
      const isTolet = type === "tolet";
      const isSale = type === "sale_listing";
      const count = isRoom ? roomCount : isTolet ? toletCount : saleCount;
      const duration = isRoom ? roomDuration : isTolet ? toletDuration : saleDuration;
      const discountPct = isRoom ? roomDiscountPct : isTolet ? toletDiscountPct : saleDiscountPct;
      const coupon = isRoom ? roomCoupon : isTolet ? toletCoupon : saleCoupon;
      const total = isRoom ? roomTotalPrice : isTolet ? toletTotalPrice : saleTotalPrice;

      // Get the current site URL for redirect
      const siteUrl = window.location.origin;

      const { data, error } = await supabase.functions.invoke("create-subscription-payment", {
        body: {
          product_type: type,
          room_count: isRoom ? count : 0,
          tolet_count: isTolet ? count : 0,
          sale_listing_count: isSale ? count : 0,
          duration_months: duration,
          discount_percent: discountPct,
          coupon_code: coupon || null,
          success_url: `${siteUrl}/dashboard/subscription?payment=success`,
          cancel_url: `${siteUrl}/dashboard/subscription?payment=cancel`,
        },
      });

      if (error) throw new Error(error.message || "Payment creation failed");
      if (!data?.payment_url) throw new Error(data?.error || "No payment URL received");

      // Redirect to payment gateway
      window.location.href = data.payment_url;
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
      setSubscribing(false);
    }
  };

  const handleBoostPurchase = async () => {
    if (!user) return;
    setSubscribing(true);
    try {
      const siteUrl = window.location.origin;
      const { data, error } = await supabase.functions.invoke("create-boost-payment", {
        body: {
          boost_type: boostType,
          count: boostCount,
          success_url: `${siteUrl}/dashboard/subscription?payment=success&tab=boosting`,
          cancel_url: `${siteUrl}/dashboard/subscription?payment=cancel&tab=boosting`,
        },
      });
      if (error) throw new Error(error.message || "Payment creation failed");
      if (!data?.payment_url) throw new Error(data?.error || "No payment URL received");
      window.location.href = data.payment_url;
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
      setSubscribing(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium text-foreground">
          {language === "bn" ? "পেমেন্ট ভেরিফাই হচ্ছে..." : "Verifying payment..."}
        </p>
        <p className="text-sm text-muted-foreground">
          {language === "bn" ? "অনুগ্রহ করে অপেক্ষা করুন" : "Please wait"}
        </p>
      </div>
    );
  }

  if (paymentResult === "cancel") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium text-foreground">
          {language === "bn" ? "পেমেন্ট বাতিল হয়েছে" : "Payment Cancelled"}
        </p>
        <Button onClick={() => setPaymentResult(null)}>
          {language === "bn" ? "আবার চেষ্টা করুন" : "Try Again"}
        </Button>
      </div>
    );
  }

  if (paymentResult === "failed") {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <XCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium text-foreground">
          {language === "bn" ? "পেমেন্ট ব্যর্থ হয়েছে" : "Payment Failed"}
        </p>
        <Button onClick={() => setPaymentResult(null)}>
          {language === "bn" ? "আবার চেষ্টা করুন" : "Try Again"}
        </Button>
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

  const renderCountSelector = (
    count: number,
    setCount: (v: number) => void,
    max: number,
    labelEn: string,
    labelBn: string,
    pricePerUnit: number,
    unitEn: string,
    unitBn: string
  ) => (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        {language === "bn" ? labelBn : labelEn}
      </label>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => setCount(Math.max(1, count - 1))}
            disabled={count <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Slider
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
              min={1}
              max={max}
              step={1}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => setCount(Math.min(max, count + 1))}
            disabled={count >= max}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="min-w-[40px] sm:min-w-[60px] text-right">
            <span className="text-xl sm:text-2xl font-bold text-primary">{count}</span>
          </div>
        </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Info className="h-3 w-3" />
        {language === "bn"
          ? `৳${pricePerUnit}/${unitBn}/মাস`
          : `৳${pricePerUnit}/${unitEn}/month`}
      </p>
    </div>
  );

  const renderDurationSelector = (
    selected: number,
    setSelected: (v: number) => void
  ) => {
    const discount = getDurationDiscount(selected);
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {language === "bn" ? "সময়কাল নির্বাচন করুন" : "Select Duration"}
        </label>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => setSelected(Math.max(1, selected - 1))}
            disabled={selected <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Slider
              value={[selected]}
              onValueChange={(v) => setSelected(v[0])}
              min={1}
              max={36}
              step={1}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => setSelected(Math.min(36, selected + 1))}
            disabled={selected >= 36}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <div className="min-w-[60px] sm:min-w-[80px] text-right">
            <span className="text-lg sm:text-2xl font-bold text-primary">
              {getDurationLabel(selected, language)}
            </span>
          </div>
        </div>
        {discount > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white hover:bg-green-500">
              <Tag className="h-3 w-3 mr-1" />
              {discount}% {language === "bn" ? "ছাড়" : "OFF"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {language === "bn" ? "৬ মাস থেকে ৩৬ মাস পর্যন্ত ৫%-৩৫% ছাড়" : "5%-35% discount for 6-36 months"}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderPriceSummary = (
    count: number,
    duration: number,
    pricePerUnit: number,
    discountPct: number,
    base: number,
    discountAmt: number,
    total: number,
    unitEn: string,
    unitBn: string,
    specialDiscountAmt?: number
  ) => (
    <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {language === "bn"
            ? `${count} ${unitBn} × ${duration} মাস × ৳${pricePerUnit}`
            : `${count} ${unitEn} × ${duration} months × ৳${pricePerUnit}`}
        </span>
        <span className="text-foreground font-medium">৳{base}</span>
      </div>
      {discountAmt > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-green-600 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {language === "bn" ? `ছাড় (${discountPct}%)` : `Discount (${discountPct}%)`}
          </span>
          <span className="text-green-600 font-medium">-৳{discountAmt}</span>
        </div>
      )}
      {(specialDiscountAmt !== undefined && specialDiscountAmt > 0) && (
        <div className="flex justify-between text-sm">
          <span className="text-purple-600 flex items-center gap-1">
            <Gift className="h-3 w-3" />
            {isFreeForever
              ? (language === "bn" ? "বিশেষ ছাড় (ফ্রি)" : "Special Discount (Free)")
              : (language === "bn" ? `বিশেষ ছাড় (${specialDiscountPct}%)` : `Special Discount (${specialDiscountPct}%)`)}
          </span>
          <span className="text-purple-600 font-medium">-৳{specialDiscountAmt}</span>
        </div>
      )}
      <div className="border-t border-border pt-2 flex justify-between">
        <span className="font-semibold text-foreground">
          {language === "bn" ? "মোট" : "Total"}
        </span>
        <span className="text-xl font-bold text-primary">৳{total}</span>
      </div>
    </div>
  );

  const renderRenewalDates = (
    currentExp: string | null | undefined,
    newExp: Date
  ) => (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {language === "bn" ? "বর্তমান মেয়াদ:" : "Current Expiry:"}
        </span>
        <span className="text-foreground">
          {currentExp ? formatDate(currentExp) : language === "bn" ? "আজ" : "Today"}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">
          {language === "bn" ? "নতুন মেয়াদ:" : "New Expiry:"}
        </span>
        <span className="text-primary font-medium">
          {newExp.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );

  const renderActivePackLine = (
    sub: ActiveSub | null,
    daysLeft: number,
    iconEl: React.ReactNode,
    labelEn: string,
    labelBn: string,
    countLabel: string
  ) => {
    if (!sub) return null;
    return (
      <div className="bg-background/60 rounded-lg p-4 border border-green-500/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {iconEl}
              <span className="font-medium text-foreground">{countLabel}</span>
              <Badge variant="outline" className="text-xs">
                {language === "bn" ? labelBn : labelEn}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {language === "bn" ? "মেয়াদ:" : "Expires:"}{" "}
              {sub.expires_at ? formatDate(sub.expires_at) : "N/A"}
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            <Hourglass className="h-3 w-3 mr-1" />
            {daysLeft} {language === "bn" ? "দিন বাকি" : "days remaining"}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Crown className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {language === "bn" ? "সাবস্ক্রিপশন" : "Subscription"}
          </h1>
        </div>
        <div className="flex gap-2">
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
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  {language === "bn" ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {paymentHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {language === "bn" ? "কোনো পেমেন্ট নেই" : "No payments found"}
                  </p>
                ) : (
                  paymentHistory.map((p) => {
                    const statusConfig: Record<string, { label: string; labelBn: string; className: string }> = {
                      pending: { label: "Pending", labelBn: "অপেক্ষমান", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
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
                            <div className="flex items-center gap-2">
                              {p.product_type === "tolet" ? (
                                <Megaphone className="h-4 w-4 text-orange-500" />
                              ) : (
                                <Package className="h-4 w-4 text-primary" />
                              )}
                              <span className="font-medium text-sm">
                                {p.product_type === "tolet"
                                  ? `${p.tolet_count} ${language === "bn" ? "টু-লেট" : "To-Let"}`
                                  : `${p.room_count} ${language === "bn" ? "রুম" : "Rooms"}`}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                × {p.duration_months} {language === "bn" ? "মাস" : "mo"}
                              </span>
                            </div>
                            <Badge className={`${sc.className} hover:${sc.className}`}>
                              {language === "bn" ? sc.labelBn : sc.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                              <span>{language === "bn" ? "পরিমাণ:" : "Amount:"}</span>
                              <span className="font-medium text-foreground">৳{Number(p.amount).toLocaleString()}</span>
                            </div>
                            {p.payment_method && (
                              <div className="flex justify-between">
                                <span>{language === "bn" ? "পদ্ধতি:" : "Method:"}</span>
                                <span>{p.payment_method}</span>
                              </div>
                            )}
                            {p.transaction_id && (
                              <div className="flex justify-between">
                                <span>{language === "bn" ? "TXN ID:" : "TXN ID:"}</span>
                                <span className="font-mono text-xs">{p.transaction_id}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>{language === "bn" ? "তারিখ:" : "Date:"}</span>
                              <span>{formatDate(p.created_at)}</span>
                            </div>
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
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              {language === "bn" ? "ক্রয়ের ইতিহাস" : "Purchase History"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {language === "bn" ? "ক্রয়ের ইতিহাস" : "Purchase History"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {language === "bn" ? "কোনো ইতিহাস নেই" : "No purchase history"}
                </p>
              ) : (
                history.map((sub) => (
                  <Card key={sub.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {sub.product_type === "tolet" ? (
                            <Megaphone className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Package className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium">
                            {sub.product_type === "tolet"
                              ? `${sub.tolet_count} ${language === "bn" ? "টু-লেট" : "To-Let"}`
                              : `${sub.room_count || 1} ${language === "bn" ? "রুম" : "Rooms"}`}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {sub.product_type === "tolet"
                              ? language === "bn" ? "টু-লেট" : "To-Let"
                              : language === "bn" ? "রুম" : "Room"}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            × {sub.duration_months || 1} {language === "bn" ? "মাস" : "mo"}
                          </span>
                        </div>
                        <Badge
                          className={
                            sub.status === "active"
                              ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10"
                              : sub.status === "cancelled"
                              ? "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {sub.status === "active"
                            ? language === "bn" ? "সক্রিয়" : "Active"
                            : sub.status === "cancelled"
                            ? language === "bn" ? "বাতিল" : "Cancelled"
                            : language === "bn" ? "মেয়াদোত্তীর্ণ" : "Expired"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>{language === "bn" ? "শুরু:" : "Start:"}</span>
                          <span>{formatDate(sub.starts_at)}</span>
                        </div>
                        {sub.expires_at && (
                          <div className="flex justify-between">
                            <span>{language === "bn" ? "মেয়াদ:" : "Expires:"}</span>
                            <span>{formatDate(sub.expires_at)}</span>
                          </div>
                        )}
                        {sub.tolet_price_per_unit === 0 && sub.product_type === "tolet" && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 text-[10px]">
                            <Gift className="h-3 w-3 mr-1" />
                            {language === "bn" ? "ফ্রি" : "Free"}
                          </Badge>
                        )}
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
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-purple-600/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Gift className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-semibold text-foreground">
                {isFreeForever
                  ? (language === "bn" ? "🎉 আপনার অ্যাকাউন্টে চিরকাল ফ্রি সুবিধা সক্রিয়!" : "🎉 Free Forever discount is active on your account!")
                  : (language === "bn" ? `🎉 আপনার সব কেনাকাটায় ${specialDiscountPct}% বিশেষ ছাড় সক্রিয়!` : `🎉 ${specialDiscountPct}% special discount is active on all your purchases!`)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-600/10">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {language === "bn" ? "সক্রিয় সাবস্ক্রিপশন" : "Active Subscriptions"}
            </h2>
            <div className="flex items-center gap-2">
              {activeRoomSub && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10">
                  <Home className="h-3 w-3 mr-1" />
                  {activeRoomSub.room_count} {language === "bn" ? "রুম" : "Rooms"}
                </Badge>
              )}
              {activeToletSub && (
                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10">
                  <Megaphone className="h-3 w-3 mr-1" />
                  {activeToletSub.tolet_count} {language === "bn" ? "টু-লেট" : "To-Let"}
                </Badge>
              )}
              {activeSaleSub && (
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/10">
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  {saleRemainingSlots} {language === "bn" ? "বিক্রয় লিস্টিং" : "Sale Listings"}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {renderActivePackLine(
              activeRoomSub,
              roomDaysRemaining,
              <Package className="h-4 w-4 text-primary" />,
              "Room Mgmt",
              "রুম ম্যানেজমেন্ট",
              `${activeRoomSub?.room_count || 0} ${language === "bn" ? "রুম" : "Rooms"}`
            )}
            {renderActivePackLine(
              activeToletSub,
              toletDaysRemaining,
              <Megaphone className="h-4 w-4 text-orange-500" />,
              "To-Let",
              "টু-লেট",
              `${activeToletSub?.tolet_count || 0} ${language === "bn" ? "টু-লেট" : "To-Let"}`
            )}
            {renderActivePackLine(
              activeSaleSub,
              saleDaysRemaining,
              <ShoppingBag className="h-4 w-4 text-purple-600" />,
              "Sale Listing",
              "বিক্রয় লিস্টিং",
              `${saleRemainingSlots} ${language === "bn" ? "বিক্রয় লিস্টিং বাকি" : "Sale Listings Left"}`
            )}
            {!activeRoomSub && !activeToletSub && !activeSaleSub && (
              <div className="bg-background/60 rounded-lg p-4 border text-center">
                <p className="text-muted-foreground">
                  {language === "bn"
                    ? "কোনো সক্রিয় সাবস্ক্রিপশন নেই। নিচে থেকে একটি প্ল্যান কিনুন।"
                    : "No active subscription. Purchase a plan below."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Subscription Configurator with Tabs */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <Tabs value={productTab} onValueChange={setProductTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="room_management" className="gap-1.5 text-xs sm:text-sm">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "bn" ? "রুম/ফ্ল্যাট" : "Room/Flat"}</span>
              </TabsTrigger>
              <TabsTrigger value="tolet" className="gap-1.5 text-xs sm:text-sm">
                <Megaphone className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "bn" ? "টু-লেট" : "To-Let"}</span>
              </TabsTrigger>
              <TabsTrigger value="sale_listing" className="gap-1.5 text-xs sm:text-sm">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "bn" ? "বিক্রয়" : "Sale"}</span>
              </TabsTrigger>
              <TabsTrigger value="boosting" className="gap-1.5 text-xs sm:text-sm">
                <Flame className="h-4 w-4" />
                <span className="hidden sm:inline">{language === "bn" ? "বুস্টিং" : "Boosting"}</span>
              </TabsTrigger>
            </TabsList>

            {/* Room Management Tab */}
            <TabsContent value="room_management" className="space-y-6 mt-6">
              {renderCountSelector(
                roomCount, setRoomCount, 50,
                "Select Number of Rooms", "রুম সংখ্যা নির্বাচন করুন",
                PRICE_PER_ROOM, "room", "রুম"
              )}
              {renderDurationSelector(roomDuration, setRoomDuration)}
              {renderPriceSummary(
                roomCount, roomDuration, PRICE_PER_ROOM,
                roomDiscountPct, roomBasePrice, roomDiscountAmount, roomTotalPrice,
                "rooms", "রুম", roomSpecialDiscountAmount
              )}
              {renderRenewalDates(activeRoomSub?.expires_at, roomNewExpiry)}

              <div className="flex gap-2">
                <Input
                  placeholder={language === "bn" ? "কুপন কোড (ঐচ্ছিক)" : "Coupon code (optional)"}
                  value={roomCoupon}
                  onChange={(e) => setRoomCoupon(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" disabled={!roomCoupon}>
                  {language === "bn" ? "প্রয়োগ" : "Apply"}
                </Button>
              </div>

              <Button
                className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleSubscribe("room_management")}
                disabled={subscribing}
              >
                <ShoppingCart className="h-5 w-5" />
                {subscribing
                  ? language === "bn" ? "প্রসেসিং..." : "Processing..."
                  : language === "bn"
                  ? `৳${roomTotalPrice} — এখনই কিনুন`
                  : `৳${roomTotalPrice} — Buy Now`}
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={() => { setManualPayType("room_management"); setManualPayOpen(true); }}
              >
                <Banknote className="h-4 w-4" />
                {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Pay Manually"}
              </Button>
            </TabsContent>

            {/* To-Let Tab */}
            <TabsContent value="tolet" className="space-y-6 mt-6">
              {/* Free offer banner */}
              {!hasAnyToletSub && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                  <Gift className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {language === "bn"
                        ? "🎉 প্রথম ক্রয়ে ২টি ফ্রি টু-লেট!"
                        : "🎉 2 Free To-Let on First Purchase!"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "bn"
                        ? "আপনার প্রথম টু-লেট সাবস্ক্রিপশনে ২টি ফ্রি টু-লেট ব্যালেন্স পাবেন (১ মাসের জন্য)। প্রথম মাসেই ব্যবহার করতে হবে।"
                        : "Get 2 free to-let slots with your first to-let subscription (valid for 1 month). Must be used within the first month."}
                    </p>
                  </div>
                </div>
              )}

              {renderCountSelector(
                toletCount, setToletCount, 50,
                "Select Number of To-Let Slots", "টু-লেট স্লট সংখ্যা নির্বাচন করুন",
                PRICE_PER_TOLET, "to-let", "টু-লেট"
              )}
              {renderDurationSelector(toletDuration, setToletDuration)}
              {renderPriceSummary(
                toletCount, toletDuration, PRICE_PER_TOLET,
                toletDiscountPct, toletBasePrice, toletDiscountAmount, toletTotalPrice,
                "to-let", "টু-লেট", toletSpecialDiscountAmount
              )}
              {renderRenewalDates(activeToletSub?.expires_at, toletNewExpiry)}

              <div className="flex gap-2">
                <Input
                  placeholder={language === "bn" ? "কুপন কোড (ঐচ্ছিক)" : "Coupon code (optional)"}
                  value={toletCoupon}
                  onChange={(e) => setToletCoupon(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" disabled={!toletCoupon}>
                  {language === "bn" ? "প্রয়োগ" : "Apply"}
                </Button>
              </div>

              <Button
                className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleSubscribe("tolet")}
                disabled={subscribing}
              >
                <ShoppingCart className="h-5 w-5" />
                {subscribing
                  ? language === "bn" ? "প্রসেসিং..." : "Processing..."
                  : language === "bn"
                  ? `৳${toletTotalPrice} — এখনই কিনুন`
                  : `৳${toletTotalPrice} — Buy Now`}
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={() => { setManualPayType("tolet"); setManualPayOpen(true); }}
              >
                <Banknote className="h-4 w-4" />
                {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Pay Manually"}
              </Button>
            </TabsContent>

            {/* Sale Listing Tab */}
            <TabsContent value="sale_listing" className="space-y-6 mt-6">
              {/* Sale listing balance */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-2xl font-bold text-foreground">{saleRemainingSlots}</p>
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? "বিক্রয় লিস্টিং বাকি" : "Sale Listings Remaining"}
                </p>
              </div>

              {renderCountSelector(
                saleCount, setSaleCount, 50,
                "Number of Sale Listings", "বিক্রয় লিস্টিং সংখ্যা",
                PRICE_PER_SALE_LISTING, "listing", "লিস্টিং"
              )}
              {renderDurationSelector(saleDuration, setSaleDuration)}
              {renderPriceSummary(
                saleCount, saleDuration, PRICE_PER_SALE_LISTING,
                saleDiscountPct, saleBasePrice, saleDiscountAmount, saleTotalPrice,
                "listings", "লিস্টিং", saleSpecialDiscountAmount
              )}
              {renderRenewalDates(activeSaleSub?.expires_at, saleNewExpiry)}

              <div className="flex gap-2">
                <Input
                  placeholder={language === "bn" ? "কুপন কোড (ঐচ্ছিক)" : "Coupon code (optional)"}
                  value={saleCoupon}
                  onChange={(e) => setSaleCoupon(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" disabled={!saleCoupon}>
                  {language === "bn" ? "প্রয়োগ" : "Apply"}
                </Button>
              </div>

              <Button
                className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => handleSubscribe("sale_listing")}
                disabled={subscribing}
              >
                <ShoppingCart className="h-5 w-5" />
                {subscribing
                  ? language === "bn" ? "প্রসেসিং..." : "Processing..."
                  : language === "bn"
                  ? `৳${saleTotalPrice} — এখনই কিনুন`
                  : `৳${saleTotalPrice} — Buy Now`}
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={() => { setManualPayType("sale_listing"); setManualPayOpen(true); }}
              >
                <Banknote className="h-4 w-4" />
                {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Pay Manually"}
              </Button>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                  {language === "bn"
                    ? "প্রতিটি বিক্রয় লিস্টিং ৳২০০। রুম বা প্রপার্টি পেজ থেকে বিক্রয়ে দিতে পারবেন।"
                    : "Each sale listing costs ৳200. Create listings from Rooms or Properties page using the Sell button."}
                </p>
              </div>
            </TabsContent>

            {/* Boosting Tab */}
            <TabsContent value="boosting" className="space-y-6 mt-6">
              {/* Boost Balance Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-2xl font-bold text-foreground">{boost3DayRemaining}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "৩ দিন বুস্ট বাকি" : "3-Day Boosts Left"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <p className="text-2xl font-bold text-foreground">{boost7DayRemaining}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "৭ দিন বুস্ট বাকি" : "7-Day Boosts Left"}
                  </p>
                </div>
              </div>

              {/* Boost Type Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  {language === "bn" ? "বুস্ট টাইপ নির্বাচন করুন" : "Select Boost Type"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={boostType === "3_day" ? "default" : "outline"}
                    className="h-auto py-4 flex-col gap-1"
                    onClick={() => setBoostType("3_day")}
                  >
                    <span className="font-bold">৩ {language === "bn" ? "দিন" : "Days"}</span>
                    <span className="text-xs opacity-80">৳30/{language === "bn" ? "বুস্ট" : "boost"}</span>
                  </Button>
                  <Button
                    variant={boostType === "7_day" ? "default" : "outline"}
                    className="h-auto py-4 flex-col gap-1"
                    onClick={() => setBoostType("7_day")}
                  >
                    <span className="font-bold">৭ {language === "bn" ? "দিন" : "Days"}</span>
                    <span className="text-xs opacity-80">৳50/{language === "bn" ? "বুস্ট" : "boost"}</span>
                  </Button>
                </div>
              </div>

              {/* Count Selector */}
              {renderCountSelector(
                boostCount, setBoostCount, 20,
                "Number of Boosts", "বুস্ট সংখ্যা",
                BOOST_PRICES[boostType], "boost", "বুস্ট"
              )}

              {/* Price Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === "bn"
                      ? `${boostCount} বুস্ট × ৳${BOOST_PRICES[boostType]}`
                      : `${boostCount} boost × ৳${BOOST_PRICES[boostType]}`}
                  </span>
                  <span className="text-foreground font-medium">৳{boostTotalPrice}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">
                    {language === "bn" ? "মোট" : "Total"}
                  </span>
                  <span className="text-xl font-bold text-primary">৳{boostTotalPrice}</span>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleBoostPurchase}
                disabled={subscribing}
              >
                <ShoppingCart className="h-5 w-5" />
                {subscribing
                  ? language === "bn" ? "প্রসেসিং..." : "Processing..."
                  : language === "bn"
                  ? `৳${boostTotalPrice} — এখনই কিনুন`
                  : `৳${boostTotalPrice} — Buy Now`}
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 gap-2"
                onClick={() => { setManualPayType("boost"); setManualPayOpen(true); }}
              >
                <Banknote className="h-4 w-4" />
                {language === "bn" ? "ম্যানুয়াল পেমেন্ট" : "Pay Manually"}
              </Button>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                  {language === "bn"
                    ? "বুস্ট ব্যবহার করলে আপনার টু-লেট লিস্টিং সবার উপরে দেখাবে। Rooms পেজ থেকে বুস্ট অ্যাপ্লাই করতে পারবেন।"
                    : "Boosted listings appear at the top of To-Let page. Apply boosts from the Rooms page."}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Section 3: How Subscription Works */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {language === "bn" ? "সাবস্ক্রিপশন কিভাবে কাজ করে" : "How Subscription Works"}
          </h2>
          <div className="space-y-4">
            {[
              {
                step: 1,
                titleEn: "Select Product Type",
                titleBn: "প্রোডাক্ট টাইপ নির্বাচন করুন",
                descEn: "Choose between Room/Flat Management (৳10/room/month) or To-Let listings (৳50/slot/month).",
                descBn: "রুম/ফ্ল্যাট ম্যানেজমেন্ট (৳১০/রুম/মাস) অথবা টু-লেট লিস্টিং (৳৫০/স্লট/মাস) থেকে বেছে নিন।",
              },
              {
                step: 2,
                titleEn: "Configure & Pay",
                titleBn: "কনফিগার করুন ও পেমেন্ট করুন",
                descEn: "Select count and duration (2-12 months). Longer durations get up to 15% discount.",
                descBn: "সংখ্যা ও সময়কাল নির্বাচন করুন (২-১২ মাস)। দীর্ঘ সময়কালে ১৫% পর্যন্ত ছাড়।",
              },
              {
                step: 3,
                titleEn: "To-Let Free Offer",
                titleBn: "টু-লেট ফ্রি অফার",
                descEn: "First-time to-let buyers get 2 free listing slots valid for 1 month. Use them before they expire!",
                descBn: "প্রথমবার টু-লেট ক্রয়কারীরা ১ মাসের জন্য ২টি ফ্রি লিস্টিং স্লট পাবেন। মেয়াদ শেষের আগে ব্যবহার করুন!",
              },
              {
                step: 4,
                titleEn: "Manage Everything",
                titleBn: "সবকিছু পরিচালনা করুন",
                descEn: "After subscription, manage rooms, tenants, bills, payments, and to-let listings from the dashboard.",
                descBn: "সাবস্ক্রিপশনের পর ড্যাশবোর্ড থেকে রুম, ভাড়াটিয়া, বিল, পেমেন্ট ও টু-লেট লিস্টিং পরিচালনা করুন।",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {language === "bn" ? item.titleBn : item.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {language === "bn" ? item.descBn : item.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
              {language === "bn"
                ? "দ্রষ্টব্য: প্রথম পেইড সাবস্ক্রিপশনের পর রুম/টু-লেট সংখ্যা পরিবর্তন করতে সাপোর্টে যোগাযোগ করুন।"
                : "Note: After your first paid subscription, contact support to change room/to-let count."}
            </p>
          </div>
        </CardContent>
      </Card>

      <ManualPaymentDialog
        open={manualPayOpen}
        onOpenChange={setManualPayOpen}
        productType={manualPayType}
        roomCount={manualPayType === "room_management" ? roomCount : 0}
        toletCount={manualPayType === "tolet" ? toletCount : manualPayType === "sale_listing" ? saleCount : 0}
        durationMonths={manualPayType === "boost" ? 0 : (manualPayType === "room_management" ? roomDuration : manualPayType === "tolet" ? toletDuration : saleDuration)}
        discountPercent={manualPayType === "boost" ? 0 : (manualPayType === "room_management" ? roomDiscountPct : manualPayType === "tolet" ? toletDiscountPct : saleDiscountPct)}
        couponCode={manualPayType === "boost" ? "" : (manualPayType === "room_management" ? roomCoupon : manualPayType === "tolet" ? toletCoupon : saleCoupon)}
        totalPrice={manualPayType === "boost" ? boostTotalPrice : (manualPayType === "room_management" ? roomTotalPrice : manualPayType === "tolet" ? toletTotalPrice : saleTotalPrice)}
        onSuccess={fetchData}
        boostType={boostType}
        boostCount={boostCount}
      />
    </div>
  );
};

export default Subscription;
