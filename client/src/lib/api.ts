import {
  AuthResponse,
  Friend,
  Message,
  Room,
  RoomResponse,
  User,
  UserResponse,
} from "@/types";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Centralized token storage utilities (same as in AuthContext)
const TokenStorage = {
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    }
  },
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = TokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      TokenStorage.removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    if (data.token) {
      TokenStorage.setToken(data.token);
    }
    return data;
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const { data } = await api.post("/auth/register", {
        username,
        password,
        email,
      });
      return data;
    } catch (error: any) {
      console.error("API Error Response:", {
        data: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      TokenStorage.removeToken();
    }
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const { data } = await api.get("/users/me");
    if (typeof window !== "undefined") {
      localStorage.setItem("userData", JSON.stringify(data.data));
    }
    return data;
  },

  refreshToken: async () => {
    const { data } = await api.post("/auth/refresh");
    if (data.token) {
      TokenStorage.setToken(data.token);
    }
    return data;
  },

  // verifyEmail: async (token: string) => {
  //   const { data } = await api.get(`/auth/verify-email?token=${token}`);
  //   console.log("verifyEmail response", data);

  //   if (data.token) {
  //     TokenStorage.setToken(data.token);
  //   }
  //   return data;
  // },

  resendVerificationEmail: async (email: string) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  },

  googleAuth: () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    window.location.href = `${backendUrl}/oauth/google`;
  },
};

// Room API
export const roomApi = {
  getRooms: async (): Promise<RoomResponse> => {
    const { data } = await api.get("/rooms");
    // Handle different possible response structures
    return data;
  },

  getRoom: async (roomId: string): Promise<RoomResponse> => {
    const { data } = await api.get(`/rooms/${roomId}`);
    return data;
  },

  createRoom: async (roomData: {
    name: string;
    description?: string;
    type: "PUBLIC" | "PRIVATE";
    mode: "CHAT" | "VIDEO" | "BOTH";
    maxParticipants?: number;
  }): Promise<RoomResponse> => {
    const { data } = await api.post("/rooms", roomData);
    return data;
  },

  joinRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/join`);
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/leave`);
  },

  updateRoom: async (
    roomId: string,
    updates: Partial<Room>
  ): Promise<RoomResponse> => {
    const { data } = await api.patch(`/rooms/${roomId}`, updates);
    return data;
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    await api.delete(`/rooms/${roomId}`);
  },
};

// Message API
export const messageApi = {
  getRoomMessages: async (
    roomId: string,
    limit = 50,
    cursor?: string
  ): Promise<Message[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const { data } = await api.get(`/messages/room/${roomId}?${params}`);
    return data;
  },

  sendMessage: async (messageData: {
    roomId: string;
    content?: string;
    type?: "TEXT" | "MEDIA" | "VOICE";
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  }): Promise<Message> => {
    const { data } = await api.post("/messages", messageData);
    return data;
  },

  markMessagesRead: async (
    roomId: string,
    lastMessageId: string
  ): Promise<void> => {
    await api.patch("/messages/read", { roomId, lastMessageId });
  },
};

// Friend API
export const friendApi = {
  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get("/friendship/me");
    // Handle different possible response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.friends)) {
      return response.data.friends;
    } else {
      console.error("Unexpected friends response structure:", response.data);
      return [];
    }
  },

  sendFriendRequest: async (receiverId: string): Promise<Friend> => {
    const { data } = await api.post("/friends/request", { receiverId });
    return data;
  },

  respondToFriendRequest: async (
    friendshipId: string,
    action: "accept" | "decline"
  ): Promise<Friend> => {
    const { data } = await api.patch(`/friends/${friendshipId}/${action}`);
    return data;
  },

  removeFriend: async (friendshipId: string): Promise<void> => {
    await api.delete(`/friends/${friendshipId}`);
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(
      `/users/search?q=${encodeURIComponent(query)}`
    );
    // Handle different possible response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.users)) {
      return response.data.users;
    } else {
      console.error(
        "Unexpected search users response structure:",
        response.data
      );
      return [];
    }
  },
};

// Call API
export const callApi = {
  startCall: async (roomId: string, type: "video" | "audio" = "video") => {
    const { data } = await api.post("/call/start", { roomId, type });
    return data;
  },

  endCall: async (callSessionId: string, duration: number) => {
    const { data } = await api.post("/call/end", { callSessionId, duration });
    return data;
  },

  getCallHistory: async (page = 1, limit = 10) => {
    const { data } = await api.get(`/call/history?page=${page}&limit=${limit}`);
    return data;
  },

  getCallStats: async () => {
    const { data } = await api.get("/call/stats");
    return data;
  },
};

// Upload API
export const uploadApi = {
  uploadFile: async (file: File, roomId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (roomId) formData.append("roomId", roomId);

    const { data } = await api.post("/upload/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const { data } = await api.post("/upload/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  getMyUploads: async (page = 1, limit = 20) => {
    const { data } = await api.get(
      `/upload/my-uploads?page=${page}&limit=${limit}`
    );
    return data;
  },

  deleteUpload: async (uploadId: string) => {
    await api.delete(`/upload/${uploadId}`);
  },
};

export default api;
