"use client";
import { createPortal } from "react-dom";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Hash,
  Video,
  Lock,
  Globe,
  Users,
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";
import { roomApi } from "@/lib/api/room";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Room } from "@/types";
import JoinRoom from "./JoinRoom";
import CreateRoom from "./CreateRoom";

const createRoomSchema = z.object({
  name: z
    .string()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Room name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]),
  mode: z.enum(["CHAT", "VIDEO", "BOTH"]),
  maxParticipants: z
    .number()
    .min(2, "Must allow at least 2 participants")
    .max(100, "Maximum 100 participants allowed"),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
}: CreateRoomModalProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      type: "PUBLIC",
      mode: "BOTH",
      maxParticipants: 10,
    },
  });

  const watchType = watch("type");
  const watchMode = watch("mode");

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      setError("");
      setIsSubmitting(true);

      const room = await roomApi.createRoom({
        name: data.name,
        description: data.description,
        type: data.type,
        mode: data.mode,
        maxParticipants: data.maxParticipants,
      });

      // Ensure only a single Room object is passed
      if (Array.isArray(room.data)) {
        onRoomCreated(room.data[0]);
      } else if ("rooms" in room.data && Array.isArray(room.data.rooms)) {
        onRoomCreated(room.data.rooms[0]);
      }
      reset();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to create room. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setMode("create");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - solid dark overlay */}
      <div
        className="absolute inset-0 bg-black/70 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal - centered with solid background */}
      <div className="relative w-full max-w-md transform transition-all">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
          {/* Header with gradient accent */}
          <div className="relative overflow-hidden rounded-t-2xl">
            {/* <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-purple-600/10" /> */}
            {/* Tab Switcher */}
            <div className="flex justify-center bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-purple-600/10 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setMode("create")}
                className={cn(
                  "flex-1 py-3 text-center font-medium transition-colors",
                  mode === "create"
                    ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                Create Room
              </button>
              <button
                onClick={() => setMode("join")}
                className={cn(
                  "flex-1 py-3 text-center font-medium transition-colors",
                  mode === "join"
                    ? "text-purple-600 border-b-2 border-purple-600 dark:text-purple-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                Join Room
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-purple-600/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {mode === "create" ? "Create New Room" : "Join a Room"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {mode === "create" ? (
            <CreateRoom onClose={handleClose} onRoomCreated={onRoomCreated} />
          ) : (
            <JoinRoom
              isOpen={isOpen}
              onClose={handleClose}
              onRoomJoined={onRoomCreated}
              currentRooms={[]}
              mode={mode}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
