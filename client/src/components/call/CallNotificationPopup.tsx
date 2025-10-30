"use client";

import { useEffect } from "react";
import { Phone, Video, PhoneOff, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallNotificationPopupProps {
  isOpen: boolean;
  callerName: string;
  callerAvatar?: string;
  isVideoCall: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function CallNotificationPopup({
  isOpen,
  callerName,
  callerAvatar,
  isVideoCall,
  onAccept,
  onDecline,
}: CallNotificationPopupProps) {
  // Auto-decline after 30 seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      console.log("⏰ Call timeout - auto declining");
      onDecline();
    }, 30000);

    return () => clearTimeout(timer);
  }, [isOpen, onDecline]);

  if (!isOpen) return null;

  const callType = isVideoCall ? "Video" : "Voice";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] animate-in fade-in duration-200" />

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] animate-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-[340px] max-w-[90vw]">
          {/* Call type badge */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2",
                isVideoCall
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              )}
            >
              {isVideoCall ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              Incoming {callType} call
            </div>
          </div>

          {/* Avatar with pulse animation */}
          <div className="flex justify-center mb-6 relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-purple-500/20 animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-purple-500/30 animate-pulse" />
            </div>

            {/* Avatar */}
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={callerName}
                className="relative w-24 h-24 rounded-full object-cover shadow-xl"
              />
            ) : (
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-xl">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Caller name */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {callerName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              wants to {isVideoCall ? "video" : "voice"} call with you
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-6">
            {/* Decline button */}
            <button
              onClick={onDecline}
              className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg group"
              aria-label="Decline call"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>

            {/* Accept button */}
            <button
              onClick={onAccept}
              className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-110 shadow-lg group animate-pulse"
              aria-label="Accept call"
            >
              {isVideoCall ? (
                <Video className="w-9 h-9 text-white" />
              ) : (
                <Phone className="w-9 h-9 text-white" />
              )}
            </button>
          </div>

          {/* Button labels */}
          <div className="flex justify-center gap-6 mt-3">
            <span className="text-xs text-gray-600 dark:text-gray-400 w-16 text-center">
              Decline
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400 w-20 text-center">
              Accept
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
