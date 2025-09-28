import { Friend, UserResponse } from "@/types";
import api from "../api";

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

  searchUser: async (query: string): Promise<UserResponse> => {
    const { data } = await api.get(
      `/users?username=${encodeURIComponent(query)}`
    );

    return data;
  },
};
