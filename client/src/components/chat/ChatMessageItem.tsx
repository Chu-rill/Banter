// components/chat/ChatMessageItem.tsx
"use client";

import { MessageWithUser } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatTimeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { UserIcon } from "lucide-react";

interface ChatMessageItemProps {
  message: MessageWithUser;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const { user } = useAuth();
  const isOwn = message.isOwn || message.user.id === user?.id;
  const isSystem = message.type === "SYSTEM";
  const showAvatar = !isOwn && !isSystem;
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [message.user.avatar]);

  // 🟢 System messages
  if (isSystem) {
    if (!message.content) return null;

    let displayContent = message.content;
    if (isOwn) {
      if (message.content.includes("joined the room")) {
        displayContent = "You joined the room";
      } else if (message.content.includes("left the room")) {
        displayContent = "You left the room";
      }
    }

    return (
      <div className="flex justify-center my-3">
        <div className="font-mono px-4 py-1.5 rounded-full bg-gray-200/80 text-gray-700 text-xs italic shadow-sm">
          {displayContent}
        </div>
      </div>
    );
  }

  // 🟣 Normal messages
  return (
    <div
      className={cn(
        "flex items-end mb-2 px-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for others */}
      {showAvatar && (
        <div className="mr-2 flex-shrink-0">
          {imageError || !message.user.avatar ? (
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
          ) : (
            <img
              src={message.user.avatar}
              alt={message.user.username}
              className="w-8 h-8 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "relative flex flex-col max-w-[80%] rounded-2xl px-3 py-2 shadow-sm",
          isOwn
            ? "bg-green-500 text-white rounded-tr-none"
            : "bg-gray-500 text-black rounded-tl-none"
        )}
      >
        {/* Username (only for others) */}
        {!isOwn && (
          <span className="text-xs text-black mb-0.5 font-medium">
            {message.user.username}
          </span>
        )}

        {/* Message content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-10">
          {message.type === "TEXT" && <p>{message.content}</p>}

          {message.type === "MEDIA" && (
            <div className="space-y-2">
              {message.mediaType === "IMAGE" && (
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="max-w-[220px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.mediaUrl, "_blank")}
                />
              )}
              {message.mediaType === "VIDEO" && (
                <video
                  src={message.mediaUrl}
                  controls
                  className="max-w-[220px] rounded-lg"
                />
              )}
              {message.mediaType === "AUDIO" && (
                <audio
                  src={message.mediaUrl}
                  controls
                  className="max-w-[220px]"
                />
              )}
              {message.content && <p>{message.content}</p>}
            </div>
          )}
        </div>

        {/* Timestamp (bottom right corner) */}
        <span
          className={cn(
            "absolute bottom-1 right-2 text-[10px] font-mono opacity-80",
            isOwn ? "text-white/80" : "text-black"
          )}
        >
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
