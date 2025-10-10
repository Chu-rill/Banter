"use client";

import { Users } from "lucide-react";
import { RoomWithStatus } from "./JoinRoom";
import RoomCard from "./RoomCard";
import Loader from "@/components/ui/Loader";

interface RoomGridProps {
  rooms: RoomWithStatus[];
  isLoading: boolean;
  onJoinRoom: (room: RoomWithStatus) => void;
  joiningRoomId: string | null;
}

export default function RoomGrid({
  rooms,
  isLoading,
  onJoinRoom,
  joiningRoomId,
}: RoomGridProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader size={80} color="#9b6bff" />
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
        {/* {rooms.map((room) => (
          <RoomCard
            filter={filter}
            sortBy={sortBy}
            key={room.id}
            room={room}
            onJoin={onJoinRoom}
            isJoining={joiningRoomId === room.id}
          />
        ))} */}
      </div>
    </div>
  );
}
