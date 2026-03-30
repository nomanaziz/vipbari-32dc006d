import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRightLeft, Search, User, AlertTriangle, Users } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface TransferPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: any;
  onSuccess: () => void;
}

export function TransferPropertyDialog({ open, onOpenChange, listing, onSuccess }: TransferPropertyDialogProps) {
  const { language } = useLanguage();
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{ full_name: string; phone: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [includeTenants, setIncludeTenants] = useState(true);

  // If room_id exists, always treat as unit transfer regardless of sale_scope field
  const saleScope = listing?.room_id ? "unit" : (listing?.sale_scope || "property");
  const isUnit = saleScope === "unit";

  const handleSearch = async () => {
    if (!phone || phone.length < 11) {
      toast.error(language === "bn" ? "সঠিক মোবাইল নম্বর দিন" : "Enter a valid mobile number");
      return;
    }
    setSearching(true);
    setFoundUser(null);
    try {
      const { data, error } = await supabase.functions.invoke("transfer-property", {
        body: { mode: "search_user", phone: phone.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) {
        toast.error(language === "bn" ? "এই নম্বরে কোনো ইউজার পাওয়া যায়নি" : "No user found with this number");
      } else if (data?.user) {
        setFoundUser(data.user);
      }
    } catch {
      toast.error(language === "bn" ? "অনুসন্ধানে সমস্যা" : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    if (!listing?.property_id || !phone) return;
    setTransferring(true);
    try {
      const { data, error } = await supabase.functions.invoke("transfer-property", {
        body: {
          listing_id: listing.id,
          property_id: listing.property_id,
          room_id: listing.room_id || null,
          target_phone: phone.trim(),
          transfer_scope: saleScope,
          mode: "initiate",
          include_tenants: includeTenants,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(
        language === "bn"
          ? `${isUnit ? "ফ্ল্যাট" : "প্রপার্টি"} ${data?.target_name || ""} এ ট্রান্সফার শুরু হয়েছে!`
          : `${isUnit ? "Flat" : "Property"} transfer initiated to ${data?.target_name || "buyer"}!`
      );
      setConfirmOpen(false);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTransferring(false);
    }
  };

  const resetState = () => {
    setPhone("");
    setFoundUser(null);
    setConfirmOpen(false);
    setIncludeTenants(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              {isUnit
                ? (language === "bn" ? "ফ্ল্যাট ট্রান্সফার" : "Transfer Flat")
                : (language === "bn" ? "সম্পূর্ণ প্রপার্টি ট্রান্সফার" : "Transfer Full Property")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{listing?.title}</p>
                <Badge variant="secondary" className="text-[10px]">
                  {isUnit ? (language === "bn" ? "ইউনিট" : "Unit") : (language === "bn" ? "সম্পূর্ণ" : "Full Property")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "bn" ? "বিক্রি হিসেবে চিহ্নিত" : "Marked as sold"}
              </p>
            </div>

            {/* Transfer scope notice */}
            <div className={`rounded-lg p-3 flex items-start gap-2 text-xs ${isUnit ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"}`}>
              <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${isUnit ? "text-blue-600" : "text-amber-600"}`} />
              <div>
                {isUnit ? (
                  <p>{language === "bn"
                    ? "শুধু এই ফ্ল্যাট/রুমটি ট্রান্সফার হবে। ক্রেতার জন্য নতুন প্রপার্টি প্রোফাইল তৈরি হবে। আপনার বাকি প্রপার্টি অপরিবর্তিত থাকবে।"
                    : "Only this flat/room will be transferred. A new property profile will be created for the buyer. Your remaining property stays unchanged."}</p>
                ) : (
                  <p>{language === "bn"
                    ? "সম্পূর্ণ প্রপার্টি সহ সকল রুম, ভাড়াটিয়া, বিল, মিটার এবং গ্যারেজ নতুন মালিকের কাছে ট্রান্সফার হবে। এটি পরিবর্তনযোগ্য নয়।"
                    : "The entire property including all rooms, tenants, bills, meters and garages will be transferred to the new owner. This cannot be undone."}</p>
                )}
              </div>
            </div>

            {/* Include tenants toggle (only for unit transfers) */}
            {isUnit && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {language === "bn" ? "ভাড়াটিয়া সহ ট্রান্সফার" : "Transfer with tenants"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {includeTenants
                        ? (language === "bn" ? "ভাড়াটিয়া, বিল, মিটার সহ যাবে" : "Tenants, bills, meters will transfer")
                        : (language === "bn" ? "শুধু ফ্ল্যাট যাবে, ভাড়াটিয়া আপনার কাছে থাকবে" : "Only the flat transfers, tenants stay with you")}
                    </p>
                  </div>
                </div>
                <Switch checked={includeTenants} onCheckedChange={setIncludeTenants} />
              </div>
            )}

            <div className="space-y-2">
              <Label>{language === "bn" ? "ক্রেতার মোবাইল নম্বর" : "Buyer's Mobile Number"}</Label>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFoundUser(null); }}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                />
                <Button onClick={handleSearch} disabled={searching || phone.length < 11} size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {foundUser && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3">
                <User className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-sm">{foundUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{foundUser.phone}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={!foundUser}>
              {isUnit
                ? (language === "bn" ? "ফ্ল্যাট ট্রান্সফার" : "Transfer Flat")
                : (language === "bn" ? "প্রপার্টি ট্রান্সফার" : "Transfer Property")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleTransfer}
        isPending={transferring}
        title={language === "bn" ? "ট্রান্সফার নিশ্চিত করুন?" : "Confirm Transfer?"}
        confirmLabel={language === "bn" ? "হ্যাঁ" : "Yes"}
        cancelLabel={language === "bn" ? "না" : "No"}
        confirmVariant="default"
        description={
          isUnit
            ? (language === "bn"
              ? `"${listing?.title}" ফ্ল্যাটটি ${foundUser?.full_name} (${foundUser?.phone}) এর কাছে ট্রান্সফার হবে।${!includeTenants ? " ভাড়াটিয়া ছাড়া।" : " ভাড়াটিয়া সহ।"}`
              : `Flat "${listing?.title}" will be transferred to ${foundUser?.full_name} (${foundUser?.phone}).${!includeTenants ? " Without tenants." : " With tenants."}`)
            : (language === "bn"
              ? `সম্পূর্ণ প্রপার্টি "${listing?.title}" সহ সকল রুম ও সম্পদ ${foundUser?.full_name} (${foundUser?.phone}) এ ট্রান্সফার হবে। এটি পরিবর্তনযোগ্য নয়।`
              : `Entire property "${listing?.title}" with all rooms and assets will be transferred to ${foundUser?.full_name} (${foundUser?.phone}). This cannot be undone.`)
        }
      />
    </>
  );
}
