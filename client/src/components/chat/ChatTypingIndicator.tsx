// components/chat/ChatTypingIndicator.tsx
"use client";

import { TypingUser } from "@/types";

interface ChatTypingIndicatorProps {
  typingUsers: TypingUser[];
}

export default function ChatTypingIndicator({
  typingUsers,
}: ChatTypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 px-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
      </div>
      <span className="text-sm text-muted-foreground">
        {typingUsers.map((u) => u.username).join(", ")}{" "}
        {typingUsers.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}
