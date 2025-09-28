// components/chat/RoomMembersTab.tsx
"use client";

import { Room } from "@/types";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface RoomMembersTabProps {
  room: Room;
}

export default function MembersTab({ room }: RoomMembersTabProps) {
  const { user } = useAuth();
  const isCreator = user?.id === room.creatorId;
  const isParticipant = room.participants?.some((p) => p.id === user?.id);

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
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-medium">
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt={participant.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  participant.username.charAt(0).toUpperCase()
                )}
              </div>
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
