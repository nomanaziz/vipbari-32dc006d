import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { MaintenanceFormDialog } from "@/components/assets/MaintenanceFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function AssetMaintenance() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["asset_maintenance", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("asset_maintenance")
        .select("*, assets(name)")
        .eq("owner_id", user!.id)
        .order("maintenance_date", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = records.filter((r: any) => filterStatus === "all" || r.status === filterStatus);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("asset_maintenance").delete().eq("id", deleteId);
    if (error) toast.error(L("Delete failed", "মুছতে ব্যর্থ"));
    else { toast.success(L("Deleted", "মুছে ফেলা হয়েছে")); queryClient.invalidateQueries({ queryKey: ["asset_maintenance"] }); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          {L("Maintenance Schedule", "রক্ষণাবেক্ষণ সময়সূচী")}
        </h1>
        <Button onClick={() => { setEditRecord(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> {L("Add", "যোগ করুন")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L("All Status", "সব অবস্থা")}</SelectItem>
              <SelectItem value="pending">{L("Pending", "বাকি")}</SelectItem>
              <SelectItem value="completed">{L("Completed", "সম্পন্ন")}</SelectItem>
              <SelectItem value="overdue">{L("Overdue", "মেয়াদ উত্তীর্ণ")}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{L("No records", "কোন রেকর্ড নেই")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L("Asset", "সম্পদ")}</TableHead>
                  <TableHead>{L("Date", "তারিখ")}</TableHead>
                  <TableHead>{L("Schedule", "সময়সূচী")}</TableHead>
                  <TableHead>{L("Status", "অবস্থা")}</TableHead>
                  <TableHead>{L("Amount (৳)", "খরচ (৳)")}</TableHead>
                  <TableHead className="text-right">{L("Actions", "অ্যাকশন")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{(r as any).assets?.name || "—"}</TableCell>
                    <TableCell>{r.maintenance_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.schedule_type === "one_time" ? L("Once", "একবার") : r.schedule_type === "monthly" ? L("Monthly", "মাসিক") : r.schedule_type === "quarterly" ? L("Quarterly", "ত্রৈমাসিক") : r.schedule_type === "half_year" ? L("Half Yearly", "ছয় মাসে") : L("Yearly", "বার্ষিক")}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ""}`}>
                        {r.status === "pending" ? L("Pending", "বাকি") : r.status === "completed" ? L("Completed", "সম্পন্ন") : L("Overdue", "মেয়াদ উত্তীর্ণ")}
                      </span>
                    </TableCell>
                    <TableCell>৳{r.amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditRecord(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MaintenanceFormDialog open={formOpen} onOpenChange={setFormOpen} record={editRecord} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["asset_maintenance"] })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title={L("Delete", "মুছুন")} description={L("Delete this maintenance record?", "এই রেকর্ড মুছে ফেলতে চান?")} />
    </div>
  );
}
