"use client";

import { Hash, Globe, Lock, Users, Clock } from "lucide-react";
import { RoomFilter, RoomSort, RoomWithStatus } from "./JoinRoom";
import RoomJoinButton from "./JoinButton";

interface RoomCardProps {
  filter: RoomFilter;
  sortBy: RoomSort;
  room: RoomWithStatus;
  onJoin: (room: RoomWithStatus) => void;
  isJoining: boolean;
}

export default function RoomCard({ room, onJoin, isJoining }: RoomCardProps) {
  const isRoomFull = room.participants?.length >= room.maxParticipants;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-gray-800">
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
            <Users className="w-6 h-6 text-white dark:text-gray-200" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-white">
            {room.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {room.description}
        </p>
      )}

      {/* Room Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
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
        label={room.isPending ? "Pending Approval" : "Join Room"}
      />
    </div>
  );
}
