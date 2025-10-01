import { MessageCircle, UserCheck, UserX, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Friend, User } from "@/types";
import { useState, useEffect } from "react";

interface FriendCardProps {
  friendship: Friend;
  currentUser: User | null;
  onRespond: (friendshipId: string, action: "accept" | "decline") => void;
  onRemove: (friendshipId: string) => void;
  onMessage: (friend: User) => void;
}

export default function FriendCard({
  friendship,
  currentUser,
  onRespond,
  onRemove,
  onMessage,
}: FriendCardProps) {
  const friend =
    friendship.requesterId === currentUser?.id
      ? friendship.receiver
      : friendship.requester;

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [friend.avatar]);

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex items-center gap-2">
        {imageError || !friend.avatar ? (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        ) : (
          <img
            src={friend.avatar}
            alt={friend.username}
            className="w-8 h-8 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        <span>{friend.username}</span>
      </div>
      <div className="flex gap-2">
        {friendship.status === "PENDING" &&
        friendship.receiverId === currentUser?.id ? (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => onRespond(friendship.id, "accept")}
            >
              <UserCheck size={16} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRespond(friendship.id, "decline")}
            >
              <UserX size={16} />
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => onMessage(friend)}>
              <MessageCircle size={16} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRemove(friendship.id)}
            >
              <UserX size={16} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
