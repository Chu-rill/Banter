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
import { roomApi } from "@/lib/api/roomApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRooms } from "@/contexts/RoomsContext";
import MembersTab from "./MembersTab";
import DetailsTab from "./DetailsTab";

interface RoomDetailsProps {
  room: Room;
  onClose: () => void;
  onJoined?: (room: Room) => void;
  onUpdated?: (room: Room) => void;
}

export default function GroupInfo({
  room,
  onClose,
  onJoined,
  onUpdated,
}: RoomDetailsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "members">("details");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-2xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto bg-black border-white border">
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
            <DetailsTab
              room={room}
              onClose={onClose}
              // onJoined={onJoined}
              // onUpdated={onUpdated}
            />
          ) : (
            <MembersTab room={room} />
          )}
        </div>
      </div>
    </div>
  );
}
