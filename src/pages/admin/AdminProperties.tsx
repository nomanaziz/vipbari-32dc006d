import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, History, UserPlus } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import PropertyHistoryDialog from "@/components/properties/PropertyHistoryDialog";
import ReassignDialog from "@/components/admin/ReassignDialog";

const AdminProperties = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [reassignItem, setReassignItem] = useState<{ id: string; name: string } | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
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

  const deleteProp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      toast.success(t("property.deleted"));
    },
  });

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await supabase.from("properties").delete().eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === (filtered?.length || 0)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered?.map(p => p.id) || []));
    }
  };

  const q = search.toLowerCase();
  const filtered = properties?.filter((p) => {
    if (!q) return true;
    const owner = profileMap.get(p.owner_id) || "";
    return [p.name, owner, p.address, p.property_type].some(v => v?.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.properties")}</h1>
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
              <TableHead className="w-10">
                <Checkbox checked={filtered?.length ? selectedIds.size === filtered.length : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>{t("property.name")}</TableHead>
              <TableHead>{language === "bn" ? "মালিক" : "Owner"}</TableHead>
              <TableHead>{t("property.address")}</TableHead>
              <TableHead>{t("property.type")}</TableHead>
              <TableHead>{t("dashboard.total_rooms")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : filtered?.map((p) => (
              <TableRow key={p.id}>
                <TableCell><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{profileMap.get(p.owner_id) || "—"}</TableCell>
                <TableCell>{p.address}</TableCell>
                <TableCell>{p.property_type}</TableCell>
                <TableCell>{p.total_rooms}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title={language === "bn" ? "হস্তান্তর" : "Reassign"} onClick={() => setReassignItem({ id: p.id, name: p.name })}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <PropertyHistoryDialog propertyId={p.id} propertyName={p.name} />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteProp.mutate(deleteId); setDeleteId(null); } }}
        isPending={deleteProp.isPending}
      />
      <DeleteConfirmDialog
        open={bulkDelete}
        onOpenChange={(open) => !open && setBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"}
        description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`}
      />
      {reassignItem && (
        <ReassignDialog
          open={!!reassignItem}
          onOpenChange={(o) => !o && setReassignItem(null)}
          type="property"
          itemId={reassignItem.id}
          itemLabel={reassignItem.name}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-properties"] })}
        />
      )}
    </div>
  );
};

export default AdminProperties;
