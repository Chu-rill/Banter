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
import { roomApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Room } from "@/types";

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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-purple-600/10" />
            <div className="relative flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Room
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

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Room Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Room Name
              </label>
              <Input
                {...register("name")}
                placeholder="Enter room name"
                error={errors.name?.message}
                maxLength={50}
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <Input
                {...register("description")}
                placeholder="What's this room about?"
                error={errors.description?.message}
                maxLength={200}
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              />
            </div>

            {/* Room Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Room Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("type", "PUBLIC")}
                  className={cn(
                    "p-4 border-2 rounded-xl text-left transition-all",
                    watchType === "PUBLIC"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        watchType === "PUBLIC"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        Public
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Anyone can join
                      </p>
                    </div>
                    {watchType === "PUBLIC" && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("type", "PRIVATE")}
                  className={cn(
                    "p-4 border-2 rounded-xl text-left transition-all",
                    watchType === "PRIVATE"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        watchType === "PRIVATE"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        Private
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Invite only
                      </p>
                    </div>
                    {watchType === "PRIVATE" && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Room Mode */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Room Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setValue("mode", "CHAT")}
                  className={cn(
                    "p-3 border-2 rounded-lg text-center transition-all",
                    watchMode === "CHAT"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  )}
                >
                  <Hash
                    className={cn(
                      "w-5 h-5 mx-auto mb-1",
                      watchMode === "CHAT"
                        ? "text-purple-600"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Chat Only
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("mode", "VIDEO")}
                  className={cn(
                    "p-3 border-2 rounded-lg text-center transition-all",
                    watchMode === "VIDEO"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  )}
                >
                  <Video
                    className={cn(
                      "w-5 h-5 mx-auto mb-1",
                      watchMode === "VIDEO"
                        ? "text-purple-600"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Video Only
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue("mode", "BOTH")}
                  className={cn(
                    "p-3 border-2 rounded-lg text-center transition-all",
                    watchMode === "BOTH"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  )}
                >
                  <Users
                    className={cn(
                      "w-5 h-5 mx-auto mb-1",
                      watchMode === "BOTH"
                        ? "text-purple-600"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Both
                  </p>
                </button>
              </div>
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Participants
              </label>
              {/* <Input
                {...register("maxParticipants", { valueAsNumber: true })}
                type="number"
                label="Max Participants"
                placeholder="10"
                min={2}
                max={100}
                error={errors.maxParticipants?.message}
              /> */}

              <select
                {...register("maxParticipants", { valueAsNumber: true })}
                defaultValue={10}
                className="w-[180px] rounded-md border border-gray-300 dark:border-gray-700 
             bg-gray-50 dark:bg-gray-800 p-2 text-sm"
              >
                {Array.from({ length: 99 }, (_, i) => i + 2).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum number of users who can join this room
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-gray-300 dark:border-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Create Room
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
