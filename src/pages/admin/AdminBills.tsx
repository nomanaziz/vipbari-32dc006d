import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const AdminBills = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: bills, isLoading } = useQuery({
    queryKey: ["admin-bills"],
    queryFn: async () => {
      const { data } = await supabase.from("bills").select("*, tenants(full_name), rooms(room_number, properties(name, owner_id))").order("created_at", { ascending: false });
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

  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bills"] });
      toast.success(t("admin.bill_deleted"));
    },
  });

  const handleBulkDelete = async () => {
    for (const id of selectedIds) { await supabase.from("bills").delete().eq("id", id); }
    queryClient.invalidateQueries({ queryKey: ["admin-bills"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const q = search.toLowerCase();
  const filtered = bills?.filter((b: any) => {
    if (!q) return true;
    const owner = profileMap.get(b.rooms?.properties?.owner_id || b.owner_id) || "";
    return [b.month, owner, b.tenants?.full_name, b.rooms?.room_number].some(v => v?.toString().toLowerCase().includes(q));
  });

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === (filtered?.length || 0) ? new Set() : new Set(filtered?.map((b: any) => b.id) || []));
  };

  const statusColor = (status: string) => {
    if (status === "paid") return "default";
    if (status === "partial") return "secondary";
    return "destructive";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.bills")}</h1>
        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" onClick={() => setBulkDelete(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            {language === "bn" ? `নির্বাচিত মুছুন (${selectedIds.size})` : `Delete Selected (${selectedIds.size})`}
          </Button>
        )}
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={language === "bn" ? "খুঁজুন..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={filtered?.length ? selectedIds.size === filtered.length : false} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>{t("bill.month")}</TableHead>
              <TableHead>{language === "bn" ? "মালিক" : "Owner"}</TableHead>
              <TableHead>{t("tenant.name")}</TableHead>
              <TableHead>{language === "bn" ? "ফ্ল্যাট" : "Flat"}</TableHead>
              <TableHead>{t("bill.total")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : filtered?.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell><Checkbox checked={selectedIds.has(b.id)} onCheckedChange={() => toggleSelect(b.id)} /></TableCell>
                <TableCell>{b.month}</TableCell>
                <TableCell>{profileMap.get(b.rooms?.properties?.owner_id || b.owner_id) || "—"}</TableCell>
                <TableCell>{b.tenants?.full_name || "—"}</TableCell>
                <TableCell>{b.rooms?.room_number || "—"}</TableCell>
                <TableCell>৳{Number(b.total_amount).toLocaleString()}</TableCell>
                <TableCell><Badge variant={statusColor(b.status)}>{t(`bill.${b.status}`)}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteBill.mutate(deleteId); setDeleteId(null); } }} isPending={deleteBill.isPending} />
      <DeleteConfirmDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)} onConfirm={handleBulkDelete} title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"} description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`} />
    </div>
  );
};

export default AdminBills;
