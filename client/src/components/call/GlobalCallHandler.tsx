"use client";

import { useState, useEffect } from "react";
import VideoCall from "../chat/VideoCall";
import { Room } from "@/types";

interface CallState {
  roomId: string;
  isVideoCall: boolean;
}

export default function GlobalCallHandler() {
  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  useEffect(() => {
    const handleJoinCall = (event: Event) => {
      const customEvent = event as CustomEvent<CallState>;
      const { roomId, isVideoCall } = customEvent.detail;

      console.log("🎥 GlobalCallHandler: Joining call", { roomId, isVideoCall });
      setActiveCall({ roomId, isVideoCall });
    };

    window.addEventListener("join-call", handleJoinCall);

    return () => {
      window.removeEventListener("join-call", handleJoinCall);
    };
  }, []);

  if (!activeCall) return null;

  // Create a minimal room object for VideoCall
  const roomForCall: Partial<Room> = { id: activeCall.roomId };

  return (
    <VideoCall
      room={roomForCall}
      isOpen={true}
      onClose={() => setActiveCall(null)}
      isVideoCall={activeCall.isVideoCall}
    />
  );
}
