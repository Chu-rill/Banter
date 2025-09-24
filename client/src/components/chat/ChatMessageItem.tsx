// components/chat/ChatMessageItem.tsx
"use client";

import { useState } from "react";
import { MessageWithUser } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import ChatReactions from "./ChatReactions";
import { cn, formatTimeAgo } from "@/lib/utils";

interface ChatMessageItemProps {
  message: MessageWithUser;
  // onAddReaction: (messageId: string, emoji: string) => void;
}

export default function ChatMessageItem({
  message,
}: // onAddReaction,
ChatMessageItemProps) {
  const { user } = useAuth();
  const isOwn = message.isOwn || message.userId === user?.id;
  const showAvatar = !isOwn;

  return (
    <div
      className={cn(
        "flex items-end space-x-2 mb-4",
        isOwn ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}
    >
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
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
      )}

      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-2">
            {message.user.username}
          </span>
        )}

        <div
          className={cn(
            "px-4 py-2 rounded-2xl break-words",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
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

        {/* <ChatReactions
          messageId={message.id}
          isOwn={isOwn}
          onAddReaction={onAddReaction}
        /> */}

        <span
          className={cn(
            "text-xs text-muted-foreground mt-1 px-2",
            isOwn ? "text-right" : "text-left"
          )}
        >
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
