"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  MessageCircle,
  Search,
  MoreVertical,
  Check,
  X,
  Clock,
  Ban,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { friendApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, formatTimeAgo } from "@/lib/utils";
import { Friend, User } from "@/types";

interface FriendsPanelProps {
  onStartDirectMessage?: (friend: User) => void;
}

type FriendsTab = "all" | "pending" | "blocked" | "add";

export default function FriendsPanel({
  onStartDirectMessage,
}: FriendsPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FriendsTab>("all");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (activeTab === "add" && searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await friendApi.getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error("Failed to load friends:", error);
      setError("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const results = await friendApi.searchUsers(searchQuery.trim());
      // Filter out current user and existing friends
      const filteredResults = results.filter(
        (u) =>
          u.id !== user?.id &&
          !friends.some(
            (f) =>
              (f.requesterId === u.id || f.receiverId === u.id) &&
              f.status !== "DECLINED"
          )
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const newFriend = await friendApi.sendFriendRequest(userId);
      setFriends((prev) => [...prev, newFriend]);
      // Remove from search results
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      console.error("Failed to send friend request:", error);
      setError(
        error.response?.data?.message || "Failed to send friend request"
      );
    }
  };

  const respondToFriendRequest = async (
    friendshipId: string,
    action: "accept" | "decline"
  ) => {
    try {
      if (action === "accept") {
        const updatedFriend = await friendApi.respondToFriendRequest(
          friendshipId,
          "accept"
        );
        setFriends((prev) =>
          prev.map((f) => (f.id === friendshipId ? updatedFriend : f))
        );
      } else {
        const updatedFriend = await friendApi.respondToFriendRequest(
          friendshipId,
          "decline"
        );
        setFriends((prev) =>
          prev.map((f) => (f.id === friendshipId ? updatedFriend : f))
        );
      }
    } catch (error: any) {
      console.error("Failed to respond to friend request:", error);
      setError(
        error.response?.data?.message || "Failed to respond to friend request"
      );
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      await friendApi.removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    } catch (error: any) {
      console.error("Failed to remove friend:", error);
      setError(error.response?.data?.message || "Failed to remove friend");
    }
  };

  const getFilteredFriends = () => {
    if (!Array.isArray(friends)) return [];

    switch (activeTab) {
      case "all":
        return friends.filter((f) => f.status === "ACCEPTED");
      case "pending":
        return friends.filter((f) => f.status === "PENDING");
      case "blocked":
        return friends.filter((f) => f.status === "BLOCKED");
      default:
        return [];
    }
  };

  // Helper function to safely get character
  const getInitial = (username?: string) => {
    if (username && typeof username === "string" && username.length > 0) {
      return username.charAt(0).toUpperCase();
    }
    return "?";
  };

  const renderFriendCard = (friendship: Friend) => {
    const isReceiver = friendship.receiverId === user?.id;
    const friend = isReceiver ? friendship.requester : friendship.receiver;
    const isPending = friendship.status === "PENDING";
    const isBlocked = friendship.status === "BLOCKED";
    const canRespond = isPending && isReceiver;

    return (
      <div
        key={friendship.id}
        className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            {friend?.avatar ? (
              <img
                src={friend.avatar}
                alt={friend?.username || "User"}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {getInitial(friend?.username)}
              </div>
            )}

            {friendship.status === "ACCEPTED" && (
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
                  friend?.isOnline ? "bg-green-500" : "bg-gray-400"
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground truncate">
                {friend?.username || "Unknown User"}
              </p>

              {isPending && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
              )}

              {isBlocked && (
                <div className="flex items-center space-x-1">
                  <Ban className="w-3 h-3 text-destructive" />
                  <span className="text-xs text-destructive">Blocked</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {friendship.status === "ACCEPTED"
                  ? friend?.isOnline
                    ? "Online"
                    : `Last seen ${formatTimeAgo(
                        friend?.lastSeen || new Date().toISOString()
                      )}`
                  : `Request sent ${formatTimeAgo(friendship.createdAt)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canRespond && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    respondToFriendRequest(friendship.id, "accept")
                  }
                  className="h-8 w-8 p-0"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    respondToFriendRequest(friendship.id, "decline")
                  }
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}

            {friendship.status === "ACCEPTED" && friend && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartDirectMessage?.(friend)}
                  className="h-8 w-8 p-0"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </>
            )}

            {isPending && !isReceiver && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFriend(friendship.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUserSearchCard = (searchUser: User) => (
    <div
      key={searchUser.id}
      className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          {searchUser?.avatar ? (
            <img
              src={searchUser.avatar}
              alt={searchUser?.username || "User"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {getInitial(searchUser?.username)}
            </div>
          )}

          <div
            className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
              searchUser?.isOnline ? "bg-green-500" : "bg-gray-400"
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {searchUser?.username || "Unknown User"}
          </p>
          <p className="text-xs text-muted-foreground">
            {searchUser?.isOnline
              ? "Online"
              : `Last seen ${formatTimeAgo(
                  searchUser?.lastSeen || new Date().toISOString()
                )}`}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => sendFriendRequest(searchUser.id)}
          className="flex items-center space-x-2 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Friend</span>
        </Button>
      </div>
    </div>
  );

  const tabs = [
    {
      id: "all",
      label: "All",
      icon: Users,
      count: Array.isArray(friends)
        ? friends.filter((f) => f?.status === "ACCEPTED").length
        : 0,
    },
    {
      id: "pending",
      label: "Pending",
      icon: Clock,
      count: Array.isArray(friends)
        ? friends.filter((f) => f?.status === "PENDING").length
        : 0,
    },
    {
      id: "blocked",
      label: "Blocked",
      icon: Ban,
      count: Array.isArray(friends)
        ? friends.filter((f) => f?.status === "BLOCKED").length
        : 0,
    },
    { id: "add", label: "Add", icon: UserPlus, count: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mx-4 mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError("")}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Tabs - Made more compact and wrappable */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-1 bg-muted/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FriendsTab)}
              className={cn(
                "flex-1 min-w-[80px] flex items-center justify-center gap-1 py-2 px-2 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search for Add Friends tab */}
      {activeTab === "add" && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 space-y-3 pb-4">
          {activeTab === "add" ? (
            <>
              {searchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(renderUserSearchCard)
              ) : searchQuery.trim() ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Search for users to send friend requests
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {getFilteredFriends().length > 0 ? (
                getFilteredFriends().map(renderFriendCard)
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "all" &&
                      "No friends yet. Start by adding some!"}
                    {activeTab === "pending" && "No pending friend requests"}
                    {activeTab === "blocked" && "No blocked users"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
