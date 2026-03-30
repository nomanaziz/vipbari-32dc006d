import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const emptyForm = { name_en: "", name_bn: "", description_en: "", description_bn: "", price: 0, duration_days: 30, features: "", is_active: true, sort_order: 0 };

const AdminPlans = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("subscription_plans").select("*").order("sort_order");
      return data || [];
    },
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      const payload = {
        name_en: form.name_en,
        name_bn: form.name_bn,
        description_en: form.description_en,
        description_bn: form.description_bn,
        price: form.price,
        duration_days: form.duration_days,
        features: JSON.parse(form.features || "[]"),
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (editId) {
        const { error } = await supabase.from("subscription_plans").update(payload as any).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscription_plans").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success(editId ? t("admin.plan_updated") : t("admin.plan_created"));
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success(t("admin.plan_deleted"));
    },
  });

  const openEdit = (plan: any) => {
    setEditId(plan.id);
    setForm({
      name_en: plan.name_en,
      name_bn: plan.name_bn,
      description_en: plan.description_en,
      description_bn: plan.description_bn,
      price: plan.price,
      duration_days: plan.duration_days,
      features: JSON.stringify(plan.features || []),
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.plans")}</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t("admin.add_plan")}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? t("admin.edit_plan") : t("admin.add_plan")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t("admin.title_en")}</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
                <div><Label>{t("admin.title_bn")}</Label><Input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} /></div>
              </div>
              <div><Label>{t("admin.content_en")}</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
              <div><Label>{t("admin.content_bn")}</Label><Textarea value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>{t("admin.price")}</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
                <div><Label>{t("admin.duration_days")}</Label><Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} /></div>
                <div><Label>{t("admin.sort_order")}</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></div>
              </div>
              <div><Label>{t("admin.features_json")}</Label><Textarea placeholder='["Feature 1", "Feature 2"]' value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>{t("admin.active")}</Label>
              </div>
              <Button className="w-full" onClick={() => savePlan.mutate()} disabled={savePlan.isPending}>
                {savePlan.isPending ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.title_en")}</TableHead>
              <TableHead>{t("admin.price")}</TableHead>
              <TableHead>{t("admin.duration_days")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : plans?.map((plan: any) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name_en}</TableCell>
                <TableCell>৳{Number(plan.price).toLocaleString()}</TableCell>
                <TableCell>{plan.duration_days} {t("admin.days")}</TableCell>
                <TableCell>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? t("admin.active") : t("admin.inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("common.delete")}?</AlertDialogTitle>
                          <AlertDialogDescription>{t("admin.delete_plan_confirm")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePlan.mutate(plan.id)} className="bg-destructive text-destructive-foreground">
                            {t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && !plans?.length && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("admin.no_plans")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPlans;
