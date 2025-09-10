import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { Message, User } from "./api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private messageSocket: Socket | null = null;
  private callSocket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Initialize main socket connection
  connect() {
    const token = Cookies.get("authToken");
    if (!token) return null;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to main socket server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from main socket server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return this.socket;
  }

  // Initialize messaging socket
  connectToMessages() {
    const token = Cookies.get("authToken");
    if (!token) return null;

    this.messageSocket = io(`${SOCKET_URL}/messages`, {
      auth: { token },
      autoConnect: true,
    });

    this.messageSocket.on("connect", () => {
      console.log("Connected to messaging server");
    });

    this.messageSocket.on("disconnect", () => {
      console.log("Disconnected from messaging server");
    });

    this.messageSocket.on("error", (error) => {
      console.error("Messaging socket error:", error);
    });

    // Handle incoming messages
    this.messageSocket.on(
      "new-message",
      (message: Message & { isOwn: boolean }) => {
        this.emit("message-received", message);
      }
    );

    // Handle message sent confirmation
    this.messageSocket.on(
      "message-sent",
      (message: Message & { isOwn: boolean }) => {
        this.emit("message-sent", message);
      }
    );

    // Handle typing indicators
    this.messageSocket.on(
      "user-typing",
      (data: { userId: string; username: string; roomId: string }) => {
        this.emit("user-typing", data);
      }
    );

    this.messageSocket.on(
      "user-stopped-typing",
      (data: { userId: string; roomId: string }) => {
        this.emit("user-stopped-typing", data);
      }
    );

    // Handle read receipts
    this.messageSocket.on(
      "messages-read",
      (data: { userId: string; roomId: string; lastMessageId: string }) => {
        this.emit("messages-read", data);
      }
    );

    // Handle user presence
    this.messageSocket.on(
      "user-joined-room",
      (data: { userId: string; roomId: string; timestamp: Date }) => {
        this.emit("user-joined-room", data);
      }
    );

    this.messageSocket.on(
      "user-left-room",
      (data: { userId: string; roomId: string; timestamp: Date }) => {
        this.emit("user-left-room", data);
      }
    );

    // Handle friend status changes
    this.messageSocket.on(
      "friend-status-change",
      (data: { userId: string; isOnline: boolean; timestamp: Date }) => {
        this.emit("friend-status-change", data);
      }
    );

    return this.messageSocket;
  }

  // Initialize call socket
  connectToCall() {
    const token = Cookies.get("authToken");
    if (!token) return null;

    this.callSocket = io(`${SOCKET_URL}/call`, {
      auth: { token },
      autoConnect: true,
    });

    this.callSocket.on("connect", () => {
      console.log("Connected to call server");
    });

    this.callSocket.on("disconnect", () => {
      console.log("Disconnected from call server");
    });

    this.callSocket.on("error", (error) => {
      console.error("Call socket error:", error);
    });

    // Handle call events
    this.callSocket.on("call-joined", (data) => {
      this.emit("call-joined", data);
    });

    this.callSocket.on("user-joined", (data) => {
      this.emit("user-joined-call", data);
    });

    this.callSocket.on("user-left", (data) => {
      this.emit("user-left-call", data);
    });

    this.callSocket.on("call-ended", (data) => {
      this.emit("call-ended", data);
    });

    // Handle WebRTC signaling
    this.callSocket.on("webrtc-offer", (data) => {
      this.emit("webrtc-offer", data);
    });

    this.callSocket.on("webrtc-answer", (data) => {
      this.emit("webrtc-answer", data);
    });

    this.callSocket.on("webrtc-ice-candidate", (data) => {
      this.emit("webrtc-ice-candidate", data);
    });

    // Handle media state changes
    this.callSocket.on("media-state-changed", (data) => {
      this.emit("media-state-changed", data);
    });

    this.callSocket.on("screen-share-started", (data) => {
      this.emit("screen-share-started", data);
    });

    this.callSocket.on("screen-share-stopped", (data) => {
      this.emit("screen-share-stopped", data);
    });

    return this.callSocket;
  }

  // Messaging methods
  joinRoom(roomId: string) {
    if (this.messageSocket) {
      this.messageSocket.emit("join-room", { roomId });
    }
  }

  leaveRoom(roomId: string) {
    if (this.messageSocket) {
      this.messageSocket.emit("leave-room", { roomId });
    }
  }

  sendMessage(messageData: {
    roomId: string;
    content?: string;
    type?: "TEXT" | "MEDIA" | "VOICE";
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  }) {
    if (this.messageSocket) {
      this.messageSocket.emit("send-message", messageData);
    }
  }

  startTyping(roomId: string) {
    if (this.messageSocket) {
      this.messageSocket.emit("typing-start", { roomId });
    }
  }

  stopTyping(roomId: string) {
    if (this.messageSocket) {
      this.messageSocket.emit("typing-stop", { roomId });
    }
  }

  markMessagesRead(roomId: string, lastMessageId: string) {
    if (this.messageSocket) {
      this.messageSocket.emit("mark-messages-read", { roomId, lastMessageId });
    }
  }

  getRoomMessages(roomId: string, limit = 50, cursor?: string) {
    if (this.messageSocket) {
      this.messageSocket.emit("get-room-messages", { roomId, limit, cursor });
    }
  }

  // Call methods
  joinCall(
    roomId: string,
    mediaState: { video: boolean; audio: boolean; screen: boolean }
  ) {
    if (this.callSocket) {
      this.callSocket.emit("join-call", { roomId, mediaState });
    }
  }

  leaveCall(roomId: string) {
    if (this.callSocket) {
      this.callSocket.emit("leave-call", { roomId });
    }
  }

  sendWebRTCOffer(
    roomId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit
  ) {
    if (this.callSocket) {
      this.callSocket.emit("webrtc-offer", { roomId, targetUserId, offer });
    }
  }

  sendWebRTCAnswer(
    roomId: string,
    callerId: string,
    answer: RTCSessionDescriptionInit
  ) {
    if (this.callSocket) {
      this.callSocket.emit("webrtc-answer", { roomId, callerId, answer });
    }
  }

  sendWebRTCIceCandidate(
    roomId: string,
    targetUserId: string,
    candidate: RTCIceCandidateInit
  ) {
    if (this.callSocket) {
      this.callSocket.emit("webrtc-ice-candidate", {
        roomId,
        targetUserId,
        candidate,
      });
    }
  }

  updateMediaState(
    roomId: string,
    mediaState: { video: boolean; audio: boolean; screen: boolean }
  ) {
    if (this.callSocket) {
      this.callSocket.emit("media-state-change", { roomId, mediaState });
    }
  }

  startScreenShare(roomId: string) {
    if (this.callSocket) {
      this.callSocket.emit("start-screen-share", { roomId });
    }
  }

  stopScreenShare(roomId: string) {
    if (this.callSocket) {
      this.callSocket.emit("stop-screen-share", { roomId });
    }
  }

  endCall(roomId: string) {
    if (this.callSocket) {
      this.callSocket.emit("call-end", { roomId });
    }
  }

  // Event listener management
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(...args));
    }
  }

  // Disconnect all sockets
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.messageSocket) {
      this.messageSocket.disconnect();
      this.messageSocket = null;
    }
    if (this.callSocket) {
      this.callSocket.disconnect();
      this.callSocket = null;
    }
    this.listeners.clear();
  }

  // Get socket instances
  getSocket() {
    return this.socket;
  }

  getMessageSocket() {
    return this.messageSocket;
  }

  getCallSocket() {
    return this.callSocket;
  }

  // Check connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  isMessageSocketConnected() {
    return this.messageSocket?.connected || false;
  }

  isCallSocketConnected() {
    return this.callSocket?.connected || false;
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
