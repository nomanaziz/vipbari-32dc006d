import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Share2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  credentials: { phone: string; password: string } | null;
}

const TenantCredentialsDialog = ({ open, onOpenChange, credentials }: Props) => {
  const { language } = useLanguage();

  if (!credentials) return null;

  const shareText = `VaraPlus Login\nUser ID: ${credentials.phone}\nPassword: ${credentials.password}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(language === "bn" ? "কপি করা হয়েছে" : "Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "VaraPlus Login", text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {language === "bn" ? "অ্যাকাউন্ট তৈরি হয়েছে" : "Account Created"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "ভাড়াটিয়ার লগইন তথ্য নিচে দেওয়া হলো। এই তথ্য শেয়ার করুন।"
              : "Tenant login credentials are shown below. Share them with the tenant."}
          </p>

          <div className="bg-muted rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">{language === "bn" ? "ইউজার আইডি:" : "User ID:"} </span>
              <span className="font-semibold">{credentials.phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === "bn" ? "পাসওয়ার্ড:" : "Password:"} </span>
              <span className="font-semibold">{credentials.password}</span>
            </div>
          </div>

          <p className="text-xs text-orange-600">
            {language === "bn"
              ? "⚠️ পাসওয়ার্ড শুধুমাত্র একবার দেখানো হবে। এখনই শেয়ার করুন।"
              : "⚠️ Password is shown only once. Share it now."}
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
              {language === "bn" ? "কপি" : "Copy"}
            </Button>
            <Button className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              {language === "bn" ? "শেয়ার" : "Share"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenantCredentialsDialog;
