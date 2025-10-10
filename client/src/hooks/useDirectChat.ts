"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import { MessageWithUser } from "@/types";

export function useDirectChat(friendId: string) {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = socketService.getDirectMessageSocket();
    if (!socket) return;

    setIsLoading(true);

    // Request message history
    socket.emit("dm:get_messages", { friendId });

    // Listen for message history
    socket.on("dm:messages", (data: { friendId: string; messages: MessageWithUser[] }) => {
      if (data.friendId === friendId) {
        setMessages(data.messages);
        setIsLoading(false);
      }
    });

    // Listen for new messages
    socket.on("dm:new", (msg: MessageWithUser) => {
      // console.log("Direct message received:", msg);
      // Check if message is from/to the current friend
      const senderIsUser = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId.id;
      const receiverIsUser = typeof msg.receiverId === 'string' ? msg.receiverId : msg.receiverId.id;
      const isSender = senderIsUser === friendId;
      const isReceiver = receiverIsUser === friendId;

      if (isSender || isReceiver) {
        setMessages((prev) => [...prev, msg]);

        // Play notification sound for new messages (only if from the friend, not own messages)
        if (isSender) {
          try {
            const sound = new Audio("/sounds/notification.mp3");
            sound.play().catch((error) => {
              console.log("Could not play notification sound:", error);
            });
          } catch (error) {
            console.log("Error creating notification sound:", error);
          }
        }
      }
    });

    // Listen for sent messages (confirmation) - but dm:new already handles this
    socket.on("dm:sent", (msg: MessageWithUser) => {
      // console.log("Direct message sent confirmation:", msg);
    });

    // Listen for typing indicators
    socket.on("dm:typing", (data: { senderId: string; typing: boolean }) => {
      if (data.senderId === friendId) {
        setIsTyping(data.typing);
      }
    });

    // Cleanup
    return () => {
      socket.off("dm:messages");
      socket.off("dm:new");
      socket.off("dm:sent");
      socket.off("dm:typing");
    };
  }, [friendId]);

  const sendMessage = (data: {
    content?: string;
    mediaUrl?: string;
    type: "TEXT" | "MEDIA";
    mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  }) => {
    const socket = socketService.getDirectMessageSocket();
    if (!socket) return;

    socket.emit("dm:send", {
      receiverId: friendId,
      ...data,
    });
    // console.log("Direct message sent:", data);
  };

  const startTyping = () => {
    socketService
      .getDirectMessageSocket()
      ?.emit("dm:typing", { receiverId: friendId, typing: true });
  };

  const stopTyping = () => {
    socketService
      .getDirectMessageSocket()
      ?.emit("dm:typing", { receiverId: friendId, typing: false });
  };

  return {
    messages,
    isTyping,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
