import { useState } from "react";
import { getDefaultImage } from "@/lib/defaultImages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, CheckCircle, ArrowRightLeft, Inbox, Check, X, Users } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { TransferPropertyDialog } from "@/components/sale/TransferPropertyDialog";
import { useNavigate } from "react-router-dom";

type StatusFilter = "all" | "active" | "sold" | "transferred";

export default function MyListings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [soldId, setSoldId] = useState<string | null>(null);
  const [transferListing, setTransferListing] = useState<any>(null);
  const [requestsDialogId, setRequestsDialogId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Handover dialog state
  const [handoverRequest, setHandoverRequest] = useState<any>(null);
  const [handoverListing, setHandoverListing] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState("");
  const [handoverProcessing, setHandoverProcessing] = useState(false);
  const [handoverIncludeTenants, setHandoverIncludeTenants] = useState(true);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["my-sale-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_listings")
        .select("*, sale_listing_images(image_url, sort_order)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: buyRequests } = useQuery({
    queryKey: ["my-buy-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("sale_buy_requests")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const buyerIds = [...new Set((buyRequests || []).map((r: any) => r.buyer_id))];
  const { data: buyerProfiles } = useQuery({
    queryKey: ["buyer-profiles", buyerIds.join(",")],
    enabled: buyerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", buyerIds);
      return new Map((data || []).map((p: any) => [p.user_id, p]));
    },
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("sale_listings").delete().eq("id", deleteId);
    if (error) { toast.error(language === "bn" ? "মুছতে ব্যর্থ হয়েছে" : "Delete failed: " + error.message); return; }
    toast.success(language === "bn" ? "মুছে ফেলা হয়েছে" : "Listing deleted");
    queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
    setDeleteId(null);
  };

  const markAsSold = async () => {
    if (!soldId) return;
    const { error } = await supabase.from("sale_listings").update({ status: "sold", transfer_status: "pending" }).eq("id", soldId);
    if (error) { toast.error(error.message); return; }
    toast.success(language === "bn" ? "বিক্রি হয়েছে হিসেবে চিহ্নিত" : "Marked as sold");
    queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
    setSoldId(null);
  };

  const toggleShowPhone = async (listingId: string, current: boolean) => {
    const { error } = await supabase.from("sale_listings").update({ show_contact_phone: !current }).eq("id", listingId);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
  };

  // Accept request → show handover dialog
  const handleAcceptRequest = (request: any) => {
    const listing = (listings || []).find((l: any) => l.id === request.listing_id);
    if (!listing) return;
    setHandoverRequest(request);
    setHandoverListing(listing);
    setFinalPrice(String(listing.price || ""));
  };

  const handleHandoverConfirm = async () => {
    if (!handoverRequest || !handoverListing) return;
    setHandoverProcessing(true);
    try {
      const buyer = buyerProfiles?.get(handoverRequest.buyer_id);
      if (!buyer?.phone) {
        toast.error(language === "bn" ? "ক্রেতার ফোন নম্বর পাওয়া যায়নি" : "Buyer phone not found");
        return;
      }

      // 1. Accept the request
      await supabase.from("sale_buy_requests").update({ status: "accepted" }).eq("id", handoverRequest.id);

      // 2. Mark listing as sold + pending transfer
      await supabase.from("sale_listings").update({
        status: "sold",
        transfer_status: "pending",
        price: parseFloat(finalPrice) || handoverListing.price,
      }).eq("id", handoverListing.id);

      // 3. Initiate transfer via edge function
      const saleScope = handoverListing.room_id ? "unit" : (handoverListing.sale_scope || "property");
      const { data, error } = await supabase.functions.invoke("transfer-property", {
        body: {
          listing_id: handoverListing.id,
          property_id: handoverListing.property_id,
          room_id: handoverListing.room_id || null,
          target_phone: buyer.phone,
          transfer_scope: saleScope,
          mode: "initiate",
          include_tenants: handoverIncludeTenants,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(language === "bn"
        ? "অনুরোধ গৃহীত ও হ্যান্ডওভার শুরু হয়েছে!"
        : "Request accepted & handover initiated!");

      queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-buy-requests"] });
      setHandoverRequest(null);
      setHandoverListing(null);
      setRequestsDialogId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setHandoverProcessing(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    const { error } = await supabase.from("sale_buy_requests").update({ status }).eq("id", requestId);
    if (error) { toast.error(error.message); return; }
    toast.success(language === "bn" ? "অনুরোধ প্রত্যাখ্যাত হয়েছে" : "Request rejected");
    queryClient.invalidateQueries({ queryKey: ["my-buy-requests"] });
  };

  const getRequestsForListing = (listingId: string) =>
    (buyRequests || []).filter((r: any) => r.listing_id === listingId);

  const filteredListings = (listings || []).filter((l: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return l.status === "active";
    if (statusFilter === "sold") return l.status === "sold" && l.transfer_status !== "completed";
    if (statusFilter === "transferred") return l.transfer_status === "completed";
    return true;
  });

  const counts = {
    all: (listings || []).length,
    active: (listings || []).filter((l: any) => l.status === "active").length,
    sold: (listings || []).filter((l: any) => l.status === "sold" && l.transfer_status !== "completed").length,
    transferred: (listings || []).filter((l: any) => l.transfer_status === "completed").length,
  };

  const currentRequests = requestsDialogId ? getRequestsForListing(requestsDialogId) : [];

  const filterButtons: { key: StatusFilter; labelBn: string; labelEn: string }[] = [
    { key: "all", labelBn: "সব", labelEn: "All" },
    { key: "active", labelBn: "সক্রিয়", labelEn: "Active" },
    { key: "sold", labelBn: "বিক্রিত", labelEn: "Sold" },
    { key: "transferred", labelBn: "ট্রান্সফার হয়েছে", labelEn: "Transferred" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{language === "bn" ? "আমার বিক্রয় লিস্টিং" : "My Sale Listings"}</h1>
        <p className="text-sm text-muted-foreground">
          {language === "bn" ? "রুম বা প্রপার্টি পেজ থেকে বিক্রয়ে দিন" : "Use Sell button on Rooms or Properties page to create listings"}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filterButtons.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              statusFilter === f.key
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {language === "bn" ? f.labelBn : f.labelEn} ({counts[f.key]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !filteredListings.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === "bn" ? "কোনো বিক্রয় লিস্টিং নেই" : "No sale listings found."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((l: any) => {
            const img = (l.sale_listing_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.image_url || "/images/default-room.png";
            const requests = getRequestsForListing(l.id);
            const pendingCount = requests.filter((r: any) => r.status === "pending").length;
            const isSold = l.status === "sold";
            const isTransferred = l.transfer_status === "completed";
            const isTransferPending = isSold && l.transfer_status === "pending";
            const saleScope = l.room_id ? "unit" : (l.sale_scope || "property");

            return (
              <Card key={l.id} className={`h-full flex flex-col overflow-hidden ${isTransferred ? "opacity-70" : ""}`}>
                {/* Image */}
                <div className="relative flex items-center justify-center pt-4 pb-2">
                  <img src={img} alt={l.title} className={`w-16 h-16 rounded-xl object-cover ${isSold ? "opacity-60" : ""}`} />
                  {isSold && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white font-bold text-xl rotate-[-15deg] bg-destructive/90 px-3 py-0.5 rounded">
                        {language === "bn" ? "বিক্রিত" : "SOLD"}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {isTransferred ? (
                      <Badge className="bg-purple-600 text-white text-[10px]">
                        {language === "bn" ? "ট্রান্সফার সম্পন্ন" : "Transferred"}
                      </Badge>
                    ) : isSold ? (
                      <Badge className="bg-destructive text-white text-[10px]">
                        {language === "bn" ? "বিক্রিত" : "Sold"}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        {language === "bn" ? "সক্রিয়" : "Active"}
                      </Badge>
                    )}
                    <Badge className="bg-black/50 text-white text-[10px]">
                      {saleScope === "unit"
                        ? (language === "bn" ? "ইউনিট" : "Unit")
                        : (language === "bn" ? "সম্পূর্ণ" : "Full Property")}
                    </Badge>
                  </div>
                </div>

                {/* Body */}
                <CardContent className="p-3 flex flex-col flex-1 gap-1.5">
                  <p className="font-bold text-lg text-primary">৳ {l.price.toLocaleString()}</p>
                  <h3 className="font-semibold text-sm line-clamp-1">{l.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{l.location_address || l.district}</p>

                  {/* Actions */}
                  <div className="mt-auto pt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 h-8 text-xs" onClick={() => navigate(`/buy-sell/${l.id}`)}>
                        <Eye className="h-3.5 w-3.5" />
                        {language === "bn" ? "দেখুন" : "View"}
                      </Button>
                      {requests.length > 0 && (
                        <Button size="sm" variant="outline" className="relative flex-1 gap-1 h-8 text-xs" onClick={() => setRequestsDialogId(l.id)}>
                          <Inbox className="h-3.5 w-3.5" />
                          {language === "bn" ? "আবেদন" : "Requests"}
                          {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                              {pendingCount}
                            </span>
                          )}
                        </Button>
                      )}
                      {!isTransferred && l.status === "active" && (
                        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => setSoldId(l.id)} title="Mark as Sold">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                      )}
                      {!isTransferred && (
                        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0 text-destructive" onClick={() => setDeleteId(l.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Phone toggle & transfer CTA */}
                    {l.status === "active" && (
                      <div className="flex items-center justify-between pt-1.5 border-t">
                        <span className="text-xs text-muted-foreground">
                          {language === "bn" ? "ফোন দেখান" : "Show Phone"}
                        </span>
                        <Switch
                          checked={!!(l as any).show_contact_phone}
                          onCheckedChange={() => toggleShowPhone(l.id, !!(l as any).show_contact_phone)}
                        />
                      </div>
                    )}
                    {isTransferPending && !isTransferred && l.property_id && (
                      <Button
                        onClick={() => setTransferListing(l)}
                        className="w-full gap-1.5"
                        size="sm"
                        variant="default"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        {saleScope === "unit"
                          ? (language === "bn" ? "ফ্ল্যাট ট্রান্সফার" : "Transfer Flat")
                          : (language === "bn" ? "প্রপার্টি ট্রান্সফার" : "Transfer Property")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Buy Requests Dialog */}
      <Dialog open={!!requestsDialogId} onOpenChange={(v) => !v && setRequestsDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "bn" ? "কেনার অনুরোধসমূহ" : "Buy Requests"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {currentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "bn" ? "কোনো অনুরোধ নেই" : "No requests"}
              </p>
            ) : (
              currentRequests.map((req: any) => {
                const buyer = buyerProfiles?.get(req.buyer_id);
                return (
                  <Card key={req.id}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{buyer?.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{buyer?.phone || ""}</p>
                        </div>
                        <Badge variant={req.status === "pending" ? "secondary" : req.status === "accepted" ? "default" : "destructive"} className="text-[10px]">
                          {req.status === "pending" ? (language === "bn" ? "অপেক্ষমাণ" : "Pending")
                            : req.status === "accepted" ? (language === "bn" ? "গৃহীত" : "Accepted")
                            : (language === "bn" ? "প্রত্যাখ্যাত" : "Rejected")}
                        </Badge>
                      </div>
                      {req.message && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{req.message}</p>
                      )}
                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1" onClick={() => handleAcceptRequest(req)}>
                            <Check className="h-3.5 w-3.5" /> {language === "bn" ? "গ্রহণ ও হ্যান্ডওভার" : "Accept & Handover"}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => updateRequestStatus(req.id, "rejected")}>
                            <X className="h-3.5 w-3.5" /> {language === "bn" ? "প্রত্যাখ্যান" : "Reject"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Handover Confirmation Dialog */}
      <Dialog open={!!handoverRequest} onOpenChange={(v) => { if (!v) { setHandoverRequest(null); setHandoverListing(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              {language === "bn" ? "হ্যান্ডওভার নিশ্চিত করুন" : "Confirm Handover"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {handoverListing && (
              <div className="bg-muted rounded-lg p-3">
                <p className="font-semibold text-sm">{handoverListing.title}</p>
                <p className="text-xs text-muted-foreground">
                  {(handoverListing.sale_scope || (handoverListing.room_id ? "unit" : "property")) === "unit"
                    ? (language === "bn" ? "ইউনিট/ফ্ল্যাট বিক্রয়" : "Unit/Flat Sale")
                    : (language === "bn" ? "সম্পূর্ণ প্রপার্টি বিক্রয়" : "Full Property Sale")}
                </p>
              </div>
            )}

            {handoverRequest && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm font-medium">{language === "bn" ? "ক্রেতা" : "Buyer"}</p>
                <p className="text-sm">{buyerProfiles?.get(handoverRequest.buyer_id)?.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground">{buyerProfiles?.get(handoverRequest.buyer_id)?.phone || ""}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>{language === "bn" ? "চূড়ান্ত বিক্রয় মূল্য (৳)" : "Final Sale Price (৳)"}</Label>
              <Input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
              />
            </div>

            {/* Include tenants toggle for unit sales */}
            {handoverListing && (handoverListing.room_id || handoverListing.sale_scope === "unit") && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {language === "bn" ? "ভাড়াটিয়া সহ ট্রান্সফার" : "Transfer with tenants"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {handoverIncludeTenants
                        ? (language === "bn" ? "ভাড়াটিয়া, বিল, মিটার সহ যাবে" : "Tenants, bills, meters will transfer")
                        : (language === "bn" ? "শুধু ফ্ল্যাট যাবে, ভাড়াটিয়া আপনার কাছে থাকবে" : "Only the flat transfers, tenants stay with you")}
                    </p>
                  </div>
                </div>
                <Switch checked={handoverIncludeTenants} onCheckedChange={setHandoverIncludeTenants} />
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs">
              <p className="font-medium mb-1">{language === "bn" ? "আপনি কি এই প্রপার্টি হ্যান্ডওভার করতে চান?" : "Do you want to handover this property?"}</p>
              <p className="text-muted-foreground">
                {language === "bn"
                  ? "হ্যান্ডওভার করলে ক্রেতার কাছে প্রপার্টি পেন্ডিং হিসেবে দেখাবে। ক্রেতা গ্রহণ করলে মালিকানা হস্তান্তর হবে।"
                  : "Once you handover, the buyer will see it as pending. Ownership transfers when buyer accepts."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setHandoverRequest(null); setHandoverListing(null); }}>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={handleHandoverConfirm} disabled={handoverProcessing}>
              {handoverProcessing ? "..." : (language === "bn" ? "হ্যান্ডওভার করুন" : "Handover")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!soldId}
        onOpenChange={(open) => !open && setSoldId(null)}
        onConfirm={markAsSold}
        title={language === "bn" ? "বিক্রি নিশ্চিত করুন?" : "Mark as Sold?"}
        description={language === "bn" ? "আপনি কি নিশ্চিত যে এই প্রপার্টি বিক্রি হয়েছে?" : "Are you sure this property has been sold? This will remove it from active listings."}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title={language === "bn" ? "লিস্টিং মুছুন" : "Delete Listing"}
        description={language === "bn" ? "আপনি কি নিশ্চিত?" : "Are you sure you want to delete this listing?"}
      />

      {transferListing && (
        <TransferPropertyDialog
          open={!!transferListing}
          onOpenChange={(v) => !v && setTransferListing(null)}
          listing={transferListing}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["my-sale-listings"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
          }}
        />
      )}
    </div>
  );
}
