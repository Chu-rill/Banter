// components/chat/RoomMembersTab.tsx
"use client";

import { Room } from "@/types";
import { Button } from "@/components/ui/Button";
import { UserIcon, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { roomApi } from "@/lib/api/roomApi";
import toast from "react-hot-toast";

interface RoomMembersTabProps {
  room: Room;
}

const removeUserFromRoom = async (roomId: string, userId: string) => {
  try {
    await roomApi.removeMember(roomId, userId);
    toast.success("Member removed");
    console.log(`Removed user ${userId} from room ${roomId}`);
  } catch (error) {
    console.error("Failed to remove member:", error);
  }
};

export default function MembersTab({ room }: RoomMembersTabProps) {
  const { user } = useAuth();
  const isCreator = user?.id === room.creatorId;
  const isParticipant = room.participants?.some((p) => p.id === user?.id);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setImageErrors({});
  }, [room?.participants]);

  const handleImageError = (participantId: string) => {
    setImageErrors((prev) => ({ ...prev, [participantId]: true }));
  };

  return (
    <div className="space-y-4">
      {/* Members List */}
      <div className="space-y-2">
        {room.participants?.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {imageErrors[participant.id] || !participant.avatar ? (
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <img
                  src={participant.avatar}
                  alt={participant.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={() => handleImageError(participant.id)}
                />
              )}
              <div>
                <p className="font-medium">{participant.username}</p>
                {participant.id === room.creatorId && (
                  <span className="text-xs text-muted-foreground text-green-500">
                    Creator
                  </span>
                )}
              </div>
            </div>
            {isCreator && participant.id !== user?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeUserFromRoom(room.id, participant.id)}
                className=" bg-red-500 hover:bg-red-600 hover:cursor-pointer"
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Invite Button */}
      {/* {isParticipant && (
        <Button variant="outline" className="w-full">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </Button>
      )} */}
    </div>
  );
}
