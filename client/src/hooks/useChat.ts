// components/chat/hooks/useChat.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { messageApi } from "@/lib/api";
import socketService from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { Message, MessageWithUser, TypingUser } from "@/types";

export function useChat(roomId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create stable callback references using useCallback
  const handleMessageReceived = useCallback(
    (message: MessageWithUser) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, { ...message, isOwn: false }]);

        // Handle notifications
        if (
          typeof document !== "undefined" &&
          document.hidden &&
          message.userId !== user?.id &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification(`${message.user.username}`, {
              body:
                message.type === "TEXT"
                  ? message.content
                  : `sent a ${message.mediaType?.toLowerCase() || "message"}`,
            });
          } catch {}
        }
      }
    },
    [roomId, user?.id]
  );

  const handleMessageSent = useCallback(
    (message: MessageWithUser) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, { ...message, isOwn: true }]);
      }
    },
    [roomId]
  );

  const handleUserTyping = useCallback(
    (data: TypingUser) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === data.userId);
          if (existing) return prev;
          return [...prev, data];
        });
      }
    },
    [roomId, user?.id]
  );

  const handleUserStoppedTyping = useCallback(
    (data: { userId: string; roomId: string }) => {
      if (data.roomId === roomId) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    },
    [roomId]
  );

  useEffect(() => {
    if (roomId) {
      loadMessages();
      joinRoom();
    }

    return () => {
      if (roomId) {
        leaveRoom();
      }
    };
  }, [roomId]);

  useEffect(() => {
    // Connect to messaging socket if not already connected
    if (!socketService.isMessageSocketConnected()) {
      socketService.connectToMessages();
    }

    // Add event listeners
    socketService.on("message-received", handleMessageReceived);
    socketService.on("message-sent", handleMessageSent);
    socketService.on("user-typing", handleUserTyping);
    socketService.on("user-stopped-typing", handleUserStoppedTyping);

    // Cleanup - remove event listeners with the same callback references
    return () => {
      socketService.off("message-received", handleMessageReceived);
      socketService.off("message-sent", handleMessageSent);
      socketService.off("user-typing", handleUserTyping);
      socketService.off("user-stopped-typing", handleUserStoppedTyping);
    };
  }, [
    roomId,
    handleMessageReceived,
    handleMessageSent,
    handleUserTyping,
    handleUserStoppedTyping,
  ]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const roomMessages = await messageApi.getRoomMessages(roomId, 50);
      const data = roomMessages.data as Message[];
      setMessages(
        data.map((msg) => ({
          ...msg,
          isOwn: msg.userId === user?.id,
        }))
      );
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = () => {
    socketService.joinRoom(roomId);
  };

  const leaveRoom = () => {
    socketService.leaveRoom(roomId);
  };

  const sendMessage = async (message: any) => {
    socketService.sendMessage({
      roomId,
      ...message,
    });
  };

  const startTyping = () => {
    socketService.startTyping(roomId);
  };

  const stopTyping = () => {
    socketService.stopTyping(roomId);
  };

  const addReaction = (messageId: string, emoji: string) => {
    // You'll need to implement this in your socket service
    // For now, just update local state
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          // Add reaction logic here
          return msg;
        }
        return msg;
      })
    );
  };

  return {
    messages,
    typingUsers,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
  };
}
