import { useState } from "react";
import { X, Download, Share } from "lucide-react";
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

  if (!isMobile || dismissed || isInstalled) return null;
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

  // iOS instruction banner
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 shadow-lg animate-in slide-in-from-bottom">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {bn ? "অ্যাপ ইনস্টল করুন" : "Install App"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Share className="h-3 w-3 inline" />
              {bn
                ? "Safari-তে Share বাটন চাপুন → 'Add to Home Screen' সিলেক্ট করুন"
                : "Tap Share → 'Add to Home Screen'"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-3 shadow-lg animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">B</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Bariwala</p>
          <p className="text-xs text-muted-foreground">
            {bn ? "অ্যাপ হিসেবে ইনস্টল করুন" : "Install as app"}
          </p>
        </div>
        <Button size="sm" className="flex-shrink-0 gap-1.5" onClick={handleInstall}>
          <Download className="h-3.5 w-3.5" />
          {bn ? "ইনস্টল" : "Install"}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
