import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import {
  ShoppingCart, Trash2, Loader2, Banknote, Package, Megaphone, Flame, ShoppingBag, MessageSquare,
} from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  room_management: <Package className="h-4 w-4 text-primary" />,
  tolet: <Megaphone className="h-4 w-4 text-orange-500" />,
  sale_listing: <ShoppingBag className="h-4 w-4 text-purple-600" />,
  boost_3_day: <Flame className="h-4 w-4 text-orange-500" />,
  boost_7_day: <Flame className="h-4 w-4 text-red-500" />,
  sms: <MessageSquare className="h-4 w-4 text-blue-500" />,
};

const CartDrawer = () => {
  const { items, removeItem, clearCart, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setPaying(true);
    try {
      const siteUrl = window.location.origin;
      const cartItems = items.map((i) => ({
        type: i.type,
        count: i.count,
        duration_months: i.durationMonths,
        coupon_code: i.couponCode || null,
      }));

      const { data, error } = await supabase.functions.invoke("create-cart-payment", {
        body: {
          items: cartItems,
          success_url: `${siteUrl}/dashboard/subscription?payment=success`,
          cancel_url: `${siteUrl}/dashboard/subscription?payment=cancel`,
        },
      });

      if (error) throw new Error(error.message || "Payment creation failed");
      if (!data?.payment_url) throw new Error(data?.error || "No payment URL received");

      clearCart();
      window.location.href = data.payment_url;
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
      setPaying(false);
    }
  };

  return (
    <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {language === "bn" ? "কার্ট" : "Cart"}
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-1">{items.length}</Badge>
            )}
          </DrawerTitle>
          <DrawerDescription>
            {language === "bn" ? "আপনার নির্বাচিত আইটেমগুলো" : "Your selected items"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === "bn" ? "কার্ট খালি" : "Cart is empty"}
            </div>
          ) : (
            items.map((item) => (
              <div key={item.type} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {typeIcons[item.type] || <Package className="h-4 w-4" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {language === "bn" ? item.labelBn : item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} × ৳{item.unitPrice}
                      {item.durationMonths > 0 && ` × ${item.durationMonths} ${language === "bn" ? "মাস" : "mo"}`}
                      {item.discountPercent > 0 && (
                        <span className="text-green-600 ml-1">(-{item.discountPercent}%)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">৳{item.lineTotal}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.type)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <DrawerFooter className="border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-foreground">
                {language === "bn" ? "সর্বমোট" : "Grand Total"}
              </span>
              <span className="text-2xl font-bold text-primary">৳{cartTotal}</span>
            </div>
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleCheckout}
              disabled={paying}
            >
              {paying ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{language === "bn" ? "প্রসেসিং..." : "Processing..."}</>
              ) : (
                <><ShoppingCart className="h-5 w-5" />
                  {language === "bn" ? `৳${cartTotal} — চেকআউট` : `৳${cartTotal} — Checkout`}</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={clearCart} className="gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              {language === "bn" ? "কার্ট খালি করুন" : "Clear Cart"}
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
