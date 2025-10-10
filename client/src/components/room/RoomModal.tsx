"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Room } from "@/types";
import JoinRoom from "./JoinRoom";
import CreateRoom from "./CreateRoom";
import { Button } from "@/components/ui/Button";

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
  const [mode, setMode] = useState<"create" | "join">("create");

  const handleClose = () => {
    setMode("create");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md transform transition-all">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
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

          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
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

          {/* Body */}
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
