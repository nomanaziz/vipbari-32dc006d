import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { language } = useLanguage();

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="h-4 w-4 shrink-0" />
      {language === "bn"
        ? "ইন্টারনেট সংযোগ নেই। অনুগ্রহ করে আপনার নেটওয়ার্ক চেক করুন।"
        : "No internet connection. Please check your network."}
    </div>
  );
};
