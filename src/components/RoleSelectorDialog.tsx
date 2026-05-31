import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Users } from "lucide-react";

interface RoleSelectorDialogProps {
  open: boolean;
  onSelect: (role: "landlord" | "tenant") => void;
}

export const RoleSelectorDialog = ({ open, onSelect }: RoleSelectorDialogProps) => {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">কোন ভূমিকায় প্রবেশ করবেন?</DialogTitle>
          <DialogDescription className="text-center">
            আপনার অ্যাকাউন্টে দুটি ভূমিকা যুক্ত আছে। কোনটি দিয়ে এখন প্রবেশ করতে চান?
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="h-32 flex-col gap-2 hover:bg-primary hover:text-primary-foreground"
            onClick={() => onSelect("landlord")}
          >
            <Building2 className="h-8 w-8" />
            <span className="font-semibold">বাড়িওয়ালা</span>
            <span className="text-xs opacity-70">Landlord</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex-col gap-2 hover:bg-primary hover:text-primary-foreground"
            onClick={() => onSelect("tenant")}
          >
            <Users className="h-8 w-8" />
            <span className="font-semibold">ভাড়াটিয়া</span>
            <span className="text-xs opacity-70">Tenant</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
