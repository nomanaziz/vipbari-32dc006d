import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface PropertyHistoryDialogProps {
  propertyId: string;
  propertyName: string;
  trigger?: React.ReactNode;
}

const PropertyHistoryDialog = ({ propertyId, propertyName, trigger }: PropertyHistoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["property-history", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_transfers")
        .select("*, sale_listings:source_listing_id(title, price, sale_scope)")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Collect unique user IDs to fetch profiles
  const userIds = [...new Set((transfers || []).flatMap((t: any) => [t.from_user_id, t.to_user_id]))];

  const { data: profiles } = useQuery({
    queryKey: ["transfer-profiles", userIds.join(",")],
    queryFn: async () => {
      if (!userIds.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      return data || [];
    },
    enabled: open && userIds.length > 0,
  });

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

  const getName = (userId: string) => {
    const p = profileMap.get(userId);
    return p?.full_name || p?.phone || "—";
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "border-green-300 text-green-700 bg-green-50";
    if (status === "pending") return "border-yellow-300 text-yellow-700 bg-yellow-50";
    if (status === "rejected") return "border-red-300 text-red-700 bg-red-50";
    return "";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, Record<string, string>> = {
      completed: { bn: "সম্পন্ন", en: "Completed" },
      pending: { bn: "পেন্ডিং", en: "Pending" },
      rejected: { bn: "প্রত্যাখ্যাত", en: "Rejected" },
    };
    return map[status]?.[language] || status;
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title={language === "bn" ? "ট্র্যাক রেকর্ড" : "Ownership History"}>
          <History className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {language === "bn" ? "ট্র্যাক রেকর্ড" : "Ownership History"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{propertyName}</p>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
            </div>
          ) : !transfers?.length ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {language === "bn" ? "কোনো ট্র্যাক রেকর্ড নেই" : "No transfer history"}
            </div>
          ) : (
            <div className="relative pl-6 space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

              {transfers.map((t: any, i: number) => {
                const listing = t.sale_listings;
                return (
                  <div key={t.id} className="relative pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <div className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                      t.status === "completed" ? "border-green-500 bg-green-100" :
                      t.status === "pending" ? "border-yellow-500 bg-yellow-100" :
                      "border-red-500 bg-red-100"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        t.status === "completed" ? "bg-green-500" :
                        t.status === "pending" ? "bg-yellow-500" :
                        "bg-red-500"
                      }`} />
                    </div>

                    <div className="rounded-lg border bg-card p-3 space-y-2">
                      {/* Seller → Buyer */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate max-w-[120px]" title={getName(t.from_user_id)}>
                          {getName(t.from_user_id)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate max-w-[120px]" title={getName(t.to_user_id)}>
                          {getName(t.to_user_id)}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${statusColor(t.status)}`}>
                          {statusLabel(t.status)}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t.transfer_scope === "unit"
                            ? (language === "bn" ? "ইউনিট" : "Unit")
                            : (language === "bn" ? "সম্পূর্ণ" : "Full")}
                        </Badge>
                        {listing?.price && (
                          <span className="text-xs text-primary font-semibold flex items-center gap-0.5">
                            <DollarSign className="h-3 w-3" />
                            ৳{Number(listing.price).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(t.created_at), "dd MMM yyyy, hh:mm a")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyHistoryDialog;
