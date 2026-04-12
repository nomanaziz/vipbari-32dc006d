import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Headphones } from "lucide-react";
import { ServiceFormDialog } from "@/components/services/ServiceFormDialog";
import { SERVICE_TYPES } from "@/components/services/ServiceTypeGrid";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

export default function Services() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("*, properties(name)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const getTypeLabel = (type: string) => {
    const t = SERVICE_TYPES.find(s => s.value === type);
    return t ? (language === "bn" ? t.bn : t.en) : type;
  };

  const filtered = services.filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.contact_name?.toLowerCase().includes(q) || getTypeLabel(s.service_type).toLowerCase().includes(q);
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("services").delete().eq("id", deleteId);
    if (error) toast.error(L("Delete failed", "মুছতে ব্যর্থ"));
    else { toast.success(L("Deleted", "মুছে ফেলা হয়েছে")); queryClient.invalidateQueries({ queryKey: ["services"] }); }
    setDeleteId(null);
  };

  const statusLabel = (s: string) => s === "available" ? L("Available", "সক্রিয়") : s === "on_leave" ? L("On Leave", "ছুটিতে") : L("Unavailable", "নিষ্ক্রিয়");
  const statusColor = (s: string) => s === "available" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : s === "on_leave" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="h-6 w-6" />
          {L("Services", "সেবা")}
        </h1>
        <Button onClick={() => { setEditService(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> {L("Add Service", "সেবা যোগ")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={L("Search services...", "সেবা খুঁজুন...")} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{L("No services found", "কোন সেবা পাওয়া যায়নি")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L("Type", "ধরন")}</TableHead>
                  <TableHead>{L("Contact", "যোগাযোগ")}</TableHead>
                  <TableHead>{L("Phone", "ফোন")}</TableHead>
                  <TableHead>{L("Property", "প্রপার্টি")}</TableHead>
                  <TableHead>{L("Price (৳)", "মূল্য (৳)")}</TableHead>
                  <TableHead>{L("Status", "অবস্থা")}</TableHead>
                  <TableHead className="text-right">{L("Actions", "অ্যাকশন")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(s.service_type)}</Badge>
                      {s.is_daily_help && <Badge className="ml-1 text-[10px]" variant="secondary">{L("Daily", "দৈনিক")}</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{s.contact_name}</TableCell>
                    <TableCell>{s.contact_phone || "—"}</TableCell>
                    <TableCell>{(s as any).properties?.name || "—"}</TableCell>
                    <TableCell>৳{s.price?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditService(s); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editService} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["services"] })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title={L("Delete", "মুছুন")} description={L("Delete this service?", "এই সেবা মুছে ফেলতে চান?")} />
    </div>
  );
}
