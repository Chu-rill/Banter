"use client";

import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import RoomListItem from "./RoomListItem";
import { Room, User } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface RoomListProps {
  rooms: Room[];
  user: User | null;
  selectedRoom?: Room | null;
  loading: boolean;
  searchTerm: string;
  onSelectRoom: (room: Room) => void;
  onCreateRoom: () => void;
}

export default function RoomList({
  rooms,
  user,
  selectedRoom,
  loading,
  searchTerm,
  onSelectRoom,
  onCreateRoom,
}: RoomListProps) {
  // Only show rooms where user is a participant
  const memberRooms = rooms.filter((room) =>
    room.participants?.some((p) => p.id === user?.id)
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-3 h-full flex flex-col ">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : memberRooms.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "No rooms found" : "You’re not in any rooms yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memberRooms.map((room) => (
              <RoomListItem
                key={room.id}
                room={room}
                selected={selectedRoom?.id === room.id}
                onClick={() => onSelectRoom(room)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Room Button */}
      <button
        onClick={onCreateRoom}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black shadow-lg hover:cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
