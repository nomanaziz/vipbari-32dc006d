import { useState, useEffect } from "react";
import { X, Download, Share, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

export const PWAInstallBanner = () => {
  const { canInstall, promptInstall, isInstalled, isIOS } = usePWAInstall();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem("pwa-banner-dismissed") === "true"
  );

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (dismissed || isInstalled) return;
    if (!canInstall && !isIOS) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      sessionStorage.setItem("pwa-banner-dismissed", "true");
    }, 10000);
    return () => clearTimeout(timer);
  }, [dismissed, isInstalled, canInstall, isIOS]);

  if (dismissed || isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) handleDismiss();
  };

  const bn = language === "bn";

  if (isIOS) {
    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-[300px] bg-card border border-border rounded-xl p-3 shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {bn ? "অ্যাপ ইনস্টল করুন" : "Install App"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Share className="h-3 w-3 inline flex-shrink-0" />
              {bn ? "Share → Add to Home Screen" : "Share → Add to Home Screen"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 -mt-0.5 -mr-1" onClick={handleDismiss}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-[280px] bg-card border border-border rounded-xl p-3 shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {bn ? "VIP Bari" : "VIP Bari"}
          </p>
          <p className="text-xs text-muted-foreground">
            {bn ? "অ্যাপ ইনস্টল করুন" : "Install as app"}
          </p>
        </div>
        <Button size="sm" className="flex-shrink-0 gap-1 h-8 text-xs px-2.5" onClick={handleInstall}>
          <Download className="h-3.5 w-3.5" />
          {bn ? "ইনস্টল" : "Install"}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 -mr-1" onClick={handleDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
