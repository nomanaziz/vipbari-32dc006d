import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Search, Loader2 } from "lucide-react";

interface TenantOption {
  user_id: string;
  full_name: string;
  phone: string;
  room_number?: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlordId: string;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  landlordId,
  onConversationCreated,
}: NewConversationDialogProps) {
  const { t } = useLanguage();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTenants();
    }
  }, [open]);

  const fetchTenants = async () => {
    setLoading(true);

    // Get tenants owned by landlord
    const { data: ownedTenants } = await supabase
      .from("tenants")
      .select("user_id, full_name, phone, rooms(room_number)")
      .eq("owner_id", landlordId)
      .eq("status", "active")
      .not("user_id", "is", null);

    // Get tenants from accepted tolet_requests
    const { data: requests } = await supabase
      .from("tolet_requests")
      .select("tenant_user_id, rooms(room_number)")
      .eq("landlord_user_id", landlordId)
      .eq("status", "accepted");

    const tenantMap = new Map<string, TenantOption>();

    // Add owned tenants
    if (ownedTenants) {
      for (const t of ownedTenants) {
        if (t.user_id && t.user_id !== landlordId) {
          const room = (t as any).rooms;
          tenantMap.set(t.user_id, {
            user_id: t.user_id,
            full_name: t.full_name,
            phone: t.phone,
            room_number: room?.room_number,
          });
        }
      }
    }

    // Add request tenants (fetch their profiles)
    if (requests && requests.length > 0) {
      const requestTenantIds = requests
        .map((r: any) => r.tenant_user_id)
        .filter((id: string) => !tenantMap.has(id) && id !== landlordId);

      if (requestTenantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", requestTenantIds);

        if (profiles) {
          for (const p of profiles) {
            const req = requests.find((r: any) => r.tenant_user_id === p.user_id);
            const room = (req as any)?.rooms;
            tenantMap.set(p.user_id, {
              user_id: p.user_id,
              full_name: p.full_name,
              phone: p.phone,
              room_number: room?.room_number,
            });
          }
        }
      }
    }

    setTenants(Array.from(tenantMap.values()));
    setLoading(false);
  };

  const handleSelect = async (tenant: TenantOption) => {
    setCreating(true);

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("landlord_id", landlordId)
      .eq("tenant_user_id", tenant.user_id)
      .maybeSingle();

    if (existing) {
      onConversationCreated(existing.id);
      onOpenChange(false);
      setCreating(false);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        landlord_id: landlordId,
        tenant_user_id: tenant.user_id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      setCreating(false);
      return;
    }

    onConversationCreated(newConv.id);
    onOpenChange(false);
    setCreating(false);
  };

  const filtered = tenants.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("chat.new_message") || "New Message"}</DialogTitle>
          <DialogDescription>
            {t("chat.select_tenant") || "Select a tenant to start a conversation"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search") || "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">{t("chat.no_tenants") || "No tenants found"}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((tenant) => (
                <button
                  key={tenant.user_id}
                  onClick={() => handleSelect(tenant)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block truncate">
                      {tenant.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tenant.phone}
                      {tenant.room_number && ` • #${tenant.room_number}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
