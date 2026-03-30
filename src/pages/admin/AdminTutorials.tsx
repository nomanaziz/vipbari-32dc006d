import { useState } from "react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

const categories = ["general", "landlord", "tenant", "staff"];

const emptyTutorial = {
  title_bn: "", title_en: "", description_bn: "", description_en: "",
  youtube_url: "", thumbnail_url: "", category: "general",
  sort_order: 0, is_published: true,
};

const AdminTutorials = () => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyTutorial);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tutorials, isLoading } = useQuery({
    queryKey: ["admin-tutorials"],
    queryFn: async () => {
      const { data } = await supabase.from("tutorials" as any).select("*").order("sort_order");
      return data || [];
    },
  });

  const saveTutorial = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editing) {
        const { error } = await supabase.from("tutorials" as any).update(data).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tutorials" as any).insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast.success(editing ? t("admin.tutorial_updated") : t("admin.tutorial_created"));
      setOpen(false);
      setEditing(null);
      setForm(emptyTutorial);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTutorial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tutorials" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tutorials"] });
      toast.success(t("admin.tutorial_deleted"));
    },
  });

  const openEdit = (tutorial: any) => {
    setEditing(tutorial);
    setForm({
      title_bn: tutorial.title_bn, title_en: tutorial.title_en,
      description_bn: tutorial.description_bn, description_en: tutorial.description_en,
      youtube_url: tutorial.youtube_url, thumbnail_url: tutorial.thumbnail_url,
      category: tutorial.category, sort_order: tutorial.sort_order, is_published: tutorial.is_published,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyTutorial);
    setOpen(true);
  };

  const getCategoryLabel = (cat: string) => {
    const key = `tutorial.${cat}`;
    return t(key);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6" />
          {t("admin.tutorials")}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />{t("admin.tutorial_add")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? t("admin.tutorial_edit") : t("admin.tutorial_add")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("admin.title_bn")}</Label>
                  <Input value={form.title_bn} onChange={(e) => setForm({ ...form, title_bn: e.target.value })} />
                </div>
                <div>
                  <Label>{t("admin.title_en")}</Label>
                  <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("admin.desc_bn")}</Label>
                  <Textarea rows={3} value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} />
                </div>
                <div>
                  <Label>{t("admin.desc_en")}</Label>
                  <Textarea rows={3} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>YouTube URL</Label>
                  <Input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
                <div>
                  <Label>{t("admin.category")}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c}>{getCategoryLabel(c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{t("admin.thumbnail_url")}</Label>
                <Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://img.youtube.com/vi/.../hqdefault.jpg" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>{t("admin.sort_order")}</Label>
                  <Input type="number" className="w-20" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2">
                  <Label>{t("admin.published")}</Label>
                  <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                </div>
              </div>
              <Button onClick={() => saveTutorial.mutate(form)} disabled={saveTutorial.isPending}>
                {t("common.save")}
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
              <TableHead>{t("admin.category")}</TableHead>
              <TableHead>YouTube</TableHead>
              <TableHead>{t("admin.published")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : tutorials?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("tutorial.no_tutorials")}</TableCell></TableRow>
            ) : tutorials?.map((tut: any) => (
              <TableRow key={tut.id}>
                <TableCell>{language === "bn" ? tut.title_bn || tut.title_en : tut.title_en}</TableCell>
                <TableCell><Badge variant="secondary">{getCategoryLabel(tut.category)}</Badge></TableCell>
                <TableCell>
                  {tut.youtube_url ? (
                    <a href={tut.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      🔗 Link
                    </a>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={tut.is_published ? "default" : "outline"}>
                    {tut.is_published ? "✓" : "✗"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(tut)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(tut.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteTutorial.mutate(deleteId); setDeleteId(null); } }}
        isPending={deleteTutorial.isPending}
      />
    </div>
  );
};

export default AdminTutorials;
