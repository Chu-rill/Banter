// components/chat/ChatInput.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, Smile, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "./CharacterCounter";
import EmojiPicker from "emoji-picker-react";
import { debounce } from "@/lib/utils";
import { SendMessage } from "@/types";

interface ChatInputProps {
  roomId?: string;
  friendId?: string;
  onSendMessage: (message: Partial<SendMessage>) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  onOpenFileUpload: () => void;
}

export default function ChatInput({
  roomId,
  friendId,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onOpenFileUpload,
}: ChatInputProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (isTypingRef.current) {
        onStopTyping();
        isTypingRef.current = false;
      }
    }, 1000),
    [onStopTyping]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    if (e.target.value.trim() && !isTypingRef.current) {
      onStartTyping();
      isTypingRef.current = true;
    }

    if (value.length >= 2000) {
      if (value.length === 2000 && !value.endsWith("\n")) {
        value = value.slice(0, 1999) + "\n";
      }
    }

    setNewMessage(value);

    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
      messageInputRef.current.style.height = `${messageInputRef.current.scrollHeight}px`;
    }

    debouncedStopTyping();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);

      if (isTypingRef.current) {
        onStopTyping();
        isTypingRef.current = false;
      }

      onSendMessage({
        content: newMessage.trim(),
        type: "TEXT",
      });

      setNewMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  return (
    <div className="p-2 md:p-4 border-t border-border bg-card/50 backdrop-blur-sm safe-area-inset-bottom">
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-50">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={
              (document.documentElement.classList.contains("dark")
                ? "dark"
                : "light") as import("emoji-picker-react").Theme
            }
          />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-start gap-3 mb-5"
        aria-label="Send message"
      >
        <div className="flex-1 relative">
          <textarea
            ref={messageInputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full pr-16 md:pr-20 resize-none min-h-[40px] max-h-32 text-base whitespace-pre-wrap overflow-wrap-anywhere border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-5"
            maxLength={2000}
            disabled={isSending}
            rows={1}
            style={{
              fontSize: "16px",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          />

          <div className="absolute right-2 top-2 flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={onOpenFileUpload}
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Insert emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center content-between">
          {/* <CharacterCounter current={newMessage.length} /> */}
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0 mt-[2px]"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
