"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import { MessageWithUser, Room, SendMessage, TypingUser } from "@/types";

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = socketService.getRoomMessageSocket();
    if (!socket) return;

    setIsLoading(true);

    // Join the Socket.IO room first
    socket.emit("join-room", { roomId });

    // Listen to joining room
    socket.on("user-joined-room", (msg) => {
      // console.log("Joined room:", msg);
      if (msg.message) {
        setMessages((prev) => [...prev, msg.message]);
      }
    });

    socket.on("room-join-approved", ({ roomId }) => {
      joinRoomWs(roomId);
    });

    socket.on("user-left-room", (msg) => {
      console.log("Left room:", msg);
      if (msg.message) {
        setMessages((prev) => [...prev, msg.message]);
      }
    });

    // Load initial messages
    socket.emit("get-messages", { roomId });

    socket.on("messages", ({ roomId, messages }) => {
      setMessages(messages);
      setIsLoading(false);
    });

    // New incoming message
    socket.on("new-message", (msg: MessageWithUser) => {
      setMessages((prev) => [...prev, msg]);

      // Play notification sound for new messages
      try {
        const sound = new Audio("/sounds/notification.mp3");
        sound.play().catch((error) => {
          console.log("Could not play notification sound:", error);
        });
      } catch (error) {
        console.log("Error creating notification sound:", error);
      }
    });

    // Typing indicators
    socket.on("userTyping", (user: TypingUser) => {
      setTypingUsers((prev) => [...prev, user]);
    });

    socket.on("userStoppedTyping", (userId: string) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Cleanup - just remove listeners, don't leave the room
    // Users should remain members even when navigating away
    return () => {
      socket.off("user-joined-room");
      socket.off("room-joined");
      socket.off("messages");
      socket.off("new-message");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [roomId]);

  const sendMessage = (data: Partial<SendMessage>) => {
    const socket = socketService.getRoomMessageSocket();
    if (!socket) return;
    socket.emit("send-message", { roomId, ...data });
  };

  const joinRoomWs = (roomId: string) => {
    const socket = socketService.getRoomMessageSocket();
    if (!socket) return;
    socket.emit("join-room", { roomId });
  };

  const leaveRoomWs = (roomId: string) => {
    console.log("Leaving room via WS:", roomId);
    const socket = socketService.getRoomMessageSocket();
    if (!socket) return;
    socket.emit("leave-room", { roomId });
  };

  const startTyping = () => {
    socketService.getRoomMessageSocket()?.emit("startTyping", { roomId });
  };

  const stopTyping = () => {
    socketService.getRoomMessageSocket()?.emit("stopTyping", { roomId });
  };

  return {
    messages,
    typingUsers,
    isLoading,
    sendMessage,
    joinRoomWs,
    startTyping,
    stopTyping,
    leaveRoomWs,
  };
}
