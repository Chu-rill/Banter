"use client";

import { Button } from "@/components/ui/Button";
import { CheckCircle, Clock, Loader2, UserPlus, Users } from "lucide-react";
import { RoomWithStatus } from "./JoinRoom";
import { useAuth } from "@/contexts/AuthContext";

interface RoomJoinButtonProps {
  room: RoomWithStatus;
  onJoin: (room: RoomWithStatus) => void;
  isJoining: boolean;
  isRoomFull: boolean;
  label: string;
}

export default function RoomJoinButton({
  room,
  onJoin,
  isJoining,
  isRoomFull,
}: RoomJoinButtonProps) {
  const { user } = useAuth();
  const hasJoined = room.participants?.some((p) =>
    typeof p === "string" ? p === user?.id : p.id === user?.id
  );

  if (hasJoined) {
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
      className="w-full bg-green-400 hover:bg-green-500 text-white hover:cursor-pointer"
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
