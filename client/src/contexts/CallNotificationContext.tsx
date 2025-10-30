"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { socketService } from "@/lib/socket";

interface IncomingCall {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  roomId: string;
  isVideoCall: boolean;
}

interface CallNotificationContextType {
  incomingCall: IncomingCall | null;
  initiateCall: (roomId: string, isVideoCall: boolean) => void;
  acceptCall: () => void;
  declineCall: () => void;
}

const CallNotificationContext = createContext<CallNotificationContextType | undefined>(undefined);

export function CallNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [socketReady, setSocketReady] = useState(false);

  // Monitor socket connection state
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log("⚠️ Not authenticated or no user");
      return;
    }

    const socket = socketService.getCallSocket();
    if (!socket) {
      console.log("⚠️ Call socket not available yet, will retry when available");
      // Retry after a short delay
      const timer = setTimeout(() => setSocketReady((prev) => !prev), 500);
      return () => clearTimeout(timer);
    }

    const handleConnect = () => {
      console.log("✅ Call socket connected!");
      setSocketReady(true);
    };

    const handleDisconnect = () => {
      console.log("❌ Call socket disconnected");
      setSocketReady(false);
    };

    // Set initial state
    if (socket.connected) {
      console.log("✅ Call socket already connected");
      setSocketReady(true);
    } else {
      console.log("⚠️ Call socket not connected yet, waiting...");
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [isAuthenticated, user, socketReady]);

  // Listen for incoming calls - only when socket is ready
  useEffect(() => {
    if (!isAuthenticated || !user || !socketReady) {
      return;
    }

    const socket = socketService.getCallSocket();
    if (!socket || !socket.connected) {
      console.log("⚠️ Socket not ready for incoming call listener");
      return;
    }

    console.log("✅ Setting up incoming call listener");

    const handleIncomingCall = (data: IncomingCall) => {
      console.log("📞 Incoming call received:", {
        from: data.callerName,
        roomId: data.roomId,
        isVideoCall: data.isVideoCall,
      });
      setIncomingCall(data);
    };

    socket.on("incoming-call", handleIncomingCall);

    return () => {
      console.log("🧹 Cleaning up incoming call listener");
      socket.off("incoming-call", handleIncomingCall);
    };
  }, [isAuthenticated, user, socketReady]);

  const initiateCall = useCallback((roomId: string, isVideoCall: boolean) => {
    const socket = socketService.getCallSocket();
    if (!socket) {
      console.error("❌ Call socket not available");
      alert("Call connection not ready. Please try again.");
      return;
    }

    if (!socket.connected) {
      console.error("❌ Call socket not connected");
      alert("Call connection not ready. Please try again.");
      return;
    }

    console.log("📞 Initiating call:", {
      roomId,
      isVideoCall,
      socketId: socket.id,
      socketConnected: socket.connected
    });

    // Emit initiate-call event
    socket.emit("initiate-call", { roomId, isVideoCall });

    // Listen for confirmation
    socket.once("call-initiated", (data: { roomId: string; recipientCount: number }) => {
      console.log("✅ Call initiated successfully:", data);
      console.log(`📢 Notified ${data.recipientCount} recipient(s)`);

      // Dispatch custom event to trigger VideoCall component
      window.dispatchEvent(
        new CustomEvent("join-call", {
          detail: { roomId, isVideoCall },
        })
      );
    });

    // Listen for errors
    socket.once("error", (error: { code: string; message: string }) => {
      console.error("❌ Call initiation error:", error);
      alert(`Failed to start call: ${error.message}`);
    });
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;

    console.log("✅ Accepting call from:", incomingCall.callerName);

    // Dispatch custom event to open VideoCall component
    window.dispatchEvent(
      new CustomEvent("join-call", {
        detail: {
          roomId: incomingCall.roomId,
          isVideoCall: incomingCall.isVideoCall,
        },
      })
    );

    setIncomingCall(null);
  }, [incomingCall]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;

    console.log("❌ Declining call from:", incomingCall.callerName);
    setIncomingCall(null);
  }, [incomingCall]);

  return (
    <CallNotificationContext.Provider
      value={{
        incomingCall,
        initiateCall,
        acceptCall,
        declineCall,
      }}
    >
      {children}
    </CallNotificationContext.Provider>
  );
}

export function useCallNotification() {
  const context = useContext(CallNotificationContext);
  if (!context) {
    throw new Error("useCallNotification must be used within CallNotificationProvider");
  }
  return context;
}
