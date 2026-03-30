import { useLanguage } from "@/contexts/LanguageContext";
import { MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Conversation {
  id: string;
  landlord_id: string;
  tenant_user_id: string | null;
  visitor_name: string | null;
  visitor_phone: string | null;
  room_id: string | null;
  created_at: string;
  updated_at: string;
  // joined data
  profiles?: { full_name: string } | null;
  rooms?: { room_number: string } | null;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}

export function ConversationList({ conversations, selectedId, onSelect, currentUserId }: ConversationListProps) {
  const { t } = useLanguage();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground">
        <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">{t("chat.no_conversations") || "No conversations yet"}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => {
          const name = conv.visitor_name || conv.profiles?.full_name || t("chat.unknown");
          const isVisitor = !!conv.visitor_phone;
          const unread = conv.unread_count || 0;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                selectedId === conv.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted"
              )}
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{name}</span>
                  {unread > 0 && (
                    <Badge variant="default" className="text-xs px-1.5 py-0 h-5 shrink-0">
                      {unread}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isVisitor && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      {t("chat.visitor") || "Visitor"}
                    </Badge>
                  )}
                  {conv.rooms?.room_number && (
                    <span className="text-[10px] text-muted-foreground">
                      #{conv.rooms.room_number}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {conv.last_message}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
