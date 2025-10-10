"use client";

import { useState, useEffect } from "react";
import { Room } from "@/types";
import { roomApi } from "@/lib/api/roomApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Loader2 } from "lucide-react";
import RoomCard from "./RoomCard";
import RoomGrid from "./RoomGrid";
import { cn } from "@/lib/utils";
import { useRooms } from "@/contexts/RoomsContext";
import toast from "react-hot-toast";
import { useChat } from "@/hooks/useRoomChat";

interface JoinRoomProps {
  isOpen: boolean;
  mode: "join" | "create";
  onClose: () => void;
  onRoomJoined: (room: Room) => void;
  currentRooms?: Room[]; // Rooms user is already in
}

export type RoomFilter = "ALL" | "PUBLIC" | "PRIVATE";
export type RoomSort = "NEWEST" | "POPULAR" | "ALPHABETICAL";

export interface RoomWithStatus extends Room {
  isMember?: boolean;
  isPending?: boolean;
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
  const { loadRooms } = useRooms();
  const { joinRoomWs } = useChat("");

  useEffect(() => {
    if (isOpen) loadAvailableRooms();
  }, [isOpen, filter, sortBy]);

  const loadAvailableRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await roomApi.getRooms();

      const roomsWithStatus = data.map((room) => ({
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

  const filteredRooms = availableRooms
    .filter((room) => {
      // Search filter
      if (searchQuery) {
        return room.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .filter((room) => {
      // Room type filter
      if (filter === "ALL") return true;
      return room.type === filter;
    })
    .sort((a, b) => {
      // Sorting logic
      if (sortBy === "NEWEST") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "POPULAR") {
        return (b.participants?.length || 0) - (a.participants?.length || 0);
      }
      if (sortBy === "ALPHABETICAL") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const handleJoinRoom = async (room: RoomWithStatus) => {
    try {
      setJoiningRoomId(room.id);
      setError(null);

      if (room.type === "PRIVATE") {
        // 🔒 Private room → send join request instead
        await roomApi.requestToJoinRoom(room.id);
        setAvailableRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, isPending: true } : r))
        );
        toast.success("Join request sent!");
      } else {
        // 🌍 Public room → join immediately through WebSocket
        await joinRoomWs(room.id);
        setAvailableRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, isMember: true } : r))
        );
        toast.success("Room Joined!");
        setTimeout(() => {
          onClose();
          loadRooms();
        }, 1000);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      console.error("Join room failed:", err);
      setError(err.response?.data?.message || "Failed to join room");
    } finally {
      setJoiningRoomId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="p-6 space-y-5">
      {/* Error */}
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
      <div className="flex flex-col gap-4">
        {/* Room Type Filters */}
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-2">
            Filter by Type
          </span>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "PUBLIC", "PRIVATE"] as RoomFilter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full",
                  filter === f ? "bg-blue-600 text-white" : ""
                )}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <span className="text-xs font-medium text-muted-foreground block mb-2">
            Sort by
          </span>
          <div className="flex flex-wrap gap-2">
            {(["POPULAR", "NEWEST", "ALPHABETICAL"] as RoomSort[]).map((s) => (
              <Button
                key={s}
                variant={sortBy === s ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full",
                  sortBy === s ? "bg-blue-600 text-white" : ""
                )}
                onClick={() => setSortBy(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
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
          filteredRooms.map(
            (
              room // ✅ use filteredRooms
            ) => (
              <RoomCard
                key={room.id}
                filter={filter}
                sortBy={sortBy}
                room={room}
                onJoin={handleJoinRoom}
                isJoining={joiningRoomId === room.id}
              />
            )
          )
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
