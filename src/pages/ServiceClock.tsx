import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { ClockEntryDialog } from "@/components/services/ClockEntryDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

export default function ServiceClock() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["service_clock", user?.id, dateFilter],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_clock_entries")
        .select("*, services(contact_name, service_type)")
        .eq("owner_id", user!.id)
        .gte("clock_in", `${dateFilter}T00:00:00`)
        .lte("clock_in", `${dateFilter}T23:59:59`)
        .order("clock_in", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("service_clock_entries").delete().eq("id", deleteId);
    if (error) toast.error(L("Delete failed", "মুছতে ব্যর্থ"));
    else { toast.success(L("Deleted", "মুছে ফেলা হয়েছে")); queryClient.invalidateQueries({ queryKey: ["service_clock"] }); }
    setDeleteId(null);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          {L("Clock In/Out", "প্রবেশ/প্রস্থান")}
        </h1>
        <Button onClick={() => { setEditEntry(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> {L("Add Entry", "এন্ট্রি যোগ")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-48" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{L("No entries for this date", "এই তারিখে কোন এন্ট্রি নেই")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L("Person", "ব্যক্তি")}</TableHead>
                  <TableHead>{L("Clock In", "প্রবেশ")}</TableHead>
                  <TableHead>{L("Clock Out", "প্রস্থান")}</TableHead>
                  <TableHead>{L("Duration", "সময়কাল")}</TableHead>
                  <TableHead>{L("Notes", "নোট")}</TableHead>
                  <TableHead className="text-right">{L("Actions", "অ্যাকশন")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e: any) => {
                  const duration = e.clock_out
                    ? Math.round((new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 60000)
                    : null;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{(e as any).services?.contact_name || "—"}</TableCell>
                      <TableCell>{formatTime(e.clock_in)}</TableCell>
                      <TableCell>{e.clock_out ? formatTime(e.clock_out) : "—"}</TableCell>
                      <TableCell>{duration != null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : "—"}</TableCell>
                      <TableCell className="max-w-32 truncate">{e.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditEntry(e); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClockEntryDialog open={formOpen} onOpenChange={setFormOpen} entry={editEntry} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["service_clock"] })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title={L("Delete", "মুছুন")} description={L("Delete this entry?", "এই এন্ট্রি মুছতে চান?")} />
    </div>
  );
}
