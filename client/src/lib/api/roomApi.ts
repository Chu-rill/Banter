import { Room, RoomResponse, RoomsResponse } from "@/types";
import api from "../api";
import { useState } from "react";

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
  }): Promise<RoomResponse> => {
    const { data } = await api.post("/rooms", roomData);
    return data;
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
};
