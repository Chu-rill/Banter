import {
  AuthResponse,
  Friend,
  Message,
  MessageResponse,
  Room,
  RoomResponse,
  RoomsResponse,
  User,
  UserResponse,
} from "@/types";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Centralized token storage utilities (same as in AuthContext)
export const TokenStorage = {
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

  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  },

  setRefreshToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", token);
    }
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
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

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Response interceptor to handle auth errors and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh if this IS the refresh request or if we've already retried
    if (
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest._retry ||
      error.response?.status !== 401
    ) {
      // If it's a 401 and not a refresh request, clear tokens and redirect
      if (error.response?.status === 401 && !originalRequest.url?.includes("/auth/refresh")) {
        TokenStorage.removeToken();
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = TokenStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("Attempting to refresh access token...");

      // Call refresh endpoint using base axios (not the intercepted instance)
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Refresh response:", response.data);

      const { data } = response;

      if (data?.data?.token && data?.data?.refreshToken) {
        console.log("Token refreshed successfully");
        TokenStorage.setToken(data.data.token);
        TokenStorage.setRefreshToken(data.data.refreshToken);

        // Update authorization header
        api.defaults.headers.common["Authorization"] = `Bearer ${data.data.token}`;
        originalRequest.headers.Authorization = `Bearer ${data.data.token}`;

        // Notify all waiting requests
        onTokenRefreshed(data.data.token);

        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);
      isRefreshing = false;
      refreshSubscribers = [];

      // Refresh failed, redirect to login
      TokenStorage.removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    }
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
    if (data.refreshToken) {
      TokenStorage.setRefreshToken(data.refreshToken);
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

  refreshToken: async (refreshToken: string) => {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    if (data?.data?.token) {
      TokenStorage.setToken(data.data.token);
    }
    if (data?.data?.refreshToken) {
      TokenStorage.setRefreshToken(data.data.refreshToken);
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

// Message API
export const messageApi = {
  getRoomMessages: async (
    roomId: string,
    limit = 50,
    cursor?: string
  ): Promise<MessageResponse> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    const { data } = await api.get(`/rooms/${roomId}/messages`);
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
