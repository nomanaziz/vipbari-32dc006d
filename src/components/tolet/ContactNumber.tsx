import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Eye, MessageCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ContactNumberProps {
  phone: string;
  compact?: boolean;
  roomNumber?: string;
  propertyName?: string;
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 5) return phone;
  return phone.slice(0, 3) + "XXXXX" + phone.slice(-2);
};

const formatPhoneFor880 = (phone: string) => {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith("880")) cleaned = "880" + cleaned;
  return cleaned;
};

const ContactNumber = ({ phone, compact = false, roomNumber, propertyName }: ContactNumberProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inquiryMsg = language === "bn"
    ? `হ্যালো, আমি ${propertyName || ""}-এ ${roomNumber || ""} ভাড়া নিতে আগ্রহী। এটি কি এখনও খালি আছে?`
    : `Hi, I'm interested in renting ${roomNumber || ""} at ${propertyName || ""}. Is it still available?`;

  const handleReveal = () => {
    if (!user) {
      toast.error(language === "bn" ? "নম্বর দেখতে লগইন করুন" : "Login to see full number");
      return;
    }
    setRevealed(true);
    setCountdown(20);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      setRevealed(false);
      setCountdown(0);
    }, 20000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!phone) return null;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <button
        onClick={revealed ? undefined : handleReveal}
        className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-md transition-colors ${
          revealed
            ? "text-green-700 dark:text-green-400 cursor-default"
            : "text-primary hover:text-primary/80 cursor-pointer"
        } ${compact ? "" : "bg-muted/50 px-3 py-1.5"}`}
      >
        <Phone className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className={compact ? "text-xs" : "text-sm"}>
          {revealed ? phone : maskPhone(phone)}
        </span>
        {revealed ? (
          <span className="text-[10px] text-muted-foreground ml-1">({countdown}s)</span>
        ) : (
          <Eye className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        )}
      </button>
      {revealed && (
        <span className="inline-flex items-center gap-1">
          <a
            href={`https://wa.me/+${formatPhoneFor880(phone)}?text=${encodeURIComponent(inquiryMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            title="WhatsApp"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-green-600`} />
          </a>
          <a
            href={`sms:${phone}?body=${encodeURIComponent(inquiryMsg)}`}
            className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            title="SMS"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-blue-600`} />
          </a>
        </span>
      )}
    </div>
  );
};

export default ContactNumber;
