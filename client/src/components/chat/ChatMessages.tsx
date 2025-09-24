// components/chat/ChatMessages.tsx
"use client";

import { useEffect, useRef } from "react";
import { Users } from "lucide-react";
import ChatMessageItem from "./ChatMessageItem";
import ChatTypingIndicator from "./ChatTypingIndicator";
import { MessageWithUser, TypingUser } from "@/types";

interface ChatMessagesProps {
  messages: MessageWithUser[];
  typingUsers: TypingUser[];
  isLoading: boolean;
  searchQuery: string;
  // onAddReaction: (messageId: string, emoji: string) => void;
}

export default function ChatMessages({
  messages,
  typingUsers,
  isLoading,
  searchQuery,
}: // onAddReaction,
ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const filteredMessages = messages.filter(
    (m) =>
      !searchQuery ||
      (m.content || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1 scrollbar-thin touch-pan-y"
      role="log"
      aria-live="polite"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">
                Start a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Send your first message to begin chatting.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {filteredMessages.map((message) => (
            <ChatMessageItem
              key={message.id}
              message={message}
              // onAddReaction={onAddReaction}
            />
          ))}
          {typingUsers.length > 0 && (
            <ChatTypingIndicator typingUsers={typingUsers} />
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
