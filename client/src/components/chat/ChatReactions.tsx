// components/chat/ChatReactions.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ChatReactionsProps {
  messageId: string;
  isOwn: boolean;
  onAddReaction: (messageId: string, emoji: string) => void;
}

export default function ChatReactions({
  messageId,
  isOwn,
  onAddReaction,
}: ChatReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const emojis = ["👍", "❤️", "😂", "😮", "🎉"];

  const handleReaction = (emoji: string) => {
    onAddReaction(messageId, emoji);
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 mt-1 px-2",
        isOwn ? "justify-end" : "justify-start"
      )}
      role="group"
      aria-label="Message reactions"
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          className="text-xs hover:scale-110 transition-transform"
          type="button"
          aria-label={`React with ${emoji}`}
          onClick={() => handleReaction(emoji)}
        >
          {emoji}
        </button>
      ))}

      {Object.keys(reactions).length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          {Object.entries(reactions).map(([emoji, count]) => (
            <span
              key={emoji}
              className="text-[10px] px-1 py-0.5 bg-muted rounded"
            >
              {emoji} {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
