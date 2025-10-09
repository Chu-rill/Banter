import {
  JoinRequest,
  JoinRequestResponse,
  Room,
  RoomResponse,
  RoomsResponse,
} from "@/types";
import api from "../api";
import { useState } from "react";
import { roomSocketApi } from "@/lib/socket/roomSocketApi";

export const roomApi = {
  getRooms: async (): Promise<Room[]> => {
    const { data } = await api.get("/rooms");
    const roomsData = data as RoomResponse;

    let roomArray: Room[] = [];
    if (Array.isArray(roomsData.data)) {
      roomArray = roomsData.data as Room[];
    } else if ("rooms" in roomsData.data) {
      roomArray = roomsData.data.rooms as Room[];
    } else if ("id" in roomsData.data) {
      roomArray = [roomsData.data as Room];
    }
    return roomArray;
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
  }): Promise<Room> => {
    const socket = roomSocketApi.createRoom(roomData);
    return socket;
  },

  joinRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/join`);
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    await api.delete(`/rooms/${roomId}/leave`);
  },

  updateRoom: async (
    id: string,
    updates: Partial<Room>
  ): Promise<RoomResponse> => {
    const { data } = await api.patch(`/rooms/admin/${id}`, updates);
    return data;
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    await api.delete(`/rooms/admin/${roomId}`);
  },

  removeMember: async (roomId: string, userId: string): Promise<void> => {
    await api.post(`/rooms/admin/${roomId}/kick/${userId}`);
  },

  loadJoinRequests: async (roomId: string): Promise<JoinRequestResponse> => {
    const { data } = await api.get(`/rooms/admin/${roomId}/join-requests`);
    // console.log("Join requests response:", data);
    return data;
  },

  approveJoinRequest: async (requestId: string): Promise<void> => {
    await api.post(`/rooms/admin/join-requests/${requestId}/approve`);
  },

  denyJoinRequest: async (requestId: string): Promise<void> => {
    await api.post(`/rooms/admin/join-requests/${requestId}/deny`);
  },

  requestToJoinRoom: async (roomId: string): Promise<void> => {
    await api.post(`/rooms/${roomId}/request-join`);
  },
};
