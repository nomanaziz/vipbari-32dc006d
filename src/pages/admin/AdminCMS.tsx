import { useState } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const sections = ["hero", "features", "pricing", "testimonials", "faq", "legal", "general"];

const emptyPage = {
  slug: "", title_bn: "", title_en: "", content_bn: "", content_en: "",
  section: "general", sort_order: 0, is_published: true,
};

const AdminCMS = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyPage);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-cms"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("*").order("sort_order");
      return data || [];
    },
  });

  const savePage = useMutation({
    mutationFn: async (data: typeof form) => {
      if (editing) {
        const { error } = await supabase.from("cms_pages").update(data).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cms_pages").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms"] });
      toast.success(editing ? t("admin.cms_updated") : t("admin.cms_created"));
      setOpen(false);
      setEditing(null);
      setForm(emptyPage);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cms_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms"] });
      toast.success(t("admin.cms_deleted"));
    },
  });

  const openEdit = (page: any) => {
    setEditing(page);
    setForm({
      slug: page.slug, title_bn: page.title_bn, title_en: page.title_en,
      content_bn: page.content_bn, content_en: page.content_en,
      section: page.section, sort_order: page.sort_order, is_published: page.is_published,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyPage);
    setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("admin.cms")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />{t("admin.cms_add")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? t("admin.cms_edit") : t("admin.cms_add")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div>
                  <Label>{t("admin.section")}</Label>
                  <Select value={form.section} onValueChange={(v) => setForm({ ...form, section: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              <div>
                <Label>{t("admin.content_bn")}</Label>
                <Textarea rows={4} value={form.content_bn} onChange={(e) => setForm({ ...form, content_bn: e.target.value })} />
              </div>
              <div>
                <Label>{t("admin.content_en")}</Label>
                <Textarea rows={4} value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} />
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
              <Button onClick={() => savePage.mutate(form)} disabled={savePage.isPending}>
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
              <TableHead>Slug</TableHead>
              <TableHead>{t("admin.title_en")}</TableHead>
              <TableHead>{t("admin.section")}</TableHead>
              <TableHead>{t("admin.published")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">{t("common.loading")}</TableCell></TableRow>
            ) : pages?.map((page: any) => (
              <TableRow key={page.id}>
                <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                <TableCell>{page.title_en}</TableCell>
                <TableCell><Badge variant="secondary">{page.section}</Badge></TableCell>
                <TableCell>
                  <Badge variant={page.is_published ? "default" : "outline"}>
                    {page.is_published ? "✓" : "✗"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(page)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePage.mutate(page.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCMS;
