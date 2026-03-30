import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, MousePointer, Megaphone } from "lucide-react";

const AdminAds = () => {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (ad: any) => {
      if (ad.id) {
        const { error } = await supabase.from("ads").update({
          title: ad.title,
          ad_type: ad.ad_type,
          placement: ad.placement,
          image_url: ad.image_url,
          link_url: ad.link_url,
          is_active: ad.is_active,
          sort_order: ad.sort_order,
        }).eq("id", ad.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ads").insert({
          title: ad.title,
          ad_type: ad.ad_type,
          placement: ad.placement,
          image_url: ad.image_url,
          link_url: ad.link_url,
          is_active: ad.is_active,
          sort_order: ad.sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Ad saved");
      setEditDialog(null);
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ad deleted");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = async (ad: any) => {
    const { error } = await supabase.from("ads").update({ is_active: !ad.is_active }).eq("id", ad.id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
  };

  const newAd = () => setEditDialog({
    title: "", ad_type: "banner", placement: "listing_detail",
    image_url: "", link_url: "", is_active: true, sort_order: 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Ads Management
          </h1>
          <p className="text-sm text-muted-foreground">Manage banner ads across the site</p>
        </div>
        <Button onClick={newAd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Ad
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center"><Eye className="h-4 w-4 inline" /></TableHead>
                <TableHead className="text-center"><MousePointer className="h-4 w-4 inline" /></TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : !ads?.length ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No ads yet</TableCell></TableRow>
              ) : ads.map((ad: any) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {ad.image_url && <img src={ad.image_url} alt="" className="h-8 w-12 object-cover rounded" />}
                      {ad.title || "—"}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{ad.ad_type}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{ad.placement}</Badge></TableCell>
                  <TableCell>
                    <Switch checked={ad.is_active} onCheckedChange={() => toggleActive(ad)} />
                  </TableCell>
                  <TableCell className="text-center">{ad.impressions}</TableCell>
                  <TableCell className="text-center">{ad.clicks}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditDialog({ ...ad })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(ad.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(v) => { if (!v) setEditDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editDialog?.id ? "Edit Ad" : "Create Ad"}</DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editDialog.title} onChange={(e) => setEditDialog({ ...editDialog, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ad Type</Label>
                  <Select value={editDialog.ad_type} onValueChange={(v) => setEditDialog({ ...editDialog, ad_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select value={editDialog.placement} onValueChange={(v) => setEditDialog({ ...editDialog, placement: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="listing_detail">Listing Detail</SelectItem>
                      <SelectItem value="tolet_page">To-Let Page</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="inline">Inline</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={editDialog.image_url} onChange={(e) => setEditDialog({ ...editDialog, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input value={editDialog.link_url} onChange={(e) => setEditDialog({ ...editDialog, link_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={editDialog.sort_order} onChange={(e) => setEditDialog({ ...editDialog, sort_order: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={editDialog.is_active} onCheckedChange={(v) => setEditDialog({ ...editDialog, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
                <Button onClick={() => saveMutation.mutate(editDialog)} disabled={saveMutation.isPending}>
                  {editDialog.id ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
        title="Delete Ad"
        description="Are you sure you want to delete this ad?"
      />
    </div>
  );
};

export default AdminAds;
