"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { friendApi } from "@/lib/api/friendApi";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Clock,
  Ban,
} from "lucide-react";

import FriendsTabs from "./FriendsTabs";
import ErrorBanner from "./ErrorBanner";
import FriendCard from "./FriendCard";
import UserSearchCard from "./UserSearchCard";
import SearchInput from "./SearchInput";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

import { Friend, User } from "@/types";

export type FriendsTab = "all" | "pending" | "blocked" | "add";

export default function FriendsPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FriendsTab>("all");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tabs: { id: FriendsTab; label: string; icon: any; count: number }[] = [
    { id: "all", label: "All", icon: Users, count: friends.length },
    {
      id: "pending",
      label: "Pending",
      icon: Clock,
      count: friends.filter((f) => f.status === "PENDING").length,
    },
    {
      id: "blocked",
      label: "Blocked",
      icon: Ban,
      count: friends.filter((f) => f.status === "BLOCKED").length,
    },
    { id: "add", label: "Add", icon: UserPlus, count: 0 },
  ];

  // fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await friendApi.getFriends();
        setFriends(res);
      } catch {
        setError("Failed to load friends");
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const handleRespond = async (
    friendshipId: string,
    action: "accept" | "decline"
  ) => {
    try {
      if (action === "accept") {
        await friendApi.acceptRequest(friendshipId);
      } else {
        await friendApi.declineRequest(friendshipId);
      }
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } catch {
      setError("Failed to respond to friend request");
    }
  };

  const handleRemove = async (friendshipId: string) => {
    try {
      await friendApi.removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } catch {
      setError("Failed to remove friend");
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      const data = await friendApi.sendFriendRequest(userId);
      // setSearchResults(data);
    } catch {
      setError("Failed to send request");
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const res = await friendApi.searchUser(searchTerm);
      const data = Array.isArray(res) ? res : [res];
      setSearchResults(data);
    } catch {
      setError("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return <LoadingSpinner />;

    if (activeTab === "add") {
      return (
        <div className="p-4 space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users..."
            onSearch={handleSearch}
          />
          <div className="space-y-2">
            {searchResults.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                message="Search to find new friends"
              />
            ) : (
              searchResults.map((user) => (
                <UserSearchCard
                  key={user.id}
                  searchUser={user}
                  onSendRequest={handleSendRequest}
                />
              ))
            )}
          </div>
        </div>
      );
    }

    const filteredFriends = friends.filter(
      (f) => f.status === activeTab.toUpperCase() || activeTab === "all"
    );
    if (filteredFriends.length === 0) {
      return <EmptyState icon={Users} message="No friends to show" />;
    }

    return (
      <div className="space-y-2">
        {filteredFriends.map((f) => (
          <FriendCard
            key={f.id}
            friendship={f}
            currentUser={user}
            onRespond={handleRespond}
            onRemove={handleRemove}
            onMessage={(friend) => console.log("Message", friend)}
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
      <div className="flex-1 overflow-y-auto p-4">
        {error && <ErrorBanner message={error} onClose={() => setError("")} />}
        {renderContent()}
      </div>
    </div>
  );
}
