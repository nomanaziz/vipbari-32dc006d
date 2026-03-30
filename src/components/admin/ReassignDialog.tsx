import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReassignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "property" | "room" | "tenant";
  itemId: string;
  itemLabel: string;
  onSuccess: () => void;
}

interface Landlord {
  user_id: string;
  full_name: string;
  phone: string;
}

const ReassignDialog = ({ open, onOpenChange, type, itemId, itemLabel, onSuccess }: ReassignDialogProps) => {
  const { language } = useLanguage();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Landlord[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [includeTenants, setIncludeTenants] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (query.length < 2) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reassign", {
        body: { action: "search_landlords", query },
      });
      if (error) throw error;
      setResults(data.landlords || []);
    } catch {
      toast.error(L("Search failed", "খুঁজে পাওয়া যায়নি"));
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLandlord) return;
    setSubmitting(true);
    try {
      const actionMap = {
        property: "reassign_property",
        room: "reassign_room",
        tenant: "reassign_tenant",
      };
      const bodyMap = {
        property: { property_id: itemId, new_owner_id: selectedLandlord.user_id, include_tenants: includeTenants },
        room: { room_id: itemId, new_owner_id: selectedLandlord.user_id, include_tenant: includeTenants },
        tenant: { tenant_id: itemId, new_owner_id: selectedLandlord.user_id },
      };

      const { data, error } = await supabase.functions.invoke("admin-reassign", {
        body: { action: actionMap[type], ...bodyMap[type] },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(L("Reassigned successfully", "সফলভাবে হস্তান্তর হয়েছে"));
      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (e: any) {
      toast.error(e.message || L("Failed to reassign", "হস্তান্তর ব্যর্থ"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setQuery("");
    setResults([]);
    setSelectedLandlord(null);
    setIncludeTenants(true);
  };

  const typeLabel = type === "property"
    ? L("Property", "প্রপার্টি")
    : type === "room"
    ? L("Room/Flat", "রুম/ফ্ল্যাট")
    : L("Tenant", "ভাড়াটিয়া");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {L(`Reassign ${typeLabel}`, `${typeLabel} হস্তান্তর`)}
          </DialogTitle>
          <DialogDescription>
            {L(`Assign "${itemLabel}" to another landlord`, `"${itemLabel}" অন্য মালিকের কাছে হস্তান্তর করুন`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search landlord */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={L("Search landlord by name/phone...", "নাম/ফোন দিয়ে মালিক খুঁজুন...")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || query.length < 2} size="sm">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : L("Search", "খুঁজুন")}
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {results.map((l) => (
                <button
                  key={l.user_id}
                  className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                    selectedLandlord?.user_id === l.user_id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedLandlord(l)}
                >
                  <p className="font-medium text-sm">{l.full_name}</p>
                  <p className="text-xs text-muted-foreground">{l.phone}</p>
                </button>
              ))}
            </div>
          )}

          {selectedLandlord && (
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm font-medium">{L("Selected", "নির্বাচিত")}: {selectedLandlord.full_name}</p>
              <p className="text-xs text-muted-foreground">{selectedLandlord.phone}</p>
            </div>
          )}

          {/* Include tenants toggle - only for property and room */}
          {type !== "tenant" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-tenants"
                checked={includeTenants}
                onCheckedChange={(c) => setIncludeTenants(!!c)}
              />
              <Label htmlFor="include-tenants" className="text-sm">
                {L("Include tenants", "ভাড়াটিয়াসহ হস্তান্তর")}
              </Label>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
              {L("Cancel", "বাতিল")}
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedLandlord || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {L("Confirm", "নিশ্চিত করুন")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReassignDialog;
