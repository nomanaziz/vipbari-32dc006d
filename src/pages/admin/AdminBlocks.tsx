import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldBan, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminBlocks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [blockerPhone, setBlockerPhone] = useState("");
  const [blockedPhone, setBlockedPhone] = useState("");
  const [reason, setReason] = useState("");

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_blocks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Collect unique user IDs
      const userIds = new Set<string>();
      for (const b of data || []) {
        userIds.add(b.blocker_id);
        userIds.add(b.blocked_id);
      }

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", Array.from(userIds));

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));

      return (data || []).map(b => ({
        ...b,
        blocker_name: profileMap[b.blocker_id]?.full_name || "Unknown",
        blocker_phone: profileMap[b.blocker_id]?.phone || "",
        blocked_name: profileMap[b.blocked_id]?.full_name || "Unknown",
        blocked_phone: profileMap[b.blocked_id]?.phone || "",
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });
      toast.success("Block removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      // Find user IDs by phone
      const { data: blockerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", blockerPhone.trim())
        .maybeSingle();
      if (!blockerProfile) throw new Error("Blocker phone not found");

      const { data: blockedProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", blockedPhone.trim())
        .maybeSingle();
      if (!blockedProfile) throw new Error("Blocked phone not found");

      if (blockerProfile.user_id === blockedProfile.user_id) throw new Error("Cannot block self");

      const { error } = await supabase.from("user_blocks").insert({
        blocker_id: blockerProfile.user_id,
        blocked_id: blockedProfile.user_id,
        reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });
      toast.success("Block added");
      setAddOpen(false);
      setBlockerPhone("");
      setBlockedPhone("");
      setReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (blocks || []).filter(b =>
    !search ||
    b.blocker_name.toLowerCase().includes(search.toLowerCase()) ||
    b.blocked_name.toLowerCase().includes(search.toLowerCase()) ||
    b.blocker_phone.includes(search) ||
    b.blocked_phone.includes(search)
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldBan className="h-6 w-6" />
          Blocks / Blacklist
        </h1>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Block
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary">{filtered.length} blocks</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No blocks found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blocker</TableHead>
                    <TableHead>Blocked</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{b.blocker_name}</p>
                          <p className="text-xs text-muted-foreground">{b.blocker_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{b.blocked_name}</p>
                          <p className="text-xs text-muted-foreground">{b.blocked_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{b.reason || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteMutation.mutate(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add Block Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Blocker Phone</Label>
              <Input placeholder="01XXXXXXXXX" value={blockerPhone} onChange={e => setBlockerPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Blocked Phone</Label>
              <Input placeholder="01XXXXXXXXX" value={blockedPhone} onChange={e => setBlockedPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} />
            </div>
            <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !blockerPhone || !blockedPhone}>
              {addMutation.isPending ? "Adding..." : "Add Block"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
