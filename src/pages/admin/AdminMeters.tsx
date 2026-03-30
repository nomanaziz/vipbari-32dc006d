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

const AdminMeters = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: meters, isLoading } = useQuery({
    queryKey: ["admin-meters"],
    queryFn: async () => {
      const { data } = await supabase.from("meters").select("*, rooms(room_number, properties(name)), tenants(full_name)").order("created_at", { ascending: false });
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

  const deleteMeter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-meters"] });
      toast.success(t("meter.deleted"));
    },
  });

  const handleBulkDelete = async () => {
    for (const id of selectedIds) { await supabase.from("meters").delete().eq("id", id); }
    queryClient.invalidateQueries({ queryKey: ["admin-meters"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const q = search.toLowerCase();
  const filtered = meters?.filter((m: any) => {
    if (!q) return true;
    const owner = profileMap.get(m.owner_id) || "";
    return [m.meter_number, owner, m.meter_type, m.rooms?.properties?.name, m.rooms?.room_number, m.tenants?.full_name].some(v => v?.toString().toLowerCase().includes(q));
  });

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === (filtered?.length || 0) ? new Set() : new Set(filtered?.map((m: any) => m.id) || []));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.meters")}</h1>
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
              <TableHead>{t("meter.number")}</TableHead>
              <TableHead>{language === "bn" ? "মালিক" : "Owner"}</TableHead>
              <TableHead>{t("meter.type")}</TableHead>
              <TableHead>{t("meter.billing_type")}</TableHead>
              <TableHead>{t("property.name")}</TableHead>
              <TableHead>{t("room.number")}</TableHead>
              <TableHead>{t("tenant.name")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{t("meter.no_meters")}</TableCell></TableRow>
            ) : filtered?.map((m: any) => (
              <TableRow key={m.id}>
                <TableCell><Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} /></TableCell>
                <TableCell className="font-medium">{m.meter_number}</TableCell>
                <TableCell>{profileMap.get(m.owner_id) || "—"}</TableCell>
                <TableCell><Badge variant="outline">{m.meter_type}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{m.billing_type}</Badge></TableCell>
                <TableCell>{m.rooms?.properties?.name || "—"}</TableCell>
                <TableCell>{m.rooms?.room_number || "—"}</TableCell>
                <TableCell>{m.tenants?.full_name || "—"}</TableCell>
                <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteMeter.mutate(deleteId); setDeleteId(null); } }} isPending={deleteMeter.isPending} />
      <DeleteConfirmDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)} onConfirm={handleBulkDelete} title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"} description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`} />
    </div>
  );
};

export default AdminMeters;
