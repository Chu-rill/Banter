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
  Group,
  Video,
  Expand,
  LogOut,
  Minimize2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { roomApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatTimeAgo } from "@/lib/utils";
import CreateRoomModal from "./CreateRoomModal";
import FriendsPanel from "./FriendsPanel";
import { Room } from "@/types";

interface ChatSidebarProps {
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowProfile: () => void;
}

export default function ChatSidebar({
  selectedRoom,
  onSelectRoom,
  collapsed,
  onToggleCollapse,
  onShowProfile,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "friends">("rooms");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await roomApi.getRooms();
      console.log("Rooms data received:", roomsData); // Debug log

      // Ensure we have an array
      let roomArray: Room[] = [];
      if (Array.isArray(roomsData.data)) {
        roomArray = roomsData.data as Room[];
      } else if ("rooms" in roomsData.data) {
        roomArray = roomsData.data.rooms;
      } else if ("id" in roomsData.data) {
        roomArray = [roomsData.data as Room];
      }
      setRooms(roomArray);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      setRooms([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRoom = () => {
    setShowCreateRoomModal(true);
  };

  const handleRoomCreated = (newRoom: Room) => {
    setRooms((prev) => [newRoom, ...prev]);
    onSelectRoom(newRoom);
  };

  // Helper function to get user initial safely
  const getUserInitial = () => {
    if (
      user?.username &&
      typeof user.username === "string" &&
      user.username.length > 0
    ) {
      return user.username.charAt(0).toUpperCase();
    }
    return "?";
  };

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
            <Expand className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center py-4 space-y-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateRoom}
            className="w-10 h-10"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <div className="flex-1 w-full">
            {filteredRooms.slice(0, 8).map((room) => (
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
                <Group className="w-4 h-4" />
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
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onShowProfile}
            className="w-10 h-10"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.username || "User"}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                {getUserInitial()}
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-secondary/30 border-r border-border/50 flex flex-col transition-transform duration-300 ease-in-out backdrop-blur-sm",
        "w-80 md:w-80",
        collapsed ? "w-16" : "w-80",
        "md:relative md:translate-x-0",
        "sm:absolute sm:inset-y-0 sm:left-0 sm:z-50",
        collapsed && "sm:-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Banter</h1>
              <p className="text-xs text-muted-foreground -mt-1">
                Chat & Video
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hover:bg-accent/50"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border/30 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/20 border-b border-border/50">
        <button
          onClick={() => setActiveTab("rooms")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-all relative overflow-hidden",
            activeTab === "rooms"
              ? "text-purple-600 bg-background/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
          )}
        >
          {activeTab === "rooms" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
          <Group className="w-4 h-4 inline-block mr-2" />
          Rooms
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium transition-all relative overflow-hidden",
            activeTab === "friends"
              ? "text-purple-600 bg-background/50"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
          )}
        >
          {activeTab === "friends" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
          )}
          <Users className="w-4 h-4 inline-block mr-2" />
          Friends
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === "rooms" && (
          <div className="p-3">
            {/* Create Room Button */}
            <button
              onClick={handleCreateRoom}
              className="w-full flex items-center justify-start px-4 py-3 mb-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Room
            </button>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-8">
                <Group className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "No rooms found" : "No rooms yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={cn(
                      "flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group",
                      selectedRoom?.id === room.id
                        ? "bg-purple-600/10 border border-purple-500/20 shadow-lg"
                        : "hover:bg-secondary/50 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-105",
                            room.mode === "VIDEO"
                              ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
                            selectedRoom?.id === room.id &&
                              "ring-2 ring-purple-500/30"
                          )}
                        >
                          {room.mode === "VIDEO" ? (
                            <Video className="w-6 h-6" />
                          ) : (
                            <Group className="w-6 h-6" />
                          )}
                        </div>
                        {room.isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3
                            className={cn(
                              "text-sm font-semibold truncate transition-colors",
                              selectedRoom?.id === room.id
                                ? "text-purple-600"
                                : "text-foreground group-hover:text-purple-600"
                            )}
                          >
                            {room.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {room.type === "PRIVATE" && (
                              <div
                                className="w-2 h-2 bg-amber-500 rounded-full"
                                title="Private room"
                              />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(room.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {room.description ||
                              `${room.participants?.length || 0} ${
                                room.participants?.length === 1
                                  ? "member"
                                  : "members"
                              }`}
                          </p>
                          <div className="flex items-center space-x-1">
                            <div className="flex -space-x-1">
                              {room.participants
                                ?.slice(0, 3)
                                .map((participant, index) => (
                                  <div
                                    key={participant.id}
                                    className="w-5 h-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full border border-background flex items-center justify-center text-xs text-white font-medium"
                                    title={participant.username}
                                  >
                                    {participant.username
                                      ?.charAt(0)
                                      ?.toUpperCase() || "?"}
                                  </div>
                                ))}
                              {room.participants?.length > 3 && (
                                <div className="w-5 h-5 bg-muted border border-background rounded-full flex items-center justify-center text-xs font-medium">
                                  +{room.participants.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <FriendsPanel
            onStartDirectMessage={(friend) => {
              // TODO: Create direct message room or navigate to existing DM
              console.log("Start DM with:", friend.username);
            }}
          />
        )}
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-border/50 bg-secondary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.username || "User"}
                  className="w-11 h-11 rounded-xl object-cover shadow-md"
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {getUserInitial()}
                </div>
              )}
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background shadow-sm",
                  user?.isOnline ? "bg-green-500" : "bg-gray-400"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.username || "Loading..."}
              </p>
              <p
                className={cn(
                  "text-xs font-medium truncate",
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
              className="w-9 h-9 hover:bg-accent/50 rounded-lg"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onShowProfile}
              className="w-9 h-9 hover:bg-accent/50 rounded-lg"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="w-9 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
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
  );
}
