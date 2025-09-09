'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Settings, 
  Moon, 
  Sun, 
  Users,
  Hash,
  Video,
  MoreVertical,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Room, roomApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatTimeAgo } from '@/lib/utils';
import CreateRoomModal from './CreateRoomModal';
import FriendsPanel from './FriendsPanel';

interface ChatSidebarProps {
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowProfile: () => void;
}

export default function ChatSidebar({
  selectedRoom,
  onSelectRoom,
  collapsed,
  onToggleCollapse,
  onShowProfile,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends'>('rooms');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await roomApi.getRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRoom = () => {
    setShowCreateRoomModal(true);
  };
  
  const handleRoomCreated = (newRoom: Room) => {
    setRooms(prev => [newRoom, ...prev]);
    onSelectRoom(newRoom);
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-card border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="w-10 h-10"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center py-4 space-y-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateRoom}
            className="w-10 h-10"
          >
            <Plus className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 w-full">
            {filteredRooms.slice(0, 8).map((room) => (
              <Button
                key={room.id}
                variant="ghost"
                size="icon"
                onClick={() => onSelectRoom(room)}
                className={cn(
                  "w-10 h-10 mb-2 mx-auto relative",
                  selectedRoom?.id === room.id && "bg-accent"
                )}
              >
                <Hash className="w-4 h-4" />
                {room.isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="p-3 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowProfile}
            className="w-10 h-10"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out",
      "w-80 md:w-80",
      collapsed ? "w-16" : "w-80",
      "md:relative md:translate-x-0",
      "sm:absolute sm:inset-y-0 sm:left-0 sm:z-50",
      collapsed && "sm:-translate-x-full"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Banter</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('rooms')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'rooms' 
              ? "border-purple-600 text-purple-600" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Hash className="w-4 h-4 inline-block mr-2" />
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'friends' 
              ? "border-purple-600 text-purple-600" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-4 h-4 inline-block mr-2" />
          Friends
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'rooms' && (
          <div className="p-2">
            {/* Create Room Button */}
            <Button
              variant="ghost"
              onClick={handleCreateRoom}
              className="w-full justify-start mb-2 h-12"
            >
              <Plus className="w-4 h-4 mr-3" />
              Create Room
            </Button>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-8">
                <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'No rooms found' : 'No rooms yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={cn(
                      "flex items-center p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                      selectedRoom?.id === room.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          room.mode === 'VIDEO' 
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                        )}>
                          {room.mode === 'VIDEO' ? (
                            <Video className="w-5 h-5" />
                          ) : (
                            <Hash className="w-5 h-5" />
                          )}
                        </div>
                        {room.isActive && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">
                            {room.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(room.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {room.description || `${room.participants.length} members`}
                          </p>
                          {room.type === 'PRIVATE' && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'friends' && (
          <FriendsPanel 
            onStartDirectMessage={(friend) => {
              // TODO: Create direct message room or navigate to existing DM
              console.log('Start DM with:', friend.username);
            }}
          />
        )}
      </div>
      
      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
                user?.isOnline ? "bg-green-500" : "bg-gray-400"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowProfile}
              className="w-8 h-8"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="w-8 h-8 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Create Room Modal */}
      <CreateRoomModal 
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}
