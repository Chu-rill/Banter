"use client";

import { useEffect, useState } from "react";
import { socketService } from "@/lib/socket";
import { MessageWithUser, SendMessage, TypingUser } from "@/types";

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = socketService.getRoomMessageSocket();
    if (!socket) return;

    setIsLoading(true);

    // Listen to joining room
    socket.on("user-joined-room", (msg) => {
      console.log("Joined room:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("room-joined", (msg) => {
      console.log("room-joined:", msg);
      setMessages((prev) => [...prev, msg]);
      // setMessages((prev) => [...prev, msg]);
    });

    // Load initial messages
    socket.emit("get-messages", { roomId }, (msgs: MessageWithUser[]) => {
      // setMessages(msgs);
      // setIsLoading(false);
    });

    socket.on("messages", ({ roomId, messages }) => {
      // console.log("Loaded messages:", messages);
      setMessages(messages);
      setIsLoading(false);
    });

    // New incoming message
    socket.on("new-message", (msg: MessageWithUser) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Typing indicators
    socket.on("userTyping", (user: TypingUser) => {
      setTypingUsers((prev) => [...prev, user]);
    });

    socket.on("userStoppedTyping", (userId: string) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Cleanup
    return () => {
      socket.emit("leaveRoom", { roomId });
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
  };
}
