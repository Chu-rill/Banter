"use client";

import { useEffect, useState } from "react";
import { Room } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import {
  Users,
  Lock,
  Globe,
  Pencil,
  Check,
  LogOut,
  UserPlus,
  Trash,
} from "lucide-react";
import { roomApi } from "@/lib/api/roomApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRooms } from "@/contexts/RoomsContext";

interface DetailsTabProps {
  room: Room;
  onClose: () => void;
  onLeaveRoom?: () => void;
}

export default function DetailsTab({
  room,
  onClose,
  onLeaveRoom,
}: DetailsTabProps) {
  const { user } = useAuth();
  const { loadRooms } = useRooms();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState(room);
  const [loading, setLoading] = useState(false);
  const isCreator = user?.id === room.creatorId;
  const isParticipant = room.participants?.some((p) => p.id === user?.id);

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [room?.profilePicture]);

  const handleJoin = async () => {
    try {
      setLoading(true);
      const joined = await roomApi.joinRoom(room.id);
      //   onJoined?.(joined.data);
    } catch (err) {
      console.error("Failed to join room", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setLoading(true);
      await roomApi.leaveRoom(room.id);
      loadRooms();
      toast.success("Left Room!");
      onLeaveRoom?.();
      onClose();
    } catch (err) {
      console.error("Failed to leave room", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await roomApi.updateRoom(room.id, {
        name: editedRoom.name,
        description: editedRoom.description,
        maxParticipants: editedRoom.maxParticipants,
        profilePicture: editedRoom.profilePicture,
      });
      toast.success("Room Updated!");
      setIsEditing(false);
      loadRooms();
      onClose();

      // onUpdated?.(updated.data);
    } catch (err) {
      console.error("Failed to update room", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const deleted = await roomApi.deleteRoom(room.id);
      loadRooms();
      onLeaveRoom?.();
      toast.success("Room Deleted!");
      onClose();
    } catch (error) {
      console.error("Failed to delete room", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Room Info */}
      <div className="flex items-center space-x-4">
        {imageError || !room.profilePicture ? (
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
            <Users className="w-10 h-10 text-white" />
          </div>
        ) : (
          <img
            src={room.profilePicture}
            alt={room.name}
            className="w-20 h-20 rounded-xl object-cover shadow-md"
            onError={() => setImageError(true)}
          />
        )}
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editedRoom.name}
              onChange={(e) =>
                setEditedRoom({ ...editedRoom, name: e.target.value })
              }
              className="font-bold text-lg mb-2"
              placeholder="Room name"
            />
          ) : (
            <h3 className="font-bold text-lg mb-1">{room.name}</h3>
          )}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {room.type === "PRIVATE" ? (
              <>
                <Lock className="w-4 h-4" /> Private Room
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" /> Public Room
              </>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">
          Description
        </label>
        {isEditing ? (
          <textarea
            value={editedRoom.description ?? ""}
            onChange={(e) =>
              setEditedRoom({
                ...editedRoom,
                description: e.target.value,
              })
            }
            className="w-full mt-1 p-3 border border-border rounded-lg resize-none"
            rows={3}
            placeholder="Add a description..."
          />
        ) : (
          <p className="text-sm mt-1">{room.description || "No description"}</p>
        )}
      </div>

      {/* Settings */}
      {isEditing && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Max Participants
          </label>
          <select
            value={editedRoom.maxParticipants}
            onChange={(e) =>
              setEditedRoom({
                ...editedRoom,
                maxParticipants: parseInt(e.target.value),
              })
            }
            className="w-full mt-1 p-3 border border-border rounded-lg bg-background text-foreground"
          >
            {Array.from({ length: 99 }, (_, i) => i + 2).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          {!isParticipant && !isCreator && (
            <Button onClick={handleJoin} disabled={loading}>
              <UserPlus className="w-4 h-4 mr-1" />
              {room.type === "PRIVATE" ? "Request to Join" : "Join Room"}
            </Button>
          )}

          {isParticipant && !isCreator && (
            <Button
              variant="outline"
              className=" bg-red-500 hover:cursor-pointer hover:bg-red-600"
              onClick={handleLeave}
              disabled={loading}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Leave Room
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCreator && !isEditing && (
            <div className="flex items-center gap-2">
              <Button
                className=" bg-orange-500 hover:bg-orange-600 hover:cursor-pointer"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                className=" bg-red-500 hover:bg-red-600 hover:cursor-pointer"
                variant="outline"
                onClick={handleDelete}
              >
                <Trash className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          )}

          {isCreator && isEditing && (
            <>
              <Button
                className=" bg-red-500 hover:bg-red-600 hover:cursor-pointer"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedRoom(room);
                }}
              >
                Cancel
              </Button>
              <Button
                className=" bg-blue-500 hover:bg-blue-600 hover:cursor-pointer"
                onClick={handleSave}
                disabled={loading}
              >
                <Check className="w-4 h-4 mr-1" /> Save
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
