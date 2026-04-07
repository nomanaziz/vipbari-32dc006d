import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface RoomShiftDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tenant: any;
  availableRooms: any[];
}

const RoomShiftDialog = ({ open, onOpenChange, tenant, availableRooms }: RoomShiftDialogProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newRoomId, setNewRoomId] = useState("");

  const shiftMutation = useMutation({
    mutationFn: async () => {
      if (!newRoomId || !tenant) return;

      // Vacate old room if exists
      if (tenant.room_id) {
        await supabase
          .from("rooms")
          .update({ status: "vacant", tenant_id: null })
          .eq("id", tenant.room_id);
      }

      // Assign new room
      const { error: roomError } = await supabase
        .from("rooms")
        .update({ status: "occupied", tenant_id: tenant.id })
        .eq("id", newRoomId);
      if (roomError) throw roomError;

      // Update tenant record
      const { error: tenantError } = await supabase
        .from("tenants")
        .update({ room_id: newRoomId })
        .eq("id", tenant.id);
      if (tenantError) throw tenantError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(language === "bn" ? "রুম শিফট সফল হয়েছে" : "Room shifted successfully");
      onOpenChange(false);
      setNewRoomId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Filter out the current room from available rooms
  const filteredRooms = availableRooms.filter((r: any) => r.id !== tenant?.room_id);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setNewRoomId(""); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {language === "bn" ? "রুম শিফট করুন" : "Shift Room"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {language === "bn" ? "ভাড়াটিয়া" : "Tenant"}: <span className="font-medium text-foreground">{tenant?.full_name}</span>
            </p>
            {tenant?.rooms?.room_number && (
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "বর্তমান রুম" : "Current room"}: <span className="font-medium text-foreground">{tenant.rooms.room_number}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{language === "bn" ? "নতুন রুম নির্বাচন করুন" : "Select new room"}</Label>
            {filteredRooms.length === 0 ? (
              <p className="text-sm text-destructive">
                {language === "bn" ? "কোনো খালি রুম নেই" : "No vacant rooms available"}
              </p>
            ) : (
              <Select value={newRoomId} onValueChange={setNewRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "bn" ? "রুম নির্বাচন করুন" : "Select room"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredRooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.room_number} — {r.properties?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            onClick={() => shiftMutation.mutate()}
            disabled={!newRoomId || shiftMutation.isPending}
            className="w-full"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {shiftMutation.isPending
              ? (language === "bn" ? "শিফট হচ্ছে..." : "Shifting...")
              : (language === "bn" ? "রুম শিফট করুন" : "Shift Room")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomShiftDialog;
