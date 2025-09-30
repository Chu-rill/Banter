import { UserIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";
import { useState } from "react";

interface UserSearchCardProps {
  searchUser: User;
  onSendRequest: (userId: string) => void;
}

export default function UserSearchCard({
  searchUser,
  onSendRequest,
}: UserSearchCardProps) {
  const [imageError, setImageError] = useState(false);
  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex items-center gap-2">
        {imageError || !searchUser.avatar ? (
          <UserIcon className="w-8 h-8 text-gray-400" />
        ) : (
          <img
            src={searchUser.avatar}
            alt={searchUser.username}
            className="w-8 h-8 rounded-full"
            onError={() => setImageError(true)}
          />
        )}
        <span>{searchUser.username}</span>
      </div>
      <Button
        size="sm"
        variant="default"
        className=" bg-green-500 hover:bg-green-600 hover:cursor-pointer"
        onClick={() => onSendRequest(searchUser.id)}
      >
        <UserPlus size={16} />
      </Button>
    </div>
  );
}
