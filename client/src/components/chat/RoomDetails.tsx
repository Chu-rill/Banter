"use client";

import { useState } from "react";
import { Room, User } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Users, Lock, Globe, Pencil, Check, X } from "lucide-react";
import { roomApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface RoomDetailsProps {
  room: Room;
  onJoined?: (room: Room) => void;
  onUpdated?: (room: Room) => void;
}

export default function RoomDetails({
  room,
  onJoined,
  onUpdated,
}: RoomDetailsProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState(room);
  const [loading, setLoading] = useState(false);

  const isCreator = user?.id === room.creatorId;
  const isParticipant = room.participants?.some((p) => p.id === user?.id);

  // Join room handler
  //   const handleJoin = async () => {
  //     try {
  //       setLoading(true);
  //       const joined = await roomApi.joinRoom(room.id);
  //       onJoined?.(joined.data);
  //     } catch (err) {
  //       console.error("Failed to join room", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  // Save edits
  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await roomApi.updateRoom(room.id, {
        name: editedRoom.name,
        description: editedRoom.description,
        maxParticipants: editedRoom.maxParticipants,
        profilePicture: editedRoom.profilePicture,
      });
      setIsEditing(false);
      //   onUpdated?.(updated.data);
    } catch (err) {
      console.error("Failed to update room", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-background rounded-2xl shadow-lg max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        {room.profilePicture ? (
          <img
            src={room.profilePicture}
            alt={room.name}
            className="w-16 h-16 rounded-xl object-cover shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
            <Users className="w-8 h-8 text-white" />
          </div>
        )}
        <div>
          {isEditing ? (
            <Input
              value={editedRoom.name}
              onChange={(e) =>
                setEditedRoom({ ...editedRoom, name: e.target.value })
              }
              className="font-bold text-lg"
            />
          ) : (
            <h2 className="font-bold text-lg">{room.name}</h2>
          )}
          <p className="text-sm text-muted-foreground">
            {room.type === "PRIVATE" ? (
              <span className="flex items-center gap-1">
                <Lock className="w-4 h-4" /> Private
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" /> Public
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Description
        </h3>
        {isEditing ? (
          <Input
            value={editedRoom.description ?? ""}
            onChange={(e) =>
              setEditedRoom({ ...editedRoom, description: e.target.value })
            }
          />
        ) : (
          <p className="text-sm">{room.description || "No description"}</p>
        )}
      </div>

      {/* Participants */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Participants
        </h3>
        <div className="flex -space-x-2 mt-2">
          {room.participants?.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full border border-background flex items-center justify-center text-xs text-white font-medium"
              title={p.username}
            >
              {p.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {room.participants?.length > 5 && (
            <div className="w-8 h-8 bg-muted border border-background rounded-full flex items-center justify-center text-xs font-medium">
              +{room.participants.length - 5}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {room.participants?.length || 0} / {room.maxParticipants} members
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2">
        {/* {!isParticipant && !isCreator && (
          <Button onClick={handleJoin} disabled={loading}>
            {room.type === "PRIVATE" ? "Request to Join" : "Join Room"}
          </Button>
        )} */}

        {isCreator && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        )}

        {isCreator && isEditing && (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Check className="w-4 h-4 mr-1" /> Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
