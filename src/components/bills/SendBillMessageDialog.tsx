import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Phone } from "lucide-react";

interface SendBillMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bills: Array<{
    tenantName: string;
    phone: string;
    roomNumber: string;
    month: string;
    totalAmount: number;
    dueAmount: number;
    dueDate?: string;
  }>;
}

export function SendBillMessageDialog({ open, onOpenChange, bills }: SendBillMessageDialogProps) {
  const { language } = useLanguage();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const generateMessage = (bill: typeof bills[0]) => {
    if (language === "bn") {
      return `প্রিয় ${bill.tenantName},\n\nআপনার ভাড়ার বিবরণ:\nরুম: ${bill.roomNumber}\nমাস: ${bill.month}\nমোট: ৳${bill.totalAmount.toLocaleString()}\nবকেয়া: ৳${bill.dueAmount.toLocaleString()}${bill.dueDate ? `\nপরিশোধের শেষ তারিখ: ${bill.dueDate}` : ""}\n\nঅনুগ্রহ করে দ্রুত পরিশোধ করুন।`;
    }
    return `Dear ${bill.tenantName},\n\nRent Details:\nRoom: ${bill.roomNumber}\nMonth: ${bill.month}\nTotal: ৳${bill.totalAmount.toLocaleString()}\nDue: ৳${bill.dueAmount.toLocaleString()}${bill.dueDate ? `\nDeadline: ${bill.dueDate}` : ""}\n\nPlease pay at your earliest convenience.`;
  };

  const [customMessage, setCustomMessage] = useState("");
  const isBulk = bills.length > 1;
  const previewBill = bills[0];
  const previewMsg = previewBill ? generateMessage(previewBill) : "";

  const getMessage = (bill: typeof bills[0]) => customMessage || generateMessage(bill);

  const formatPhone = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("880")) return clean;
    if (clean.startsWith("0")) return "880" + clean.substring(1);
    return "880" + clean;
  };

  const handleSMS = () => {
    if (isBulk) {
      bills.forEach((bill, i) => {
        setTimeout(() => {
          window.open(`sms:${bill.phone}?body=${encodeURIComponent(getMessage(bill))}`, "_blank");
        }, i * 500);
      });
    } else if (previewBill) {
      window.open(`sms:${previewBill.phone}?body=${encodeURIComponent(getMessage(previewBill))}`, "_blank");
    }
    onOpenChange(false);
  };

  const handleWhatsApp = () => {
    if (isBulk) {
      bills.forEach((bill, i) => {
        setTimeout(() => {
          window.open(`https://wa.me/+${formatPhone(bill.phone)}?text=${encodeURIComponent(getMessage(bill))}`, "_blank");
        }, i * 500);
      });
    } else if (previewBill) {
      window.open(`https://wa.me/+${formatPhone(previewBill.phone)}?text=${encodeURIComponent(getMessage(previewBill))}`, "_blank");
    }
    onOpenChange(false);
  };

  if (!previewBill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBulk
              ? L(`Send to ${bills.length} Tenants`, `${bills.length} জন ভাড়াটিয়াকে পাঠান`)
              : L(`Send to ${previewBill.tenantName}`, `${previewBill.tenantName}-কে পাঠান`)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">{L("Message Preview:", "বার্তার প্রিভিউ:")}</div>
          <Textarea
            value={customMessage || previewMsg}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={7}
            className="text-sm"
          />
          {customMessage && (
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setCustomMessage("")}>
              {L("Reset to default", "ডিফল্টে ফিরুন")}
            </Button>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button className="flex-1 gap-2" variant="outline" onClick={handleSMS}>
            <Phone className="h-4 w-4" />
            {L("Open SMS", "SMS খুলুন")}
          </Button>
          <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleWhatsApp}>
            <MessageSquare className="h-4 w-4" />
            {L("WhatsApp", "হোয়াটসঅ্যাপ")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
