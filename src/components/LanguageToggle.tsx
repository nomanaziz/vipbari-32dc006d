import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
      className="gap-1.5 text-sm"
    >
      <Globe className="h-4 w-4" />
      {language === "bn" ? "EN" : "বাং"}
    </Button>
  );
};
