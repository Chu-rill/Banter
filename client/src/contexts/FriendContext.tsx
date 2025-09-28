"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { roomApi } from "@/lib/api/roomApi";
import { Room } from "@/types";

interface FriendProviderProps {
  children: ReactNode;
}
interface RoomsContextType {
  rooms: Room[];
  loadRooms: () => Promise<void>;
}

const FriendContext = createContext<any | null>(null);

export function RoomsProvider({ children }: FriendProviderProps) {
  const [friends, setFriends] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const friendsRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomApi.getRooms();
      setFriends(data);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FriendContext.Provider value={{ friends, friendsRooms }}>
      {children}
    </FriendContext.Provider>
  );
}

export function useRooms() {
  return useContext(FriendContext);
}
