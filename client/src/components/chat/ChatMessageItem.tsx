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

  // For direct messages, check senderId. For room messages, check user.id
  const senderId =
    typeof message.senderId === "object" && message.senderId !== null
      ? message.senderId.id
      : message.senderId;
  const isOwn =
    message.isOwn || senderId === user?.id || message.user?.id === user?.id;

  // Get the display user (for avatar/username) - use senderId for DMs, user for room messages
  const displayUser =
    message.senderId && typeof message.senderId === "object"
      ? message.senderId
      : message.user;

  const isSystem = message.type === "SYSTEM";
  const showAvatar = !isOwn && !isSystem;
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [displayUser?.avatar]);

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
        <div className="font-mono px-4 py-1.5 rounded-full bg-muted/80 text-muted-foreground text-xs italic shadow-sm">
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
      {showAvatar && displayUser && (
        <div className="mr-2 flex-shrink-0">
          {imageError || !displayUser.avatar ? (
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={displayUser.avatar}
              alt={displayUser.username}
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
          // Only apply bubble background for TEXT messages
          message.type === "TEXT"
            ? isOwn
              ? "bg-green-500 dark:bg-green-600 text-white rounded-tr-none"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none"
            : "bg-transparent shadow-none p-0"
        )}
      >
        {/* Username (only for others) */}
        {!isOwn && displayUser && (
          <span className="text-xs text-gray-600 dark:text-gray-400 mb-0.5 font-medium">
            {displayUser.username}
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
            "absolute bottom-1 right-2 text-[10px] font-mono opacity-70",
            isOwn ? "text-white" : "text-gray-600 dark:text-gray-400"
          )}
        >
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
