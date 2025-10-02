"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Friend } from "@/types";
import { friendApi } from "@/lib/api/friendApi";

interface FriendProviderProps {
  children: ReactNode;
}
interface RoomsContextType {
  friends: Friend[];
  loadRooms: () => Promise<void>;
}

const FriendContext = createContext<any | null>(null);

export function FriendProvider({ children }: FriendProviderProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  const listFriends = useCallback(async () => {
    try {
      setLoading(true);
      const data = await friendApi.getFriends();
      setFriends(data);
    } catch (error) {
      console.error("Failed to friends:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const listPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await friendApi.getPendingRequests();
      setPending(data);
    } catch (error) {
      console.error("Failed to pending requests:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FriendContext.Provider
      value={{ friends, listFriends, pending, listPendingRequests }}
    >
      {children}
    </FriendContext.Provider>
  );
}

export function useFriends() {
  return useContext(FriendContext);
}
