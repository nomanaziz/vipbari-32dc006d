import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Link, Phone } from "lucide-react";
import { toast } from "sonner";

interface LinkTenantDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  availableRooms: any[];
}

const LinkTenantDialog = ({ open, onOpenChange, availableRooms }: LinkTenantDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [linking, setLinking] = useState(false);

  const handleSearch = async () => {
    if (!phone || phone.length < 4) {
      toast.error(t("tenant.phone_too_short") || "Enter at least 4 digits");
      return;
    }
    setSearching(true);
    setSelectedTenant(null);
    try {
      const { data, error } = await supabase.functions.invoke("link-tenant", {
        body: { action: "search", phone },
      });
      if (error) throw error;
      setResults(data?.tenants || []);
      if (!data?.tenants?.length) {
        toast.info(t("tenant.no_unassigned") || "No unassigned tenants found with this phone");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!selectedTenant) return;
    setLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("link-tenant", {
        body: {
          action: "link",
          tenant_id: selectedTenant.id,
          room_id: selectedRoom || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(t("tenant.linked") || "Tenant linked successfully!");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onOpenChange(false);
      resetState();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLinking(false);
    }
  };

  const resetState = () => {
    setPhone("");
    setResults([]);
    setSelectedTenant(null);
    setSelectedRoom("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            {t("tenant.link_existing") || "Link Existing Tenant"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search by phone */}
          <div className="space-y-2">
            <Label>{t("tenant.search_by_phone") || "Search by phone number"}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>{t("tenant.select_tenant") || "Select tenant to link"}</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.map((tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => setSelectedTenant(tenant)}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedTenant?.id === tenant.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <p className="font-medium">{tenant.full_name}</p>
                    <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room assignment (optional) */}
          {selectedTenant && (
            <div className="space-y-2">
              <Label>{t("tenant.assign_room") || "Assign room (optional)"}</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder={t("tenant.no_room") || "No room"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("tenant.no_room") || "No room"}</SelectItem>
                  {availableRooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number} — {r.properties?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Link button */}
          {selectedTenant && (
            <Button onClick={handleLink} disabled={linking} className="w-full">
              <Link className="h-4 w-4 mr-2" />
              {linking
                ? (t("common.loading") || "Loading...")
                : (t("tenant.link_tenant") || `Link ${selectedTenant.full_name}`)}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkTenantDialog;
