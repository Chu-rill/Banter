import { Button } from "@/components/ui/Button";
import { FriendsTab } from "./FriendsPanel";

interface Tab {
  id: FriendsTab;
  label: string;
  icon: React.ElementType;
  count: number;
}

interface FriendsTabsProps {
  activeTab: FriendsTab;
  setActiveTab: (tab: FriendsTab) => void;
  tabs: Tab[];
}

export default function FriendsTabs({
  activeTab,
  setActiveTab,
  tabs,
}: FriendsTabsProps) {
  return (
    <div className="grid grid-cols-4 border-b">
      {tabs.map(({ id, label, icon: Icon, count }) => (
        <Button
          key={id}
          variant="ghost"
          onClick={() => setActiveTab(id)}
          className={`flex items-center justify-center gap-2 rounded-none border-b-2 transition ${
            activeTab === id
              ? "border-purple-500 text-purple-500"
              : "border-transparent text-gray-400 hover:text-gray-200"
          }`}
        >
          <Icon size={16} />
          {label}
          {count > 0 && (
            <span className="ml-1 text-xs bg-gray-700 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
