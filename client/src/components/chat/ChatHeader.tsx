// components/chat/ChatHeader.tsx
"use client";

import { Room, User } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  Menu,
  Users,
  Phone,
  Video,
  Search,
  Settings,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChatHeaderProps {
  room?: Room;
  friend?: User;
  onToggleSidebar: () => void;
  onStartVideoCall: () => void;
  onStartVoiceCall: () => void;
  onToggleSearch: () => void;
  onShowDetails: () => void;
}

export default function ChatHeader({
  room,
  friend,
  onToggleSidebar,
  onStartVideoCall,
  onStartVoiceCall,
  onToggleSearch,
  onShowDetails,
}: ChatHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const isDirectMessage = !!friend;
  const displayName = isDirectMessage ? friend.username : room?.name;
  const displayImage = isDirectMessage ? friend.avatar : room?.profilePicture;

  return (
    <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div>
            {imageError || !displayImage ? (
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                )}
              >
                {isDirectMessage ? (
                  <UserCircle className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Users className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            ) : (
              <img
                src={displayImage}
                alt={displayName || "Chat"}
                className="w-11 h-11 rounded-xl object-cover shadow-md"
                onError={() => setImageError(true)}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {displayName}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {isDirectMessage ? (
                <span></span>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>{room?.participants.length} members</span>
                  {room?.isActive && (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Active</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onStartVoiceCall}
            className="hidden sm:flex"
            aria-label="Start voice call"
          >
            <Phone className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onStartVideoCall}
            aria-label="Start video call"
          >
            <Video className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Search messages"
            onClick={onToggleSearch}
            className="hidden sm:flex"
          >
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Room settings"
            onClick={onShowDetails}
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
