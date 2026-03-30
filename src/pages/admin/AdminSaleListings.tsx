import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function AdminSaleListings() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin-sale-listings", statusFilter],
    queryFn: async () => {
      let q = supabase.from("sale_listings").select("*, sale_listing_images(image_url, sort_order), rooms(room_number)").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });
  const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("sale_listings").update({ status }).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    toast.success(`Status updated to ${status}`);
    queryClient.invalidateQueries({ queryKey: ["admin-sale-listings"] });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("sale_listings").delete().eq("id", deleteId);
    toast.success("Deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-sale-listings"] });
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) { await supabase.from("sale_listings").delete().eq("id", id); }
    queryClient.invalidateQueries({ queryKey: ["admin-sale-listings"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const sq = search.toLowerCase();
  const filtered = listings?.filter((l: any) => {
    if (!sq) return true;
    const owner = profileMap.get(l.owner_id) || "";
    return [l.title, owner, l.rooms?.room_number, l.district, l.property_type].some(v => v?.toString().toLowerCase().includes(sq));
  });

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === (filtered?.length || 0) ? new Set() : new Set(filtered?.map((l: any) => l.id) || []));
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    sold: "bg-blue-100 text-blue-700",
    expired: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{language === "bn" ? "বিক্রয় লিস্টিং" : "Sale Listings"}</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              {language === "bn" ? `নির্বাচিত মুছুন (${selectedIds.size})` : `Delete Selected (${selectedIds.size})`}
            </Button>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={language === "bn" ? "খুঁজুন..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {filtered && filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <Checkbox checked={selectedIds.size === filtered.length} onCheckedChange={toggleAll} />
          <span className="text-sm text-muted-foreground">{language === "bn" ? "সব নির্বাচন করুন" : "Select all"}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {filtered?.map((l: any) => {
            const img = (l.sale_listing_images || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.image_url;
            return (
              <Card key={l.id}>
                <CardContent className="p-4 flex gap-4 items-center">
                  <Checkbox checked={selectedIds.has(l.id)} onCheckedChange={() => toggleSelect(l.id)} />
                  {img && <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{l.title}</h3>
                      <Badge className={`text-[10px] ${statusColors[l.status] || ""}`}>{l.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === "bn" ? "মালিক" : "Owner"}: {profileMap.get(l.owner_id) || "—"}
                      {l.rooms?.room_number && ` • ${language === "bn" ? "ফ্ল্যাট" : "Flat"}: ${l.rooms.room_number}`}
                    </p>
                    <p className="text-primary font-bold text-sm">৳ {l.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{l.district} • {l.property_type}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {l.status === "pending" && (
                      <Button size="sm" variant="outline" className="text-emerald-600 gap-1" onClick={() => updateStatus(l.id, "active")}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                    )}
                    {l.status === "active" && (
                      <Button size="sm" variant="outline" className="text-amber-600 gap-1" onClick={() => updateStatus(l.id, "pending")}>
                        <XCircle className="h-3.5 w-3.5" /> Suspend
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!filtered?.length && <p className="text-center text-muted-foreground py-8">No listings</p>}
        </div>
      )}

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={handleDelete} title="Delete Listing" description="Are you sure?" />
      <DeleteConfirmDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)} onConfirm={handleBulkDelete} title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"} description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`} />
    </div>
  );
}
