import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { AssetFormDialog } from "@/components/assets/AssetFormDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, { bn: string; en: string }> = {
  electrical_equipment: { bn: "বৈদ্যুতিক", en: "Electrical" },
  plumbing: { bn: "প্লাম্বিং", en: "Plumbing" },
  furniture: { bn: "আসবাবপত্র", en: "Furniture" },
  appliance: { bn: "যন্ত্রপাতি", en: "Appliance" },
  hvac: { bn: "এসি/হিটিং", en: "HVAC" },
  safety: { bn: "নিরাপত্তা", en: "Safety" },
  elevator: { bn: "লিফট", en: "Elevator" },
  generator: { bn: "জেনারেটর", en: "Generator" },
  water_system: { bn: "পানি সিস্টেম", en: "Water" },
  other: { bn: "অন্যান্য", en: "Other" },
};

const CONDITION_COLORS: Record<string, string> = {
  good: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  fair: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  poor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  damaged: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

function getWarrantyBadge(warrantyEndDate: string | null, language: string) {
  if (!warrantyEndDate) return null;
  const today = new Date();
  const end = new Date(warrantyEndDate);
  const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return <Badge variant="destructive" className="text-xs">{language === "bn" ? "মেয়াদ শেষ" : "Expired"}</Badge>;
  }
  if (diffDays <= 30) {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
      {diffDays}{language === "bn" ? " দিন বাকি" : "d left"}
    </Badge>;
  }
  const months = Math.floor(diffDays / 30);
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
    {months > 0 ? `${months}${language === "bn" ? " মাস" : "m"}` : `${diffDays}${language === "bn" ? " দিন" : "d"}`}
  </Badge>;
}

export default function Assets() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const L = (en: string, bn: string) => language === "bn" ? bn : en;

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("assets")
        .select("*, properties(name), rooms(room_number)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const filtered = assets.filter((a: any) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && a.category !== filterCategory) return false;
    if (filterCondition !== "all" && a.condition !== filterCondition) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("assets").delete().eq("id", deleteId);
    if (error) toast.error(L("Delete failed", "মুছে ফেলা ব্যর্থ"));
    else { toast.success(L("Asset deleted", "সম্পদ মুছে ফেলা হয়েছে")); queryClient.invalidateQueries({ queryKey: ["assets"] }); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          {L("Assets", "সম্পদ")}
        </h1>
        <Button onClick={() => { setEditAsset(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> {L("Add Asset", "সম্পদ যোগ")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={L("Search assets...", "সম্পদ খুঁজুন...")} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Categories", "সব ক্যাটাগরি")}</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{language === "bn" ? v.bn : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCondition} onValueChange={setFilterCondition}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("All Conditions", "সব অবস্থা")}</SelectItem>
                <SelectItem value="good">{L("Good", "ভালো")}</SelectItem>
                <SelectItem value="fair">{L("Fair", "মোটামুটি")}</SelectItem>
                <SelectItem value="poor">{L("Poor", "খারাপ")}</SelectItem>
                <SelectItem value="damaged">{L("Damaged", "ক্ষতিগ্রস্ত")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{L("Loading...", "লোড হচ্ছে...")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{L("No assets found", "কোন সম্পদ পাওয়া যায়নি")}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{L("Name", "নাম")}</TableHead>
                    <TableHead>{L("Category", "ক্যাটাগরি")}</TableHead>
                    <TableHead>{L("Condition", "অবস্থা")}</TableHead>
                    <TableHead>{L("Price", "মূল্য")}</TableHead>
                    <TableHead>{L("Warranty", "ওয়ারেন্টি")}</TableHead>
                    <TableHead>{L("Property", "প্রপার্টি")}</TableHead>
                    <TableHead className="text-right">{L("Actions", "অ্যাকশন")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((asset: any) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[asset.category]?.[language === "bn" ? "bn" : "en"] || asset.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[asset.condition] || ""}`}>
                          {asset.condition === "good" ? L("Good", "ভালো") :
                           asset.condition === "fair" ? L("Fair", "মোটামুটি") :
                           asset.condition === "poor" ? L("Poor", "খারাপ") : L("Damaged", "ক্ষতিগ্রস্ত")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {asset.purchase_price > 0 ? `৳${Number(asset.purchase_price).toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        {getWarrantyBadge(asset.warranty_end_date, language) || "—"}
                      </TableCell>
                      <TableCell>{(asset as any).properties?.name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEditAsset(asset); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(asset.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog open={formOpen} onOpenChange={setFormOpen} asset={editAsset} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["assets"] })} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={L("Delete Asset", "সম্পদ মুছুন")}
        description={L("Are you sure you want to delete this asset?", "আপনি কি এই সম্পদটি মুছে ফেলতে চান?")}
      />
    </div>
  );
}
