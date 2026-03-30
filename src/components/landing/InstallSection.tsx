import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Download } from "lucide-react";
import AppIcon from "./AppIcon";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const InstallSection = () => {
  const { t } = useLanguage();
  const { canInstall, promptInstall, isInstalled, isIOS } = usePWAInstall();

  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            {t("landing.install_badge")}
          </span>
          <h2 className="text-3xl font-bold mb-3">{t("landing.install_title")}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.install_sub")}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Android */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <AppIcon icon={Smartphone} color="green" />
                <h3 className="font-bold text-lg">{t("landing.install_android")}</h3>
              </div>
              <ol className="space-y-3 text-sm mb-6">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
                    <span>{t(`landing.install_android_${i}`)}</span>
                  </li>
                ))}
              </ol>
              {canInstall && (
                <Button onClick={promptInstall} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {t("landing.install_now")}
                </Button>
              )}
              {isInstalled && (
                <p className="text-sm text-primary font-medium text-center">✅ {t("landing.already_installed")}</p>
              )}
            </CardContent>
          </Card>

          {/* iOS */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <AppIcon icon={Monitor} color="blue" />
                <h3 className="font-bold text-lg">{t("landing.install_ios")}</h3>
              </div>
              <ol className="space-y-3 text-sm mb-6">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{i}</span>
                    <span>{t(`landing.install_ios_${i}`)}</span>
                  </li>
                ))}
              </ol>
              {isIOS && !isInstalled && (
                <p className="text-sm text-muted-foreground text-center">{t("landing.ios_manual_hint")}</p>
              )}
              {isInstalled && (
                <p className="text-sm text-primary font-medium text-center">✅ {t("landing.already_installed")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default InstallSection;
