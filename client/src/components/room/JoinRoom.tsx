// components/chat/JoinRoom.tsx
"use client";

import { useState, useEffect } from "react";
import { Room } from "@/types";
import { roomApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Users,
  Lock,
  Globe,
  Hash,
  X,
  Filter,
  UserPlus,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";

interface JoinRoomProps {
  isOpen: boolean;
  mode: "join" | "create";
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
  currentRooms = [],
}: JoinRoomProps) {
  const [availableRooms, setAvailableRooms] = useState<RoomWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("ALL");
  const [sortBy, setSortBy] = useState<RoomSort>("POPULAR");
  const [isLoading, setIsLoading] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) loadAvailableRooms();
  }, [isOpen, filter, sortBy]);

  const loadAvailableRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await roomApi.getRooms();
      const rooms = response.data as Room[];

      const roomsWithStatus = rooms.map((room) => ({
        ...room,
        isMember: currentRooms.some((r) => r.id === room.id),
        isPending: false,
      }));

      setAvailableRooms(roomsWithStatus);
    } catch (err) {
      setError("Failed to load available rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (room: RoomWithStatus) => {
    try {
      setJoiningRoomId(room.id);
      await roomApi.joinRoom(room.id);
      setAvailableRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, isMember: true } : r))
      );
      setJoiningRoomId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to join room");
      setJoiningRoomId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="p-6 space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rooms..."
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PUBLIC", "PRIVATE"] as RoomFilter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
        {(["POPULAR", "NEWEST", "ALPHABETICAL"] as RoomSort[]).map((s) => (
          <Button
            key={s}
            variant={sortBy === s ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Rooms List */}
      <div className="max-h-[350px] overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No rooms found. Try searching or changing filters.
          </div>
        ) : (
          availableRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={handleJoinRoom}
              isJoining={joiningRoomId === room.id}
            />
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Room Grid Component
interface RoomGridProps {
  rooms: RoomWithStatus[];
  isLoading: boolean;
  onJoinRoom: (room: RoomWithStatus) => void;
  joiningRoomId: string | null;
}

function RoomGrid({
  rooms,
  isLoading,
  onJoinRoom,
  joiningRoomId,
}: RoomGridProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-lg mb-1">No rooms found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onJoin={onJoinRoom}
            isJoining={joiningRoomId === room.id}
          />
        ))}
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
  const isRoomFull = room.participants?.length >= room.maxParticipants;

  return (
    <div className="border border-border rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-primary/20">
      {/* Room Header */}
      <div className="flex items-start gap-3 mb-3">
        {room.profilePicture ? (
          <img
            src={room.profilePicture}
            alt={room.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Hash className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{room.name}</h3>
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

      {/* Room Description */}
      {room.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {room.description}
        </p>
      )}

      {/* Room Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
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

      {/* Join Button */}
      <RoomJoinButton
        room={room}
        onJoin={onJoin}
        isJoining={isJoining}
        isRoomFull={isRoomFull}
      />
    </div>
  );
}

// Room Join Button Component
interface RoomJoinButtonProps {
  room: RoomWithStatus;
  onJoin: (room: RoomWithStatus) => void;
  isJoining: boolean;
  isRoomFull: boolean;
}

function RoomJoinButton({
  room,
  onJoin,
  isJoining,
  isRoomFull,
}: RoomJoinButtonProps) {
  if (room.isMember) {
    return (
      <div className="flex items-center justify-center py-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <CheckCircle className="w-4 h-4 mr-2" />
        Already Joined
      </div>
    );
  }

  if (room.isPending) {
    return (
      <div className="flex items-center justify-center py-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <Clock className="w-4 h-4 mr-2" />
        Request Pending
      </div>
    );
  }

  if (isRoomFull) {
    return (
      <Button disabled className="w-full" variant="outline">
        <Users className="w-4 h-4 mr-2" />
        Room Full
      </Button>
    );
  }

  return (
    <Button
      onClick={() => onJoin(room)}
      disabled={isJoining}
      className="w-full"
      variant={room.type === "PRIVATE" ? "outline" : "default"}
    >
      {isJoining ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {room.type === "PRIVATE" ? "Requesting..." : "Joining..."}
        </>
      ) : room.type === "PRIVATE" ? (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Request to Join
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Join Room
        </>
      )}
    </Button>
  );
}
