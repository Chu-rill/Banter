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
  MoreVertical,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDirectMessage = !!friend;
  const displayName = isDirectMessage ? friend.username : room?.name;
  const displayImage = isDirectMessage ? friend.avatar : room?.profilePicture;

  return (
    <header className="p-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center justify-between w-full">
        {/* Left: Sidebar toggle & avatar */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {imageError || !displayImage ? (
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center",
                "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
              )}
            >
              {isDirectMessage ? (
                <UserCircle className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
          ) : (
            <img
              src={displayImage}
              alt={displayName || "Chat"}
              className="w-9 h-9 rounded-full object-cover shadow-sm"
              onError={() => setImageError(true)}
            />
          )}

          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-semibold truncate text-foreground">
              {displayName}
            </h2>
            {!isDirectMessage && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{room?.participants.length} members</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onStartVoiceCall}>
            <Phone className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onStartVideoCall}>
            <Video className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleSearch}>
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onShowDetails}>
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        {/* Mobile: Collapsed menu */}
        <div className="flex sm:hidden relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <MoreVertical className="w-5 h-5" />
          </Button>

          {mobileMenuOpen && (
            <div className="absolute right-0 top-10 bg-card border rounded-lg shadow-lg p-2 flex flex-col space-y-1 z-30 bg-black">
              <Button variant="ghost" onClick={onStartVoiceCall}>
                <Phone className="w-4 h-4 mr-2" /> Voice
              </Button>
              <Button variant="ghost" onClick={onStartVideoCall}>
                <Video className="w-4 h-4 mr-2" /> Video
              </Button>
              <Button variant="ghost" onClick={onToggleSearch}>
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
              <Button variant="ghost" onClick={onShowDetails}>
                <Settings className="w-4 h-4 mr-2" /> Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
