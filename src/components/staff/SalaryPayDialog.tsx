import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface SalaryPayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  staffAssignmentId: string;
  defaultSalary: number;
}

const SalaryPayDialog = ({ open, onOpenChange, staffName, staffAssignmentId, defaultSalary }: SalaryPayDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentMonth = format(new Date(), "yyyy-MM");
  const [form, setForm] = useState({ amount: defaultSalary.toString(), month: currentMonth, notes: "" });

  const { data: history } = useQuery({
    queryKey: ["salary-history", staffAssignmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("salary_payments")
        .select("*")
        .eq("staff_assignment_id", staffAssignmentId)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: open && !!staffAssignmentId,
  });

  const paySalary = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salary_payments").insert({
        staff_assignment_id: staffAssignmentId,
        owner_id: user!.id,
        amount: parseFloat(form.amount),
        month: form.month,
        notes: form.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      toast.success("বেতন প্রদান সফল / Salary paid successfully");
      setForm({ amount: defaultSalary.toString(), month: currentMonth, notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>বেতন প্রদান — {staffName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>মাস / Month</Label>
              <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
            <div>
              <Label>পরিমাণ / Amount (৳)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>নোট / Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ঐচ্ছিক নোট..." />
          </div>
          <Button className="w-full" onClick={() => paySalary.mutate()} disabled={paySalary.isPending || !form.amount || !form.month}>
            {paySalary.isPending ? "প্রক্রিয়াকরণ..." : "বেতন দিন / Pay Salary"}
          </Button>

          {history && history.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <p className="text-sm font-medium">সাম্প্রতিক বেতন / Recent Payments</p>
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between text-sm border rounded-md p-2">
                  <div>
                    <Badge variant="outline" className="text-xs">{h.month}</Badge>
                    {h.notes && <span className="text-xs text-muted-foreground ml-2">{h.notes}</span>}
                  </div>
                  <span className="font-semibold">৳{h.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalaryPayDialog;
