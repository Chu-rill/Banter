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
    socket.on("dm:messages", (data: { friendId: string; messages: any[] }) => {
      if (data.friendId === friendId) {
        const transformedMessages = data.messages.map((msg: any) => ({
          ...msg,
          senderId: msg.sender || { id: msg.senderId },
          receiverId: msg.receiver || { id: msg.receiverId },
          user: msg.sender || { id: msg.senderId },
        }));
        setMessages(transformedMessages);
        setIsLoading(false);
      }
    });

    // Listen for new messages
    socket.on("dm:new", (msg: any) => {
      console.log("Direct message received:", msg);
      // Check if message is from/to the current friend
      const isSender = msg.senderId === friendId || msg.sender?.id === friendId;
      const isReceiver = msg.receiverId === friendId || msg.receiver?.id === friendId;

      if (isSender || isReceiver) {
        // Transform the message to match MessageWithUser format
        const transformedMsg: MessageWithUser = {
          ...msg,
          senderId: msg.sender || { id: msg.senderId },
          receiverId: msg.receiver || { id: msg.receiverId },
          user: msg.sender || { id: msg.senderId },
        };
        setMessages((prev) => [...prev, transformedMsg]);
      }
    });

    // Listen for sent messages (confirmation) - but dm:new already handles this
    socket.on("dm:sent", (msg: any) => {
      console.log("Direct message sent confirmation:", msg);
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
    console.log("Direct message sent:", data);
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
