"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { friendApi } from "@/lib/api/friendApi";
import { Users, UserPlus, Clock, Ban } from "lucide-react";

import FriendsTabs from "./FriendsTabs";
import ErrorBanner from "./ErrorBanner";
import FriendCard from "./FriendCard";
import UserSearchCard from "./UserSearchCard";
import SearchInput from "./SearchInput";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

import { Friend, FriendEntry, User } from "@/types";
import { useFriends } from "@/contexts/FriendContext"; // updated import
import toast from "react-hot-toast";

export type FriendsTab = "all" | "pending" | "blocked" | "add";

interface FriendsPanelProps {
  onSelectFriend?: (friend: User) => void;
}

export default function FriendsPanel({ onSelectFriend }: FriendsPanelProps) {
  const { user } = useAuth();
  const { friends, listFriends, pending, listPendingRequests } = useFriends(); // use context
  const [activeTab, setActiveTab] = useState<FriendsTab>("all");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [defaultUsers, setDefaultUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [error, setError] = useState("");

  const tabs: { id: FriendsTab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    {
      id: "all",
      label: "All",
      icon: Users,
      count: friends.filter((f: FriendEntry) => f.status === "ACCEPTED").length,
    },
    {
      id: "pending",
      label: "Pending",
      icon: Clock,
      count: pending.length,
    },
    // {
    //   id: "blocked",
    //   label: "Blocked",
    //   icon: Ban,
    //   count: friends.filter((f: Friend) => f.status === "BLOCKED").length,
    // },
    { id: "add", label: "Add", icon: UserPlus, count: 0 },
  ];

  // load friends once
  useEffect(() => {
    listFriends();
  }, [listFriends]);

  useEffect(() => {
    listPendingRequests();
  }, [listPendingRequests]);

  // Load default users when "add" tab is selected and clear search when switching tabs
  useEffect(() => {
    if (activeTab !== "add") {
      setSearchTerm("");
      setSearchResults([]);
    } else if (activeTab === "add" && defaultUsers.length === 0) {
      loadDefaultUsers();
    }
    setError(""); // Clear any errors when switching tabs
  }, [activeTab]);

  const loadDefaultUsers = async () => {
    setLoadingDefaults(true);
    try {
      const users = await friendApi.getRandomUsers(20);
      // Filter out current user and existing friends
      const existingFriendIds: string[] = friends.map((f: FriendEntry) => f.friend.id);
      const filteredUsers = users.filter(
        (u) => u.id !== user?.id && !existingFriendIds.includes(u.id)
      );
      setDefaultUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to load default users:", error);
    } finally {
      setLoadingDefaults(false);
    }
  };

  // Auto-search when search term changes
  useEffect(() => {
    if (activeTab === "add") {
      const timeoutId = setTimeout(() => {
        if (searchTerm.trim().length >= 2) {
          handleSearch();
        } else if (searchTerm.trim().length === 0) {
          setSearchResults([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, activeTab]);

  const handleRespond = async (
    friendshipId: string,
    action: "accept" | "decline"
  ) => {
    try {
      if (action === "accept") {
        await friendApi.acceptRequest(friendshipId);
        toast.success("Friend request accepted!");
      } else {
        await friendApi.declineRequest(friendshipId);
        toast.success("Friend request declined");
      }
      listFriends(); // refresh
      listPendingRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message =
        err.response?.data?.message || `Failed to ${action} friend request`;
      setError(message);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      await friendApi.removeFriend(friendshipId);
      toast.success("Friend removed");
      listFriends(); // refresh
      listPendingRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message =
        err.response?.data?.message || "Failed to remove friend";
      setError(message);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendApi.sendFriendRequest(userId);
      toast.success("Friend request sent!");

      // Remove user from search results and default users
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      setDefaultUsers((prev) => prev.filter((u) => u.id !== userId));

      listFriends(); // refresh to show new pending request
      listPendingRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      if (err.response?.status === 409) {
        setError("Friend request already exists");
      } else {
        setError("Failed to send friend request");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await friendApi.searchUser(searchTerm);
      // Filter out current user and existing friends
      const existingFriendIds: string[] = friends.map((f: FriendEntry) => f.friend.id);
      const filteredUsers = users.filter(
        (u) => u.id !== user?.id && !existingFriendIds.includes(u.id)
      );
      setSearchResults(filteredUsers);
    } catch {
      setError("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (activeTab === "add") {
      return (
        <div className="p-4 space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
            onSearch={handleSearch}
          />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-2">
              {searchTerm.trim() ? (
                // Search results section
                searchResults.length === 0 ? (
                  <EmptyState icon={UserPlus} message="No users found" />
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground px-2">
                      Search Results
                    </h3>
                    {searchResults.map((user) => (
                      <UserSearchCard
                        key={user.id}
                        searchUser={user}
                        onSendRequest={handleSendRequest}
                      />
                    ))}
                  </>
                )
              ) : loadingDefaults ? (
                <LoadingSpinner />
              ) : defaultUsers.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  message="No suggested users available"
                />
              ) : (
                // Suggested users section
                <>
                  <h3 className="text-sm font-medium text-muted-foreground px-2">
                    Suggested Users
                  </h3>
                  {defaultUsers.map((user) => (
                    <UserSearchCard
                      key={user.id}
                      searchUser={user}
                      onSendRequest={handleSendRequest}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    let filteredFriendEntries: FriendEntry[] = [];
    let emptyMessage = "No friends to show";

    if (activeTab === "pending") {
      // Convert Friend[] to FriendEntry[] format for pending
      filteredFriendEntries = pending.map((p: Friend) => ({
        friendshipId: p.id,
        status: p.status,
        friend: p.requester.id === user?.id ? p.receiver : p.requester,
        senderId: p.requesterId,
        receiverId: p.receiverId,
      }));
      emptyMessage = "No pending friend requests";
    } else if (activeTab === "blocked") {
      filteredFriendEntries = friends.filter((f: FriendEntry) => f.status === "BLOCKED");
      emptyMessage = "No blocked users";
    } else if (activeTab === "all") {
      filteredFriendEntries = friends.filter((f: FriendEntry) => f.status === "ACCEPTED");
      emptyMessage = "No friends yet";
    }

    if (filteredFriendEntries.length === 0) {
      return (
        <div className="p-4">
          <EmptyState icon={Users} message={emptyMessage} />
        </div>
      );
    }

    return (
      <div className="p-4 space-y-2">
        {filteredFriendEntries.map((f: FriendEntry) => (
          <FriendCard
            key={f.friendshipId}
            friendship={f}
            currentUser={user}
            onRespond={handleRespond}
            onRemove={handleRemove}
            onMessage={(friend) => onSelectFriend?.(friend)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <FriendsTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <ErrorBanner message={error} onClose={() => setError("")} />
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
}
