import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  type: "room_management" | "tolet" | "sale_listing" | "boost_3_day" | "boost_7_day" | "sms";
  label: string;
  labelBn: string;
  count: number;
  durationMonths: number;
  unitPrice: number;
  discountPercent: number;
  couponCode: string;
  lineTotal: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (type: string) => void;
  updateItemCount: (type: string, count: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "vipbari_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.type === item.type);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = item;
        return updated;
      }
      return [...prev, item];
    });
  };

  const removeItem = (type: string) => {
    setItems((prev) => prev.filter((i) => i.type !== type));
  };

  const updateItemCount = (type: string, count: number) => {
    setItems((prev) =>
      prev.map((i) => (i.type === type ? { ...i, count, lineTotal: count * i.unitPrice } : i))
    );
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const cartCount = items.length;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateItemCount, clearCart, cartTotal, cartCount, isCartOpen, setIsCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
