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
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { IssueFormDialog } from "@/components/assets/IssueFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function AssetIssues() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [formOpen, setFormOpen] = useState(false);
  const [editIssue, setEditIssue] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["asset_issues", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("asset_issues")
        .select("*, assets(name)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = issues.filter((i: any) => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    if (filterPriority !== "all" && i.priority !== filterPriority) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("asset_issues").delete().eq("id", deleteId);
    if (error) toast.error(L("Delete failed", "মুছতে ব্যর্থ"));
    else { toast.success(L("Deleted", "মুছে ফেলা হয়েছে")); queryClient.invalidateQueries({ queryKey: ["asset_issues"] }); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          {L("Issue Reports", "সমস্যা রিপোর্ট")}
        </h1>
        <Button onClick={() => { setEditIssue(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> {L("Report Issue", "সমস্যা রিপোর্ট")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Status", "সব অবস্থা")}</SelectItem>
                <SelectItem value="pending">{L("Pending", "বাকি")}</SelectItem>
                <SelectItem value="in_progress">{L("In Progress", "চলমান")}</SelectItem>
                <SelectItem value="resolved">{L("Resolved", "সমাধান")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Priority", "সব অগ্রাধিকার")}</SelectItem>
                <SelectItem value="low">{L("Low", "কম")}</SelectItem>
                <SelectItem value="medium">{L("Medium", "মাঝারি")}</SelectItem>
                <SelectItem value="high">{L("High", "জরুরি")}</SelectItem>
                <SelectItem value="urgent">{L("Urgent", "অতি জরুরি")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{L("No issues", "কোন সমস্যা নেই")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L("Title", "শিরোনাম")}</TableHead>
                  <TableHead>{L("Asset", "সম্পদ")}</TableHead>
                  <TableHead>{L("Priority", "অগ্রাধিকার")}</TableHead>
                  <TableHead>{L("Status", "অবস্থা")}</TableHead>
                  <TableHead>{L("Date", "তারিখ")}</TableHead>
                  <TableHead className="text-right">{L("Actions", "অ্যাকশন")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((issue: any) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.title}</TableCell>
                    <TableCell>{(issue as any).assets?.name || "—"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[issue.priority] || ""}`}>
                        {issue.priority === "low" ? L("Low", "কম") : issue.priority === "medium" ? L("Medium", "মাঝারি") : issue.priority === "high" ? L("High", "জরুরি") : L("Urgent", "অতি জরুরি")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status] || ""}`}>
                        {issue.status === "pending" ? L("Pending", "বাকি") : issue.status === "in_progress" ? L("In Progress", "চলমান") : L("Resolved", "সমাধান")}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(issue.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditIssue(issue); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(issue.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IssueFormDialog open={formOpen} onOpenChange={setFormOpen} issue={editIssue} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["asset_issues"] })} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title={L("Delete", "মুছুন")} description={L("Delete this issue?", "এই সমস্যা মুছে ফেলতে চান?")} />
    </div>
  );
}
