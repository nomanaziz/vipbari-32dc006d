import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from "@/contexts/LanguageContext";

interface TenantReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: (reason: string, notes: string) => void;
  isPending?: boolean;
}

const TenantReleaseDialog = ({ open, onOpenChange, tenantName, onConfirm, isPending }: TenantReleaseDialogProps) => {
  const { language } = useLanguage();
  const [reason, setReason] = useState("all_paid");
  const [notes, setNotes] = useState("");

  const reasons = [
    {
      value: "all_paid",
      label: language === "bn" ? "সব বিল পরিশোধ করে চলে গেছে" : "Left — all bills paid",
    },
    {
      value: "unpaid",
      label: language === "bn" ? "বিল বাকি রেখে চলে গেছে" : "Left — bills unpaid",
    },
    {
      value: "other",
      label: language === "bn" ? "অন্যান্য" : "Other",
    },
  ];

  const handleConfirm = () => {
    onConfirm(reason, notes);
    setReason("all_paid");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === "bn" ? "ভাড়াটিয়া রিলিজ করুন" : "Release Tenant"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{tenantName}</span>
            {language === "bn"
              ? " — এই ভাড়াটিয়াকে রিলিজ করলে সে আর্কাইভে চলে যাবে।"
              : " — releasing this tenant will move them to the archive."}
          </p>

          <div className="space-y-2">
            <Label>{language === "bn" ? "রিলিজের কারণ" : "Release Reason"}</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {reasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>{language === "bn" ? "নোট (ঐচ্ছিক)" : "Notes (optional)"}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === "bn" ? "অতিরিক্ত মন্তব্য..." : "Additional comments..."}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === "bn" ? "বাতিল" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
            {isPending
              ? (language === "bn" ? "রিলিজ হচ্ছে..." : "Releasing...")
              : (language === "bn" ? "রিলিজ করুন" : "Release")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TenantReleaseDialog;
