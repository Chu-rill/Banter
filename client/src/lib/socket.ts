// lib/services/SocketService.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

class SocketService {
  private roomMessageSocket: Socket | null = null;
  private directMessageSocket: Socket | null = null;

  connectRoomMessages(token: string) {
    // console.log("Connecting to room messages socket...");
    this.roomMessageSocket = io(`${SOCKET_URL}/room-messages`, {
      auth: { token },
      autoConnect: true,
    });
    // console.log("Connected to room messages socket:", this.roomMessageSocket);

    // Handle reconnect
    this.roomMessageSocket.on("connect", async () => {
      console.log("Room messages socket connected");

      // Ask backend for all rooms this user is in
      this.roomMessageSocket?.emit("get-user-rooms", {}, (rooms: string[]) => {
        rooms.forEach((roomId) => {
          this.roomMessageSocket?.emit("join-room", { roomId });
        });
      });
    });
  }

  connectDirectMessages(token: string) {
    this.directMessageSocket = io(`${SOCKET_URL}/direct-messages`, {
      auth: { token },
      autoConnect: true,
    });
  }

  getRoomMessageSocket() {
    return this.roomMessageSocket;
  }

  getDirectMessageSocket() {
    return this.directMessageSocket;
  }

  disconnect() {
    this.roomMessageSocket?.disconnect();
    this.directMessageSocket?.disconnect();
  }
}

export const socketService = new SocketService();
