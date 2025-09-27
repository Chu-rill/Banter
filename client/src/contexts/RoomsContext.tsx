"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { roomApi } from "@/lib/api/room";
import { Room } from "@/types";

interface RoomProviderProps {
  children: ReactNode;
}
interface RoomsContextType {
  rooms: Room[];
  loadRooms: () => Promise<void>;
}

const RoomsContext = createContext<any | null>(null);

export function RoomsProvider({ children }: RoomProviderProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await roomApi.getRooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to load rooms:", error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <RoomsContext.Provider value={{ rooms, loadRooms }}>
      {children}
    </RoomsContext.Provider>
  );
}

export function useRooms() {
  return useContext(RoomsContext);
}
