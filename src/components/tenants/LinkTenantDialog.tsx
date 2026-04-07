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
import { Badge } from "@/components/ui/badge";
import { Search, Send, Phone, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface LinkTenantDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  availableRooms: any[];
}

const LinkTenantDialog = ({ open, onOpenChange, availableRooms }: LinkTenantDialogProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    if (!phone || phone.length < 4) {
      toast.error(language === "bn" ? "কমপক্ষে ৪ ডিজিট দিন" : "Enter at least 4 digits");
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
        toast.info(language === "bn" ? "এই নম্বরে কোনো অনির্ধারিত ভাড়াটিয়া পাওয়া যায়নি" : "No unassigned tenants found with this phone");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedTenant) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("link-tenant", {
        body: {
          action: "invite",
          tenant_id: selectedTenant.id,
          room_id: selectedRoom || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(language === "bn"
        ? "ইনভিটেশন পাঠানো হয়েছে! ভাড়াটিয়ার গ্রহণের জন্য অপেক্ষা করুন।"
        : "Invitation sent! Waiting for tenant to accept.");
      queryClient.invalidateQueries({ queryKey: ["tenant-invitations"] });
      onOpenChange(false);
      resetState();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const resetState = () => {
    setPhone("");
    setResults([]);
    setSelectedTenant(null);
    setSelectedRoom("");
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    if (status === "pending") return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Clock className="h-3 w-3" />
        {language === "bn" ? "অপেক্ষমাণ" : "Pending"}
      </Badge>
    );
    if (status === "rejected") return (
      <Badge variant="destructive" className="text-xs gap-1">
        <XCircle className="h-3 w-3" />
        {language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}
      </Badge>
    );
    if (status === "accepted") return (
      <Badge className="text-xs gap-1 bg-emerald-500">
        <CheckCircle2 className="h-3 w-3" />
        {language === "bn" ? "গৃহীত" : "Accepted"}
      </Badge>
    );
    return null;
  };

  const canInvite = selectedTenant && !selectedTenant.invitation_status;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {language === "bn" ? "বিদ্যমান ভাড়াটিয়া যুক্ত করুন" : "Link Existing Tenant"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search by phone */}
          <div className="space-y-2">
            <Label>{language === "bn" ? "ফোন নম্বর দিয়ে খুঁজুন" : "Search by phone number"}</Label>
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
              <Label>{language === "bn" ? "ভাড়াটিয়া নির্বাচন করুন" : "Select tenant"}</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.map((tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => !tenant.invitation_status && setSelectedTenant(tenant)}
                    className={`p-3 rounded-md border transition-colors ${
                      tenant.invitation_status
                        ? "border-border opacity-60 cursor-not-allowed"
                        : selectedTenant?.id === tenant.id
                          ? "border-primary bg-primary/5 cursor-pointer"
                          : "border-border hover:bg-muted cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tenant.full_name}</p>
                        <p className="text-sm text-muted-foreground">{tenant.phone}</p>
                      </div>
                      {getStatusBadge(tenant.invitation_status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room assignment (required) */}
          {canInvite && (
            <div className="space-y-2">
              <Label>{language === "bn" ? "রুম নির্ধারণ করুন *" : "Assign room *"}</Label>
              {availableRooms.length === 0 ? (
                <p className="text-sm text-destructive">
                  {language === "bn" ? "কোনো খালি রুম নেই। প্রথমে একটি রুম যোগ করুন।" : "No vacant rooms available. Please add a room first."}
                </p>
              ) : (
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "bn" ? "রুম নির্বাচন করুন" : "Select a room"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.room_number} — {r.properties?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Invite button */}
          {canInvite && (
            <Button onClick={handleInvite} disabled={sending || !selectedRoom || availableRooms.length === 0} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {sending
                ? (language === "bn" ? "পাঠানো হচ্ছে..." : "Sending...")
                : (language === "bn" ? `${selectedTenant.full_name} কে ইনভিটেশন পাঠান` : `Send invitation to ${selectedTenant.full_name}`)}
            </Button>
          )}

          {/* Show message if tenant has existing invitation status */}
          {selectedTenant?.invitation_status === "pending" && (
            <p className="text-sm text-amber-600 text-center">
              {language === "bn" ? "ইনভিটেশন ইতিমধ্যে পাঠানো হয়েছে। ভাড়াটিয়ার গ্রহণের জন্য অপেক্ষা করুন।" : "Invitation already sent. Waiting for tenant to accept."}
            </p>
          )}
          {selectedTenant?.invitation_status === "rejected" && (
            <p className="text-sm text-destructive text-center">
              {language === "bn" ? "ভাড়াটিয়া আপনার ইনভিটেশন প্রত্যাখ্যান করেছে।" : "Tenant has rejected your invitation."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkTenantDialog;
