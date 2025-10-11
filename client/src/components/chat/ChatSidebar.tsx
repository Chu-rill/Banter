"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  MessageCircle,
  Search,
  Plus,
  Settings,
  Moon,
  Sun,
  Users,
  Contact,
  Expand,
  LogOut,
  Minimize2,
  UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import CreateRoomModal from "@/components/room/RoomModal";
import FriendsPanel from "../user/Friends/FriendsPanel";
import { Room, User } from "@/types";
import RoomList from "../room/RoomList";
import { cn } from "@/lib/utils";
import { useRooms } from "@/contexts/RoomsContext";

interface ChatSidebarProps {
  selectedRoom: Room | null;
  selectedFriend: User | null;
  onSelectRoom: (room: Room) => void;
  onSelectFriend: (friend: User) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowProfile: () => void;
}

export default function ChatSidebar({
  selectedRoom,
  selectedFriend,
  onSelectRoom,
  onSelectFriend,
  collapsed,
  onToggleCollapse,
  onShowProfile,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const { rooms, loadRooms, loading } = useRooms();
  const { theme, setTheme } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"rooms" | "friends">("rooms");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  const filteredRooms = rooms.filter((room: Room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRoom = () => setShowCreateRoomModal(true);

  const handleRoomCreated = (newRoom: Room) => {
    onSelectRoom(newRoom);
    loadRooms();
  };

  const getUserInitial = () =>
    user?.username?.charAt(0)?.toUpperCase?.() || "?";

  // --- COLLAPSED SIDEBAR ---
  if (collapsed) {
    return (
      <div className="w-16 bg-card border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-10 h-10"
          >
            <Expand className="w-5 h-5 text-foreground" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center py-4 space-y-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateRoom}
            className="w-10 h-10"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </Button>

          <div className="flex-1 w-full">
            {filteredRooms.slice(0, 8).map((room: Room) => (
              <Button
                key={room.id}
                variant="ghost"
                size="icon"
                onClick={() => onSelectRoom(room)}
                className={cn(
                  "w-10 h-10 mb-2 mx-auto relative",
                  selectedRoom?.id === room.id && "bg-accent"
                )}
              >
                <Users className="w-4 h-4 text-foreground" />
                {room.isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10"
          >
            {theme === "dark" ? <Sun className="text-foreground" /> : <Moon className="text-foreground" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onShowProfile}
            className="w-10 h-10"
          >
            {imageError || !user?.avatar ? (
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                {getUserInitial()}
              </div>
            ) : (
              <img
                src={user.avatar}
                alt={user?.username || "User"}
                className="w-6 h-6 rounded-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // --- FULL SIDEBAR ---
  return (
    <>
      {/* Backdrop for mobile */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-40" />
      )}

      <div
        className={cn(
          "border-r border-border/50 flex flex-col transition-transform duration-300 ease-in-out",
          // Solid opaque background on mobile
          "bg-background md:bg-card shadow-lg md:shadow-none",
          // Position and size
          collapsed ? "md:w-16" : "md:w-80",
          "fixed inset-y-0 left-0 z-50 w-80  md:relative",
          collapsed && "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 md:p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-xl font-bold gradient-text">Banter</h1>
                <p className="text-sm md:text-xs text-muted-foreground -mt-1">
                  Chat & Video
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="w-10 h-10 md:w-9 md:h-9">
              <Minimize2 className="w-5 h-5 md:w-4 md:h-4 text-foreground" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-muted-foreground" />
            <input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 md:h-10 pl-11 md:pl-10 pr-4 bg-secondary/50 border border-border/30 rounded-lg text-base md:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-background md:bg-secondary/20 border-b border-border/50">
          <button
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "flex-1 py-3.5 md:py-3 px-4 text-base md:text-sm font-medium transition-all relative overflow-hidden",
              activeTab === "rooms"
                ? "text-purple-600 bg-secondary/80 md:bg-background/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 md:hover:bg-secondary/30"
            )}
          >
            {activeTab === "rooms" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
            <Users className="w-5 h-5 md:w-4 md:h-4 inline-block mr-2" />
            Rooms
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={cn(
              "flex-1 py-3.5 md:py-3 px-4 text-base md:text-sm font-medium transition-all relative overflow-hidden",
              activeTab === "friends"
                ? "text-purple-600 bg-secondary/80 md:bg-background/50"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 md:hover:bg-secondary/30"
            )}
          >
            {activeTab === "friends" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
            <Contact className="w-5 h-5 md:w-4 md:h-4 inline-block mr-2" />
            Friends
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === "rooms" ? (
            <RoomList
              rooms={rooms}
              user={user}
              selectedRoom={selectedRoom}
              loading={loading}
              searchTerm={searchTerm}
              onSelectRoom={onSelectRoom}
              onCreateRoom={handleCreateRoom}
            />
          ) : (
            <FriendsPanel onSelectFriend={onSelectFriend} />
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border/50 bg-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative">
                {imageError || !user?.avatar ? (
                  <UserIcon className="w-10 h-10 md:w-8 md:h-8 text-gray-400" />
                ) : (
                  <img
                    src={user.avatar}
                    alt={user.username || "User"}
                    className="w-12 h-12 md:w-11 md:h-11 rounded-xl object-cover shadow-md"
                    onError={() => setImageError(true)}
                  />
                )}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background shadow-sm",
                    user?.isOnline ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base md:text-sm font-semibold text-foreground truncate">
                  {user?.username || "Loading..."}
                </p>
                <p
                  className={cn(
                    "text-sm md:text-xs font-medium truncate",
                    user?.isOnline ? "text-green-600" : "text-muted-foreground"
                  )}
                >
                  {user?.isOnline ? "🟢 Online" : "⚫ Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 md:w-9 md:h-9 hover:bg-accent/50 rounded-lg"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 md:w-4 md:h-4 text-foreground" /> : <Moon className="w-5 h-5 md:w-4 md:h-4 text-foreground" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onShowProfile}
                className="w-10 h-10 md:w-9 md:h-9 hover:bg-accent/50 rounded-lg"
                title="Settings"
              >
                <Settings className="w-5 h-5 md:w-4 md:h-4 text-foreground" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="w-10 h-10 md:w-9 md:h-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 md:w-4 md:h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      </div>
    </>
  );
}
