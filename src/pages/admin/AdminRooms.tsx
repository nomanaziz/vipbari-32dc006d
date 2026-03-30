import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Trash2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import ReassignDialog from "@/components/admin/ReassignDialog";

const AdminRooms = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [reassignItem, setReassignItem] = useState<{ id: string; label: string } | null>(null);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*, properties(name, owner_id)").order("created_at", { ascending: false });
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

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      toast.success(t("room.deleted"));
    },
  });

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await supabase.from("rooms").delete().eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const q = search.toLowerCase();
  const filtered = rooms?.filter((r: any) => {
    if (!q) return true;
    const owner = profileMap.get(r.properties?.owner_id) || "";
    return [r.room_number, owner, r.properties?.name, r.room_type, r.status].some(v => v?.toString().toLowerCase().includes(q));
  });

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === (filtered?.length || 0) ? new Set() : new Set(filtered?.map((r: any) => r.id) || []));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.rooms")}</h1>
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
              <TableHead>{t("room.number")}</TableHead>
              <TableHead>{language === "bn" ? "মালিক" : "Owner"}</TableHead>
              <TableHead>{t("room.property")}</TableHead>
              <TableHead>{t("room.type")}</TableHead>
              <TableHead>{t("room.floor")}</TableHead>
              <TableHead>{t("room.rent")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : filtered?.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell><Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} /></TableCell>
                <TableCell className="font-medium">{r.room_number}</TableCell>
                <TableCell>{profileMap.get(r.properties?.owner_id) || "—"}</TableCell>
                <TableCell>{r.properties?.name || "—"}</TableCell>
                <TableCell>{r.room_type}</TableCell>
                <TableCell>{r.floor}</TableCell>
                <TableCell>৳{Number(r.rent_amount).toLocaleString()}</TableCell>
                <TableCell><Badge variant={r.status === "occupied" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title={language === "bn" ? "হস্তান্তর" : "Reassign"} onClick={() => setReassignItem({ id: r.id, label: `${r.room_number} (${r.properties?.name || ""})` })}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteRoom.mutate(deleteId); setDeleteId(null); } }} isPending={deleteRoom.isPending} />
      <DeleteConfirmDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)} onConfirm={handleBulkDelete} title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"} description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`} />
      {reassignItem && (
        <ReassignDialog
          open={!!reassignItem}
          onOpenChange={(o) => !o && setReassignItem(null)}
          type="room"
          itemId={reassignItem.id}
          itemLabel={reassignItem.label}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-rooms"] })}
        />
      )}
    </div>
  );
};

export default AdminRooms;
