import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageThread } from "@/components/chat/MessageThread";
import { NewConversationDialog } from "@/components/chat/NewConversationDialog";
import { MessageSquare, ArrowLeft, Plus, Send, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "lucide-react";

const Messages = () => {
  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "sale" ? "sale" : "chat";
  const [activeTab, setActiveTab] = useState<"chat" | "sale">(initialTab);

  // Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newConvOpen, setNewConvOpen] = useState(false);

  // Sale state
  const [activeSaleConv, setActiveSaleConv] = useState<string | null>(searchParams.get("conv"));
  const [saleMessage, setSaleMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const senderType = role === "tenant" ? "tenant" : "landlord";
  const isLandlord = role !== "tenant";

  // ─── CHAT LOGIC ────────────────────────────
  useEffect(() => {
    if (!user) return;
    initMessaging();
    const channel = supabase
      .channel("messages-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const initMessaging = async () => {
    if (!user) return;
    if (role === "tenant") await ensureTenantConversation();
    await fetchConversations();
  };

  const ensureTenantConversation = async () => {
    if (!user) return;
    let landlordId: string | null = null;
    const { data: tenant } = await supabase
      .from("tenants").select("owner_id, user_id")
      .eq("user_id", user.id).eq("status", "active")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (tenant && tenant.owner_id && tenant.owner_id !== tenant.user_id) landlordId = tenant.owner_id;
    if (!landlordId) {
      const { data: request } = await supabase
        .from("tolet_requests").select("landlord_user_id")
        .eq("tenant_user_id", user.id).eq("status", "accepted")
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (request) landlordId = request.landlord_user_id;
    }
    if (!landlordId) return;
    const { data: existing } = await supabase
      .from("conversations").select("id")
      .eq("landlord_id", landlordId).eq("tenant_user_id", user.id).maybeSingle();
    if (existing) return;
    await supabase.from("conversations").insert({ landlord_id: landlordId, tenant_user_id: user.id });
  };

  const fetchConversations = async () => {
    if (!user) return;
    const column = isLandlord ? "landlord_id" : "tenant_user_id";
    const { data: convs } = await supabase
      .from("conversations").select("*, rooms(room_number)")
      .eq(column, user.id).order("updated_at", { ascending: false });
    if (!convs) { setLoading(false); return; }
    const profileIds = new Set<string>();
    convs.forEach((c: any) => {
      if (isLandlord && c.tenant_user_id) profileIds.add(c.tenant_user_id);
      if (!isLandlord && c.landlord_id) profileIds.add(c.landlord_id);
    });
    let profilesMap: Record<string, { full_name: string }> = {};
    if (profileIds.size > 0) {
      const { data: profiles } = await supabase
        .from("profiles").select("user_id, full_name").in("user_id", Array.from(profileIds));
      if (profiles) profiles.forEach((p: any) => { profilesMap[p.user_id] = { full_name: p.full_name }; });
    }
    const enriched = await Promise.all(
      convs.map(async (conv: any) => {
        const { data: lastMsg } = await supabase
          .from("messages").select("content, created_at")
          .eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        const { count } = await supabase
          .from("messages").select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id).eq("is_read", false).neq("sender_id", user!.id);
        const profileKey = isLandlord ? conv.tenant_user_id : conv.landlord_id;
        return { ...conv, profiles: profilesMap[profileKey] || null, last_message: lastMsg?.content || null, last_message_at: lastMsg?.created_at || conv.created_at, unread_count: count || 0 };
      })
    );
    setConversations(enriched);
    setLoading(false);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedId(conversationId);
    fetchConversations();
  };

  // ─── SALE LOGIC ────────────────────────────
  const { data: saleConversations } = useQuery({
    queryKey: ["sale-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sale_conversations")
        .select("*, sale_listings(title, owner_id)")
        .or(`seller_id.eq.${user!.id},buyer_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false });
      return data || [];
    },
  });

  const { data: saleMessages, refetch: refetchSaleMessages } = useQuery({
    queryKey: ["sale-messages", activeSaleConv],
    enabled: !!activeSaleConv,
    queryFn: async () => {
      const { data } = await supabase.from("sale_messages")
        .select("*").eq("conversation_id", activeSaleConv!)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  useEffect(() => {
    if (!activeSaleConv) return;
    const channel = supabase
      .channel(`sale-msgs-${activeSaleConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sale_messages", filter: `conversation_id=eq.${activeSaleConv}` }, () => {
        refetchSaleMessages();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSaleConv, refetchSaleMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [saleMessages]);

  useEffect(() => {
    if (!activeSaleConv || !user || !saleMessages?.length) return;
    const unread = saleMessages.filter((m: any) => !m.is_read && m.sender_id !== user.id);
    if (unread.length) {
      supabase.from("sale_messages").update({ is_read: true }).in("id", unread.map((m: any) => m.id)).then(() => {});
    }
  }, [saleMessages, activeSaleConv, user]);

  const sendSaleMessage = async () => {
    if (!saleMessage.trim() || !activeSaleConv || !user) return;
    await supabase.from("sale_messages").insert({ conversation_id: activeSaleConv, sender_id: user.id, content: saleMessage.trim() });
    setSaleMessage("");
    refetchSaleMessages();
    queryClient.invalidateQueries({ queryKey: ["sale-conversations"] });
  };

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "sale") setActiveTab("sale");
    const conv = searchParams.get("conv");
    if (conv) { setActiveSaleConv(conv); setActiveTab("sale"); }
  }, [searchParams]);

  if (!user) return null;

  const showChatList = !isMobile || !selectedId;
  const showChatThread = !isMobile || !!selectedId;
  const showSaleList = !isMobile || !activeSaleConv;
  const showSaleThread = !isMobile || !!activeSaleConv;

  const activeSaleConvData = saleConversations?.find((c: any) => c.id === activeSaleConv);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{t("nav.messages") || "Messages"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "chat" | "sale"); setSelectedId(null); setActiveSaleConv(null); }}>
            <TabsList className="h-8">
              <TabsTrigger value="chat" className="text-xs px-3 gap-1">
                <MessageSquare className="h-3 w-3" />
                {language === "bn" ? "চ্যাট" : "Chat"}
              </TabsTrigger>
              <TabsTrigger value="sale" className="text-xs px-3 gap-1">
                <ShoppingBag className="h-3 w-3" />
                {language === "bn" ? "বিক্রয়" : "Sale"}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === "chat" && isLandlord && (
            <Button size="sm" onClick={() => setNewConvOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t("chat.new_message") || "New"}
            </Button>
          )}
        </div>
      </div>

      {activeTab === "chat" ? (
        <div className="flex h-[calc(100%-3.5rem)]">
          {showChatList && (
            <div className={`${isMobile ? "w-full" : "w-80"} border-r`}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} currentUserId={user.id} />
              )}
            </div>
          )}
          {showChatThread && (
            <div className="flex-1 flex flex-col">
              {isMobile && selectedId && (
                <div className="p-2 border-b">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t("common.back") || "Back"}
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <MessageThread conversationId={selectedId} currentUserId={user.id} currentSenderType={senderType as "landlord" | "tenant"} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-[calc(100%-3.5rem)]">
          {showSaleList && (
            <div className={`${isMobile ? "w-full" : "w-80"} border-r`}>
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  {!saleConversations?.length ? (
                    <div className="flex flex-col items-center justify-center h-40 p-6 text-muted-foreground">
                      <ShoppingBag className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm">{language === "bn" ? "কোনো কথোপকথন নেই" : "No sale conversations"}</p>
                    </div>
                  ) : (
                    saleConversations.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveSaleConv(c.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                          c.id === activeSaleConv ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                        )}
                      >
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.sale_listings?.title || "Listing"}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.seller_id === user?.id ? (language === "bn" ? "ক্রেতার সাথে" : "With buyer") : (language === "bn" ? "বিক্রেতার সাথে" : "With seller")}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
          {showSaleThread && (
            <div className="flex-1 flex flex-col">
              {!activeSaleConv ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  {language === "bn" ? "একটি কথোপকথন নির্বাচন করুন" : "Select a conversation"}
                </div>
              ) : (
                <>
                  <div className="p-3 border-b flex items-center gap-2">
                    {isMobile && (
                      <Button variant="ghost" size="icon" onClick={() => setActiveSaleConv(null)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <div>
                      <p className="text-sm font-medium">{activeSaleConvData?.sale_listings?.title || "Conversation"}</p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {saleMessages?.map((m: any) => (
                      <div key={m.id} className={cn("flex", m.sender_id === user?.id ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                          m.sender_id === user?.id ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                        )}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t flex gap-2">
                    <Input
                      value={saleMessage}
                      onChange={(e) => setSaleMessage(e.target.value)}
                      placeholder={language === "bn" ? "মেসেজ লিখুন..." : "Type a message..."}
                      onKeyDown={(e) => e.key === "Enter" && sendSaleMessage()}
                    />
                    <Button size="icon" onClick={sendSaleMessage} disabled={!saleMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {isLandlord && (
        <NewConversationDialog open={newConvOpen} onOpenChange={setNewConvOpen} landlordId={user.id} onConversationCreated={handleConversationCreated} />
      )}
    </div>
  );
};

export default Messages;
