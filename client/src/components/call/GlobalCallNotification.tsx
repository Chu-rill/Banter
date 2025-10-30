"use client";

import { useCallNotification } from "@/contexts/CallNotificationContext";
import CallNotificationPopup from "./CallNotificationPopup";

export default function GlobalCallNotification() {
  const { incomingCall, acceptCall, declineCall } = useCallNotification();

  return (
    <CallNotificationPopup
      isOpen={!!incomingCall}
      callerName={incomingCall?.callerName || ""}
      callerAvatar={incomingCall?.callerAvatar}
      isVideoCall={incomingCall?.isVideoCall || false}
      onAccept={acceptCall}
      onDecline={declineCall}
    />
  );
}
