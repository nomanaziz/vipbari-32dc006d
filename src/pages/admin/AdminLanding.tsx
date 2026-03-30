import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, ExternalLink } from "lucide-react";

interface LandingSection {
  id: string;
  section_key: string;
  value_bn: string;
  value_en: string;
  section_group: string;
  sort_order: number;
  is_active: boolean;
}

const GROUPS = [
  { key: "hero", label: "Hero" },
  { key: "stats", label: "Stats" },
  { key: "features", label: "Features" },
  { key: "mini_features", label: "Mini Features" },
  { key: "problems", label: "Problems" },
  { key: "benefits_list", label: "Benefits" },
  { key: "how", label: "How it Works" },
  { key: "pricing", label: "Pricing" },
  { key: "comparison", label: "Comparison" },
  { key: "testimonials", label: "Testimonials" },
  { key: "faq", label: "FAQ" },
  { key: "cta", label: "CTA" },
];

const AdminLanding = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [editedRows, setEditedRows] = useState<Record<string, Partial<LandingSection>>>({});
  const [newItem, setNewItem] = useState({ section_key: "", value_bn: "", value_en: "", section_group: "features", sort_order: 100 });

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["admin_landing_sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_sections")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as LandingSection[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LandingSection> }) => {
      const { error } = await supabase.from("landing_sections").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_landing_sections"] });
      queryClient.invalidateQueries({ queryKey: ["landing_sections"] });
      toast.success(t("admin.cms_updated"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("landing_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_landing_sections"] });
      queryClient.invalidateQueries({ queryKey: ["landing_sections"] });
      toast.success(t("admin.cms_deleted"));
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: typeof newItem) => {
      const { error } = await supabase.from("landing_sections").insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_landing_sections"] });
      queryClient.invalidateQueries({ queryKey: ["landing_sections"] });
      setNewItem({ section_key: "", value_bn: "", value_en: "", section_group: "features", sort_order: 100 });
      toast.success(t("admin.cms_created"));
    },
  });

  const handleFieldChange = (id: string, field: string, value: string | number | boolean) => {
    setEditedRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = (item: LandingSection) => {
    const updates = editedRows[item.id];
    if (!updates) return;
    updateMutation.mutate({ id: item.id, updates });
    setEditedRows((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });
  };

  const getVal = (item: LandingSection, field: keyof LandingSection) => {
    const edited = editedRows[item.id];
    if (edited && field in edited) return edited[field as string];
    return item[field];
  };

  const renderGroup = (groupKey: string) => {
    const items = sections.filter((s) => s.section_group === groupKey);
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{item.section_key}</code>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={getVal(item, "is_active") as boolean}
                    onCheckedChange={(v) => handleFieldChange(item.id, "is_active", v)}
                  />
                  <Input
                    type="number"
                    className="w-20 h-8 text-xs"
                    value={getVal(item, "sort_order") as number}
                    onChange={(e) => handleFieldChange(item.id, "sort_order", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">English</Label>
                  <Textarea
                    rows={2}
                    value={getVal(item, "value_en") as string}
                    onChange={(e) => handleFieldChange(item.id, "value_en", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">বাংলা</Label>
                  <Textarea
                    rows={2}
                    value={getVal(item, "value_bn") as string}
                    onChange={(e) => handleFieldChange(item.id, "value_bn", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editedRows[item.id] && (
                  <Button size="sm" onClick={() => handleSave(item)} disabled={updateMutation.isPending}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No items in this section</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Landing Page Editor</h1>
        <Button variant="outline" size="sm" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" /> Preview
          </a>
        </Button>
      </div>

      {/* Add new item */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add New Item</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Section Key</Label>
              <Input value={newItem.section_key} onChange={(e) => setNewItem({ ...newItem, section_key: e.target.value })} placeholder="e.g. feat_9_title" />
            </div>
            <div>
              <Label className="text-xs">Group</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newItem.section_group}
                onChange={(e) => setNewItem({ ...newItem, section_group: e.target.value })}
              >
                {GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">English</Label>
              <Input value={newItem.value_en} onChange={(e) => setNewItem({ ...newItem, value_en: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">বাংলা</Label>
              <Input value={newItem.value_bn} onChange={(e) => setNewItem({ ...newItem, value_bn: e.target.value })} />
            </div>
          </div>
          <Button size="sm" onClick={() => addMutation.mutate(newItem)} disabled={!newItem.section_key || addMutation.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="hero">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {GROUPS.map((g) => (
            <TabsTrigger key={g.key} value={g.key} className="text-xs">
              {g.label} ({sections.filter((s) => s.section_group === g.key).length})
            </TabsTrigger>
          ))}
        </TabsList>
        {GROUPS.map((g) => (
          <TabsContent key={g.key} value={g.key}>
            {renderGroup(g.key)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminLanding;
