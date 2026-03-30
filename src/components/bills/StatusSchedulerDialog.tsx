import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, XCircle } from "lucide-react";

interface StatusSchedulerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: { id: string; full_name: string } | null;
}

export function StatusSchedulerDialog({ open, onOpenChange, tenant }: StatusSchedulerDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [actionType, setActionType] = useState("release");
  const [scheduledDate, setScheduledDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: existingActions } = useQuery({
    queryKey: ["scheduled-actions", tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("scheduled_actions" as any)
        .select("*")
        .eq("tenant_id", tenant!.id)
        .eq("status", "pending")
        .order("scheduled_date", { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!tenant && open,
  });

  const createAction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scheduled_actions" as any).insert({
        owner_id: user!.id,
        tenant_id: tenant!.id,
        action_type: actionType,
        scheduled_date: scheduledDate,
        remarks,
        status: "pending",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-actions"] });
      toast.success(L("Schedule created", "সিডিউল তৈরি হয়েছে"));
      setScheduledDate("");
      setRemarks("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelAction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_actions" as any)
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-actions"] });
      toast.success(L("Schedule cancelled", "সিডিউল বাতিল হয়েছে"));
    },
  });

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {L("Status Scheduler", "স্ট্যাটাস সিডিউলার")}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {L("Tenant", "ভাড়াটিয়া")}: <strong>{tenant.full_name}</strong>
        </p>

        {existingActions && existingActions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {L("Pending Schedules", "মুলতুবি সিডিউল")}
            </Label>
            {existingActions.map((action: any) => (
              <div key={action.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div>
                  <Badge variant="outline" className="mr-2">
                    {action.action_type === "release" ? L("Release", "রিলিজ") : action.action_type}
                  </Badge>
                  <span className="text-muted-foreground">{action.scheduled_date}</span>
                  {action.remarks && <p className="text-xs text-muted-foreground mt-0.5">{action.remarks}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => cancelAction.mutate(action.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); createAction.mutate(); }} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{L("Action Type", "অ্যাকশনের ধরন")}</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="release">{L("Release / Inactive", "রিলিজ / নিষ্ক্রিয়")}</SelectItem>
                <SelectItem value="reminder">{L("Send Reminder", "রিমাইন্ডার পাঠান")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{L("Execution Date", "কার্যকর তারিখ")}</Label>
            <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
          </div>

          <div className="space-y-1.5">
            <Label>{L("Remarks", "মন্তব্য")}</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder={L("Optional note...", "ঐচ্ছিক নোট...")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{L("Close", "বন্ধ")}</Button>
            <Button type="submit" disabled={createAction.isPending || !scheduledDate}>
              {L("Schedule", "সিডিউল করুন")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
