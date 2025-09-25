// components/chat/JoinRoom.tsx
"use client";

import { useState, useEffect } from "react";
import { Room } from "@/types";
import { roomApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Search,
  Users,
  Lock,
  Globe,
  Hash,
  Plus,
  X,
  Filter,
  UserPlus,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";

interface JoinRoomProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomJoined: (room: Room) => void;
  currentRooms?: Room[]; // Rooms user is already in
}

type RoomFilter = "ALL" | "PUBLIC" | "PRIVATE";
type RoomSort = "NEWEST" | "POPULAR" | "ALPHABETICAL";

interface RoomWithStatus extends Room {
  isMember?: boolean;
  isPending?: boolean; // For pending join requests
}

export default function JoinRoom({
  isOpen,
  onClose,
  onRoomJoined,
  currentRooms = [],
}: JoinRoomProps) {
  const [availableRooms, setAvailableRooms] = useState<RoomWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("ALL");
  const [sortBy, setSortBy] = useState<RoomSort>("POPULAR");
  const [isLoading, setIsLoading] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // New room form state
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomType, setNewRoomType] = useState<"PUBLIC" | "PRIVATE">(
    "PUBLIC"
  );
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState(50);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableRooms();
    }
  }, [isOpen, filter, sortBy]);

  const loadAvailableRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all rooms
      const response = await roomApi.getRooms();

      const rooms = response.data as Room[];

      // Mark rooms user is already in
      const roomsWithStatus = rooms.map((room) => ({
        ...room,
        isMember: currentRooms.some((r) => r.id === room.id),
        isPending: false, // You can check pending requests here
      }));

      setAvailableRooms(roomsWithStatus);
    } catch (err) {
      console.error("Failed to load rooms:", err);
      setError("Failed to load available rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (room: RoomWithStatus) => {
    try {
      setJoiningRoomId(room.id);
      setError(null);

      const joinedRoom = await roomApi.joinRoom(room.id);

      // Update the room status
      setAvailableRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, isMember: true } : r))
      );

      // Notify parent
      //   onRoomJoined(joinedRoom.data);

      // Show success feedback
      setTimeout(() => {
        setJoiningRoomId(null);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to join room:", err);
      setError(err.response?.data?.message || "Failed to join room");
      setJoiningRoomId(null);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRoomName.trim()) {
      setError("Room name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      // Reset form
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomType("PUBLIC");
      setNewRoomMaxParticipants(50);
      setShowCreateRoom(false);
    } catch (err: any) {
      console.error("Failed to create room:", err);
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredRooms = availableRooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Discover Rooms</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search and filters */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms..."
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCreateRoom(!showCreateRoom)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1">
                {(["ALL", "PUBLIC", "PRIVATE"] as RoomFilter[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f === "ALL" && <Filter className="w-3 h-3 mr-1" />}
                    {f === "PUBLIC" && <Globe className="w-3 h-3 mr-1" />}
                    {f === "PRIVATE" && <Lock className="w-3 h-3 mr-1" />}
                    {f.charAt(0) + f.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>

              <div className="flex gap-1">
                {(["POPULAR", "NEWEST", "ALPHABETICAL"] as RoomSort[]).map(
                  (s) => (
                    <Button
                      key={s}
                      variant={sortBy === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy(s)}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Room Form */}
        {showCreateRoom && (
          <div className="p-6 border-b border-border bg-muted/20">
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Room Name *
                  </label>
                  <Input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Room Type
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={newRoomType === "PUBLIC" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewRoomType("PUBLIC")}
                      className="flex-1"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={
                        newRoomType === "PRIVATE" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setNewRoomType("PRIVATE")}
                      className="flex-1"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Description
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="What's this room about?"
                  className="w-full p-3 border border-border rounded-lg resize-none"
                  rows={2}
                  maxLength={200}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Max Members:</label>
                  <Input
                    type="number"
                    value={newRoomMaxParticipants}
                    onChange={(e) =>
                      setNewRoomMaxParticipants(parseInt(e.target.value))
                    }
                    min={2}
                    max={100}
                    className="w-20"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateRoom(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Room
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Room List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-lg mb-1">No rooms found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or create a new room
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={handleJoinRoom}
                  isJoining={joiningRoomId === room.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Room Card Component
interface RoomCardProps {
  room: RoomWithStatus;
  onJoin: (room: RoomWithStatus) => void;
  isJoining: boolean;
}

function RoomCard({ room, onJoin, isJoining }: RoomCardProps) {
  return (
    <div className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {room.profilePicture ? (
            <img
              src={room.profilePicture}
              alt={room.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Hash className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{room.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {room.type === "PRIVATE" ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Globe className="w-3 h-3" />
              )}
              <span>{room.type.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {room.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {room.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {room.participants?.length || 0}/{room.maxParticipants}
          </span>
          {room.createdAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(room.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {room.isMember ? (
          <div className="flex items-center text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4 mr-1" />
            Joined
          </div>
        ) : room.isPending ? (
          <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => onJoin(room)}
            disabled={
              isJoining || room.participants?.length >= room.maxParticipants
            }
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Joining...
              </>
            ) : room.type === "PRIVATE" ? (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Request
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-1" />
                Join
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
