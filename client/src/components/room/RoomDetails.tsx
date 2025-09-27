// components/chat/RoomDetails.tsx
"use client";

import { useState } from "react";
import { Room } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Users,
  Lock,
  Globe,
  Pencil,
  Check,
  X,
  Settings,
  UserPlus,
  LogOut,
} from "lucide-react";
import { roomApi } from "@/lib/api/room";
import { useAuth } from "@/contexts/AuthContext";
import { useRooms } from "@/contexts/RoomsContext";

interface RoomDetailsProps {
  room: Room;
  onClose: () => void;
  onJoined?: (room: Room) => void;
  onUpdated?: (room: Room) => void;
}

export default function RoomDetails({
  room,
  onClose,
  onJoined,
  onUpdated,
}: RoomDetailsProps) {
  const { user } = useAuth();
  const { loadRooms } = useRooms();
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoom, setEditedRoom] = useState(room);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "members">("details");

  const isCreator = user?.id === room.creatorId;
  const isParticipant = room.participants?.some((p) => p.id === user?.id);

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
      setIsEditing(false);
      //   onUpdated?.(updated.data);
    } catch (err) {
      console.error("Failed to update room", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-2xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold">Room Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "details"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "members"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("members")}
          >
            Members ({room.participants?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" ? (
            <div className="space-y-6">
              {/* Room Info */}
              <div className="flex items-center space-x-4">
                {room.profilePicture ? (
                  <img
                    src={room.profilePicture}
                    alt={room.name}
                    className="w-20 h-20 rounded-xl object-cover shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                    <Users className="w-10 h-10 text-white" />
                  </div>
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
                  <p className="text-sm mt-1">
                    {room.description || "No description"}
                  </p>
                )}
              </div>

              {/* Settings */}
              {isEditing && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Max Participants
                  </label>
                  <Input
                    type="number"
                    value={editedRoom.maxParticipants}
                    onChange={(e) =>
                      setEditedRoom({
                        ...editedRoom,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                    min={2}
                    max={100}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {!isParticipant && !isCreator && (
                    <Button onClick={handleJoin} disabled={loading}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      {room.type === "PRIVATE"
                        ? "Request to Join"
                        : "Join Room"}
                    </Button>
                  )}

                  {isParticipant && !isCreator && (
                    <Button
                      variant="outline"
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
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}

                  {isCreator && isEditing && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedRoom(room);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={loading}>
                        <Check className="w-4 h-4 mr-1" /> Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
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
                          <span className="text-xs text-muted-foreground">
                            Room Creator
                          </span>
                        )}
                      </div>
                    </div>
                    {isCreator && participant.id !== user?.id && (
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite Button */}
              {isParticipant && (
                <Button variant="outline" className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
