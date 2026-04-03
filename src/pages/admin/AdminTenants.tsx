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

const AdminTenants = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [reassignItem, setReassignItem] = useState<{ id: string; name: string } | null>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*, rooms(room_number, properties(name))").order("created_at", { ascending: false }).limit(500);
      if (error) console.error("Admin tenants fetch error:", error);
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

  const deleteTenant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success(language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted");
    },
  });

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await supabase.from("tenants").delete().eq("id", id);
    }
    queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    toast.success(language === "bn" ? `${selectedIds.size}টি মুছে ফেলা হয়েছে` : `${selectedIds.size} deleted`);
    setSelectedIds(new Set());
    setBulkDelete(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const q = search.toLowerCase();
  const filtered = tenants?.filter((t: any) => {
    if (!q) return true;
    const owner = profileMap.get(t.owner_id) || "";
    return [t.full_name, t.phone, owner, (t.rooms as any)?.room_number, (t.rooms as any)?.properties?.name].some(v => v?.toString().toLowerCase().includes(q));
  });

  const toggleAll = () => {
    setSelectedIds(prev => prev.size === (filtered?.length || 0) ? new Set() : new Set(filtered?.map((t: any) => t.id) || []));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{language === "bn" ? "ভাড়াটিয়া ব্যবস্থাপনা" : "Tenant Management"}</h1>
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
              <TableHead>{language === "bn" ? "নাম" : "Name"}</TableHead>
              <TableHead>{language === "bn" ? "ফোন" : "Phone"}</TableHead>
              <TableHead>{language === "bn" ? "মালিক" : "Owner"}</TableHead>
              <TableHead>{language === "bn" ? "রুম" : "Room"}</TableHead>
              <TableHead>{language === "bn" ? "প্রপার্টি" : "Property"}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : !filtered?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{language === "bn" ? "কোনো ভাড়াটিয়া পাওয়া যায়নি" : "No tenants found"}</TableCell></TableRow>
            ) : filtered?.map((tenant: any) => (
              <TableRow key={tenant.id}>
                <TableCell><Checkbox checked={selectedIds.has(tenant.id)} onCheckedChange={() => toggleSelect(tenant.id)} /></TableCell>
                <TableCell className="font-medium">{tenant.full_name}</TableCell>
                <TableCell>{tenant.phone}</TableCell>
                <TableCell>{profileMap.get(tenant.owner_id) || "—"}</TableCell>
                <TableCell>{tenant.rooms?.room_number || "—"}</TableCell>
                <TableCell>{(tenant.rooms as any)?.properties?.name || "—"}</TableCell>
                <TableCell><Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title={language === "bn" ? "হস্তান্তর" : "Reassign"} onClick={() => setReassignItem({ id: tenant.id, name: tenant.full_name })}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(tenant.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteTenant.mutate(deleteId); setDeleteId(null); } }} isPending={deleteTenant.isPending} />
      <DeleteConfirmDialog open={bulkDelete} onOpenChange={(open) => !open && setBulkDelete(false)} onConfirm={handleBulkDelete} title={language === "bn" ? "নির্বাচিত মুছে ফেলুন?" : "Delete selected?"} description={language === "bn" ? `${selectedIds.size}টি আইটেম মুছে ফেলা হবে।` : `${selectedIds.size} items will be deleted.`} />
      {reassignItem && (
        <ReassignDialog
          open={!!reassignItem}
          onOpenChange={(o) => !o && setReassignItem(null)}
          type="tenant"
          itemId={reassignItem.id}
          itemLabel={reassignItem.name}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-tenants"] })}
        />
      )}
    </div>
  );
};

export default AdminTenants;
