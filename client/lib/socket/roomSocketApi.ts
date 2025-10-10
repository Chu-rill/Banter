// lib/socket/roomSocketApi.ts
import { socketService } from "@/lib/socket";
import { Room } from "@/types";

export const roomSocketApi = {
  createRoom: (data: {
    name: string;
    description?: string;
    type: "PUBLIC" | "PRIVATE";
    mode: "CHAT" | "VIDEO" | "BOTH";
    maxParticipants?: number;
  }): Promise<Room> => {
    return new Promise((resolve, reject) => {
      const socket = socketService.getRoomMessageSocket();
      if (!socket) return reject("Socket not connected");

      socket.emit("create-room", data);

      socket.once("room-created", (response) => {
        if (response?.success === false) {
          reject(response);
        } else {
          resolve(response.data || response);
        }
      });

      socket.once("create:error", (error) => {
        reject(error);
      });
    });
  },

  joinRoom: (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = socketService.getRoomMessageSocket();
      if (!socket) return reject("Socket not connected");

      socket.emit("join-room", { roomId });

      socket.once("room-joined", () => resolve());
      socket.once("join:error", (err) => reject(err));
    });
  },

  leaveRoom: (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = socketService.getRoomMessageSocket();
      if (!socket) return reject("Socket not connected");

      socket.emit("leave-room", { roomId });
      socket.once("room-left", () => resolve());
      socket.once("leave:error", (err) => reject(err));
    });
  },
};
