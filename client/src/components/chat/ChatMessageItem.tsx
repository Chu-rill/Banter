// components/chat/ChatMessageItem.tsx
"use client";

import { MessageWithUser } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatTimeAgo } from "@/lib/utils";

interface ChatMessageItemProps {
  message: MessageWithUser;
}

export default function ChatMessageItem({ message }: ChatMessageItemProps) {
  const { user } = useAuth();
  const isOwn = message.isOwn || message.userId === user?.id;
  const showAvatar = !isOwn;

  return (
    <div
      className={cn(
        "flex items-end mb-3",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for others */}
      {showAvatar && (
        <div className="mr-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {message.user.avatar ? (
              <img
                src={message.user.avatar}
                alt={message.user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              message.user.username.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.user.username}
          </span>
        )}

        <div
          className={cn(
            "px-3 py-2 rounded-lg shadow-sm break-words",
            isOwn
              ? "bg-green-500 text-white rounded-tr-none"
              : "bg-gray-200 text-black rounded-tl-none"
          )}
        >
          {message.type === "TEXT" ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : message.type === "MEDIA" ? (
            <div className="space-y-2">
              {message.mediaType === "IMAGE" && (
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="max-w-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.mediaUrl, "_blank")}
                />
              )}
              {message.mediaType === "VIDEO" && (
                <video
                  src={message.mediaUrl}
                  controls
                  className="max-w-64 rounded-lg"
                />
              )}
              {message.mediaType === "AUDIO" && (
                <audio src={message.mediaUrl} controls className="max-w-64" />
              )}
              {message.content && <p className="text-sm">{message.content}</p>}
            </div>
          ) : (
            <p className="text-sm italic">{message.content}</p>
          )}
        </div>

        {/* Time */}
        <span
          className={cn(
            "text-xs text-muted-foreground mt-1 px-1",
            isOwn ? "text-right" : "text-left"
          )}
        >
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
