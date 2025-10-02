import { Friend, FriendEntry, User, UserResponse } from "@/types";
import api from "../api";

export const friendApi = {
  getFriends: async (): Promise<FriendEntry[]> => {
    const response = await api.get("/friends/me");
    response.data;
    return response.data.data;
  },

  sendFriendRequest: async (receiverId: string): Promise<Friend> => {
    const { data } = await api.post(`/friends/${receiverId}`);
    return data;
  },

  getPendingRequests: async (): Promise<Friend[]> => {
    const { data } = await api.get("/friends/requests");
    return data.data;
  },

  acceptRequest: async (friendshipId: string): Promise<Friend> => {
    const { data } = await api.patch(`/friends/${friendshipId}/accept`);
    return data;
  },

  declineRequest: async (friendshipId: string): Promise<Friend> => {
    const { data } = await api.patch(`/friends/${friendshipId}/decline`);
    return data;
  },

  removeFriend: async (friendshipId: string): Promise<void> => {
    await api.delete(`/friends/${friendshipId}`);
  },

  searchUser: async (query: string): Promise<User[]> => {
    const { data } = await api.get(
      `/users?username=${encodeURIComponent(query)}`
    );
    return Array.isArray(data.data) ? data.data : [data.data];
  },

  getRandomUsers: async (limit: number = 10): Promise<User[]> => {
    const { data } = await api.get(`/users?limit=${limit}`);
    return Array.isArray(data.data) ? data.data : [data.data];
  },
};
