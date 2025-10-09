"use client";

import { User } from "@/types";
import { Button } from "@/components/ui/Button";
import { X, Mail, UserIcon, MessageCircle, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface UserDetailsProps {
  friend: User;
  onClose: () => void;
  onStartVideoCall?: () => void;
  onStartVoiceCall?: () => void;
}

export default function UserDetails({
  friend,
  onClose,
  onStartVideoCall,
  onStartVoiceCall,
}: UserDetailsProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl sm:rounded-2xl shadow-lg max-w-md w-full border border-border">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">User Info</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar and Name */}
          <div className="text-center">
            <div className="relative inline-block">
              {imageError || !friend.avatar ? (
                <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center mx-auto">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
              ) : (
                <img
                  src={friend.avatar}
                  alt={friend.username}
                  className="w-24 h-24 rounded-full object-cover border-4 border-border mx-auto"
                  onError={() => setImageError(true)}
                />
              )}

              {/* Online Status Indicator */}
              <div
                className={cn(
                  "absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-background",
                  friend.isOnline ? "bg-green-500" : "bg-gray-400"
                )}
              />
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-semibold">{friend.username}</h3>
              <div className="flex items-center justify-center space-x-1 mt-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    friend.isOnline ? "bg-green-500" : "bg-gray-400"
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {friend.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-background rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{friend.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-background rounded-lg">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="text-sm font-medium">{friend.username}</p>
                </div>
              </div>

              {friend.bio && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{friend.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full flex items-center justify-center space-x-2"
              onClick={onClose}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Message</span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {onStartVoiceCall && (
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                  onClick={() => {
                    onStartVoiceCall();
                    onClose();
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span>Voice Call</span>
                </Button>
              )}

              {onStartVideoCall && (
                <Button
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                  onClick={() => {
                    onStartVideoCall();
                    onClose();
                  }}
                >
                  <Video className="w-4 h-4" />
                  <span>Video Call</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
