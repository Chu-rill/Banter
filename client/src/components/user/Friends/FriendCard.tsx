import { MessageCircle, UserCheck, UserX, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Friend, FriendEntry, User } from "@/types";
import { useState, useEffect } from "react";

interface FriendCardProps {
  friendship: FriendEntry;
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
  const friend = friendship.friend;
  // friendship.requesterId === currentUser?.id
  //   ? friendship.receiver
  //   : friendship.requester;

  const [imageError, setImageError] = useState(false);
  const isIncomingRequest = friendship.status === "PENDING";
  //  &&
  // friendship.receiverId === currentUser?.id;
  const isOutgoingRequest = friendship.status === "PENDING";
  // &&
  // friendship.requesterId === currentUser?.id;

  useEffect(() => {
    setImageError(false);
  }, [friend?.avatar]);

  console.log();

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex items-center gap-2">
        {imageError || !friend?.avatar ? (
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
        <div className="flex flex-col">
          <span className="font-medium">{friend?.username}</span>
          {isIncomingRequest && (
            <span className="text-xs text-blue-500">Wants to be friends</span>
          )}
          {isOutgoingRequest && (
            <span className="text-xs text-yellow-500">Request sent</span>
          )}
          {friendship.status === "ACCEPTED" && friend?.isOnline && (
            <span className="text-xs text-green-500">Online</span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {isIncomingRequest ? (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={() => onRespond(friendship.friendshipId, "accept")}
              className="bg-green-500 hover:bg-green-600 hover:cursor-pointer"
            >
              <UserCheck size={16} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 hover:cursor-pointer"
              onClick={() => onRespond(friendship.friendshipId, "decline")}
            >
              <UserX size={16} />
            </Button>
          </>
        ) : isOutgoingRequest ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(friendship.friendshipId)}
            disabled
            className="text-muted-foreground"
          >
            Pending
          </Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" onClick={() => onMessage(friend)}>
              <MessageCircle size={16} />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onRemove(friendship.friendshipId)}
            >
              <UserX size={16} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
