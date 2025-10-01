import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils";
import { Room } from "@/types";
import { useEffect, useState } from "react";

interface RoomListItemProps {
  room: Room;
  selected: boolean;
  onClick: () => void;
}

export default function RoomListItem({
  room,
  selected,
  onClick,
}: RoomListItemProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [room?.profilePicture]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group",
        selected
          ? "bg-purple-600/10 border border-purple-500/20 shadow-lg"
          : "hover:bg-secondary/50 hover:shadow-md"
      )}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="relative">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-105",
              (!room?.profilePicture || imageError) &&
                "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
              selected && "ring-2 ring-purple-500/30"
            )}
          >
            {imageError || !room?.profilePicture ? (
              <Users className="w-8 h-8 text-white" />
            ) : (
              <img
                src={room.profilePicture}
                alt={room.name || "Room"}
                className="w-11 h-11 rounded-xl object-cover shadow-md"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          {room.isActive && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={cn(
                "text-sm font-semibold truncate transition-colors",
                selected
                  ? "text-purple-600"
                  : "text-foreground group-hover:text-purple-600"
              )}
            >
              {room.name}
            </h3>
            <div className="flex items-center space-x-1">
              {room.type === "PRIVATE" && (
                <div
                  className="w-2 h-2 bg-amber-500 rounded-full"
                  title="Private room"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(room.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate">
              {room.description ||
                `${room.participants?.length || 0} ${
                  room.participants?.length === 1 ? "member" : "members"
                }`}
            </p>

            {/* Small avatars */}
            <div className="flex items-center space-x-1">
              <div className="flex -space-x-1">
                {room.participants?.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-5 h-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full border border-background flex items-center justify-center text-xs text-white font-medium"
                    title={p.username}
                  >
                    {p.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                ))}
                {room.participants?.length > 3 && (
                  <div className="w-5 h-5 bg-muted border border-background rounded-full flex items-center justify-center text-xs font-medium">
                    +{room.participants.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
