import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INCOME_CATEGORIES = [
  { value: "rent_collection", en: "Rent Collection", bn: "ভাড়া সংগ্রহ" },
  { value: "garage_rent", en: "Garage Rent", bn: "গ্যারেজ ভাড়া" },
  { value: "advance_payment", en: "Advance Payment", bn: "অগ্রিম পেমেন্ট" },
  { value: "service_charge", en: "Service Charge", bn: "সার্ভিস চার্জ" },
  { value: "other_income", en: "Other Income", bn: "অন্যান্য আয়" },
];

const EXPENSE_CATEGORIES = [
  { value: "property_tax", en: "Property Tax", bn: "সম্পত্তি কর" },
  { value: "vat", en: "VAT", bn: "ভ্যাট" },
  { value: "electricity_bill", en: "Electricity Bill", bn: "বিদ্যুৎ বিল" },
  { value: "water_bill", en: "Water Bill", bn: "পানির বিল" },
  { value: "gas_bill", en: "Gas Bill", bn: "গ্যাস বিল" },
  { value: "maintenance", en: "Maintenance", bn: "রক্ষণাবেক্ষণ" },
  { value: "repair", en: "Repair", bn: "মেরামত" },
  { value: "security", en: "Security", bn: "নিরাপত্তা" },
  { value: "cleaning", en: "Cleaning", bn: "পরিষ্কার" },
  { value: "painting", en: "Painting", bn: "রং" },
  { value: "plumbing", en: "Plumbing", bn: "প্লাম্বিং" },
  { value: "furniture", en: "Furniture", bn: "আসবাবপত্র" },
  { value: "legal_fee", en: "Legal Fee", bn: "আইনি ফি" },
  { value: "insurance", en: "Insurance", bn: "বীমা" },
  { value: "booking_refund", en: "Booking Refund", bn: "বুকিং ফেরত" },
  { value: "booking_rent_deduct", en: "Booking Rent Deduct", bn: "বুকিং ভাড়া কর্তন" },
  { value: "asset_purchase", en: "Asset Purchase", bn: "সম্পদ ক্রয়" },
  { value: "other_expense", en: "Other Expense", bn: "অন্যান্য খরচ" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  onSubmit: (data: { category: string; amount: number; entry_date: string; description: string }) => void;
  loading?: boolean;
}

export function AccountingEntryDialog({ open, onOpenChange, type, onSubmit, loading }: Props) {
  const { language } = useLanguage();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;
    onSubmit({ category, amount: parseFloat(amount), entry_date: entryDate, description });
    setCategory("");
    setAmount("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "income"
              ? language === "bn" ? "আয় যোগ করুন" : "Add Income"
              : language === "bn" ? "খরচ যোগ করুন" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{language === "bn" ? "ক্যাটাগরি" : "Category"}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder={language === "bn" ? "নির্বাচন করুন" : "Select"} /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    {language === "bn" ? c.bn : c.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{language === "bn" ? "পরিমাণ (৳)" : "Amount (৳)"}</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div>
            <Label>{language === "bn" ? "তারিখ" : "Date"}</Label>
            <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
          </div>
          <div>
            <Label>{language === "bn" ? "বিবরণ" : "Description"}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...")
              : (language === "bn" ? "সংরক্ষণ করুন" : "Save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { INCOME_CATEGORIES, EXPENSE_CATEGORIES };
