import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface MessageThreadProps {
  conversationId: string | null;
  currentUserId: string;
  currentSenderType: "landlord" | "tenant";
}

export function MessageThread({ conversationId, currentUserId, currentSenderType }: MessageThreadProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data as Message[]);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Mark unread messages as read
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false)
      .then();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();

          // Mark as read if from the other party
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, scrollToBottom]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const content = newMessage.trim().substring(0, 2000);
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_type: currentSenderType,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      toast.error(error.message);
      setNewMessage(content);
    }
    setSending(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Only allow plain text paste
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (text) {
      setNewMessage((prev) => prev + text);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">{t("chat.select_conversation") || "Select a conversation to start chatting"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("chat.no_messages") || "No messages yet. Say hello!"}
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                {!isOwn && msg.sender_type === "visitor" && (
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                    {t("chat.visitor") || "Visitor"}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="border-t p-3 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={t("chat.type_message") || "Type a message..."}
          maxLength={2000}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
