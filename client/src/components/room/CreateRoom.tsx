"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Lock, Check, AlertCircle } from "lucide-react";
import { roomApi } from "@/lib/api/roomApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Room } from "@/types";
import toast from "react-hot-toast";

const createRoomSchema = z.object({
  name: z
    .string()
    .min(3, "Room name must be at least 3 characters")
    .max(50, "Room name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Only letters, numbers, spaces, - and _ allowed"
    ),
  description: z.string().max(200).optional(),
  type: z.enum(["PUBLIC", "PRIVATE"]),
  mode: z.enum(["CHAT", "VIDEO", "BOTH"]),
  maxParticipants: z.number().min(2).max(100),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

interface CreateRoomProps {
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

export default function CreateRoom({
  onClose,
  onRoomCreated,
}: CreateRoomProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      type: "PUBLIC",
      mode: "BOTH",
      maxParticipants: 10,
    },
  });

  const watchType = watch("type");

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      setError("");
      setIsSubmitting(true);

      const room = await roomApi.createRoom(data);
      const created = Array.isArray(room.data)
        ? room.data[0]
        : "rooms" in room.data
        ? room.data
        : room.data;

      onRoomCreated(created);
      toast.success("Room Created!");
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Room Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Room Name</label>
        <Input
          {...register("name")}
          placeholder="Enter room name"
          error={errors.name?.message}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Input
          {...register("description")}
          placeholder="What's this room about?"
          error={errors.description?.message}
        />
      </div>

      {/* Room Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Room Type</label>
        <div className="grid grid-cols-2 gap-3">
          {(["PUBLIC", "PRIVATE"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue("type", type)}
              className={cn(
                "p-4 border-2 rounded-xl text-left transition-all",
                watchType === type
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    watchType === type
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  {type === "PUBLIC" ? (
                    <Globe className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {type === "PUBLIC" ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {type === "PUBLIC" ? "Anyone can join" : "Invite only"}
                  </p>
                </div>
                {watchType === type && (
                  <Check className="w-4 h-4 text-purple-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Max Participants */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Max Participants</label>
        <select
          {...register("maxParticipants", { valueAsNumber: true })}
          defaultValue={10}
          className="w-[180px] rounded-md border p-2 text-sm"
        >
          {Array.from({ length: 99 }, (_, i) => i + 2).map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
        >
          Create Room
        </Button>
      </div>
    </form>
  );
}
