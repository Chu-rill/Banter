import { UserIcon, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";
import { useState, useEffect } from "react";

interface UserSearchCardProps {
  searchUser: User;
  onSendRequest: (userId: string) => void;
}

export default function UserSearchCard({
  searchUser,
  onSendRequest,
}: UserSearchCardProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [searchUser.avatar]);
  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div className="flex items-center gap-2">
        {imageError || !searchUser.avatar ? (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        ) : (
          <img
            src={searchUser.avatar}
            alt={searchUser.username}
            className="w-8 h-8 rounded-full object-cover"
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
