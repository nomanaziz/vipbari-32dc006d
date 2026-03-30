import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VisitorChatWidgetProps {
  landlordId: string;
  roomId?: string;
}

interface VisitorMessage {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
}

export function VisitorChatWidget({ landlordId, roomId }: VisitorChatWidgetProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"info" | "chat">("info");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<VisitorMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore conversation from localStorage
  useEffect(() => {
    const key = `visitor_chat_${landlordId}_${roomId || "general"}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setConversationId(data.conversationId);
        setName(data.name || "");
        setPhone(data.phone || "");
        setStep("chat");
      } catch {}
    }
  }, [landlordId, roomId]);

  // Fetch messages when conversationId changes
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase.functions.invoke("visitor-chat", {
        body: { action: "fetch", conversation_id: conversationId },
      });
      if (data && Array.isArray(data)) {
        setMessages(data);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Poll for new messages every 5 seconds (visitors can't use realtime auth)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleStart = async () => {
    if (!name.trim() || !phone.trim()) return;

    const { data, error } = await supabase.functions.invoke("visitor-chat", {
      body: {
        action: "start",
        visitor_name: name.trim(),
        visitor_phone: phone.trim(),
        landlord_id: landlordId,
        room_id: roomId || null,
      },
    });

    if (error || !data?.conversation_id) {
      toast.error("Failed to start chat");
      return;
    }

    setConversationId(data.conversation_id);
    setStep("chat");

    const key = `visitor_chat_${landlordId}_${roomId || "general"}`;
    localStorage.setItem(key, JSON.stringify({
      conversationId: data.conversation_id,
      name: name.trim(),
      phone: phone.trim(),
    }));
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { data, error } = await supabase.functions.invoke("visitor-chat", {
      body: { action: "send", conversation_id: conversationId, content },
    });

    if (error || !data?.id) {
      toast.error("Failed to send message");
      setNewMessage(content);
    } else {
      setMessages((prev) => [...prev, { ...data, sender_type: "visitor" }]);
      scrollToBottom();
    }
    setSending(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (text) setNewMessage((prev) => prev + text);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[28rem] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">
                {t("chat.chat_with_landlord") || "Chat with Landlord"}
              </span>
            </div>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {step === "info" ? (
            <div className="flex-1 flex flex-col justify-center p-5 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {t("chat.enter_info") || "Enter your details to start chatting"}
              </p>
              <Input
                placeholder={t("chat.enter_name") || "Your name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
              <Input
                placeholder={t("chat.enter_phone") || "Mobile number"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                maxLength={15}
              />
              <Button onClick={handleStart} disabled={!name.trim() || !phone.trim()} className="w-full">
                {t("chat.start") || "Start Chat"}
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-6">
                    {t("chat.say_hello") || "Say hello to the landlord!"}
                  </p>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.sender_type === "visitor";
                  return (
                    <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn("text-[10px] mt-0.5", isOwn ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="border-t p-2 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder={t("chat.type_message") || "Type a message..."}
                  maxLength={2000}
                  className="flex-1 text-sm"
                />
                <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
