import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, Clock, CheckCircle2, XCircle, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { LeaseFormDialog } from "@/components/leases/LeaseFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export default function Leases() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLease, setEditLease] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: leases = [], isLoading } = useQuery({
    queryKey: ["leases", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("*, properties(name), rooms(room_number)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, name")
        .eq("owner_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast.success(L("Lease deleted", "লিজ মুছে ফেলা হয়েছে"));
      setDeleteId(null);
    },
    onError: () => toast.error(L("Failed to delete", "মুছে ফেলা যায়নি")),
  });

  const filtered = useMemo(() => {
    return leases.filter((l: any) => {
      if (filterProperty !== "all" && l.property_id !== filterProperty) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.tenant_name?.toLowerCase().includes(q) || l.unit_flat?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [leases, filterProperty, filterStatus, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = leases.length;
    const active = leases.filter((l: any) => l.status === "active").length;
    const expiringSoon = leases.filter((l: any) => {
      if (l.status !== "active" || !l.end_date) return false;
      return differenceInDays(parseISO(l.end_date), now) <= 30 && differenceInDays(parseISO(l.end_date), now) >= 0;
    }).length;
    const expired = leases.filter((l: any) => l.status === "expired").length;
    return { total, active, expiringSoon, expired };
  }, [leases]);

  const getStatusBadge = (status: string, endDate: string | null) => {
    if (status === "terminated") return <Badge variant="destructive">{L("Terminated", "বাতিল")}</Badge>;
    if (status === "expired") return <Badge variant="secondary">{L("Expired", "মেয়াদোত্তীর্ণ")}</Badge>;
    if (endDate && differenceInDays(parseISO(endDate), new Date()) <= 30 && differenceInDays(parseISO(endDate), new Date()) >= 0) {
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-200">{L("Expiring Soon", "শীঘ্রই শেষ")}</Badge>;
    }
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200">{L("Active", "সক্রিয়")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {L("Leases", "লিজ চুক্তি")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {L("Manage lease agreements and contractual timelines", "লিজ চুক্তি এবং চুক্তির সময়সীমা পরিচালনা করুন")}
          </p>
        </div>
        <Button onClick={() => { setEditLease(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> {L("New Lease", "নতুন লিজ")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: L("Total Leases", "মোট লিজ"), value: stats.total, icon: FileText, color: "text-primary" },
          { label: L("Active", "সক্রিয়"), value: stats.active, icon: CheckCircle2, color: "text-emerald-500" },
          { label: L("Expiring Soon", "শীঘ্রই শেষ"), value: stats.expiringSoon, icon: Clock, color: "text-amber-500" },
          { label: L("Expired", "মেয়াদোত্তীর্ণ"), value: stats.expired, icon: XCircle, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={L("Search by tenant or unit...", "ভাড়াটিয়া বা ইউনিট দিয়ে খুঁজুন...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder={L("All Properties", "সব সম্পত্তি")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L("All Properties", "সব সম্পত্তি")}</SelectItem>
            {properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={L("All Status", "সব স্ট্যাটাস")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L("All Status", "সব স্ট্যাটাস")}</SelectItem>
            <SelectItem value="active">{L("Active", "সক্রিয়")}</SelectItem>
            <SelectItem value="expired">{L("Expired", "মেয়াদোত্তীর্ণ")}</SelectItem>
            <SelectItem value="terminated">{L("Terminated", "বাতিল")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{L("No leases found", "কোনো লিজ পাওয়া যায়নি")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L("Tenant", "ভাড়াটিয়া")}</TableHead>
                  <TableHead className="hidden md:table-cell">{L("Property", "সম্পত্তি")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{L("Unit/Flat", "ইউনিট/ফ্ল্যাট")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{L("Monthly Rent", "মাসিক ভাড়া")}</TableHead>
                  <TableHead className="hidden md:table-cell">{L("Start", "শুরু")}</TableHead>
                  <TableHead className="hidden md:table-cell">{L("End", "শেষ")}</TableHead>
                  <TableHead>{L("Status", "অবস্থা")}</TableHead>
                  <TableHead className="text-right">{L("Actions", "একশন")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lease: any) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">{lease.tenant_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{lease.properties?.name || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{lease.unit_flat || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">৳{Number(lease.monthly_rent).toLocaleString()}</TableCell>
                    <TableCell className="hidden md:table-cell">{lease.start_date ? format(parseISO(lease.start_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{lease.end_date ? format(parseISO(lease.end_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell>{getStatusBadge(lease.status, lease.end_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditLease(lease); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(lease.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LeaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editLease}
        properties={properties}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={L("Delete Lease?", "লিজ মুছে ফেলবেন?")}
        description={L("This action cannot be undone.", "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।")}
      />
    </div>
  );
}
