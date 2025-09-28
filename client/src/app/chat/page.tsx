"use client";

import { useState } from "react";
import { withAuth } from "@/contexts/AuthContext";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import UserProfile from "../../components/user/UserProfile";
import {
  NotificationSystem,
  useNotifications,
} from "../../components/ui/NotificationSystem";
import ThemeCustomizer from "../../components/ui/ThemeCustomizer";
import { Room } from "@/types";

function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const { notifications, addNotification, removeNotification } =
    useNotifications();

  return (
    <div className="h-screen bg-background flex overflow-hidden relative">
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <ChatSidebar
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onShowProfile={() => setShowProfile(true)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedRoom ? (
          <ChatWindow
            room={selectedRoom}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            onLeaveRoom={() => setSelectedRoom(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Welcome to Banter!
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Select a conversation from the sidebar to start chatting, or
                  create a new room to begin.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Panel */}
      {showProfile && (
        <UserProfile
          onClose={() => setShowProfile(false)}
          onOpenThemeCustomizer={() => setShowThemeCustomizer(true)}
        />
      )}

      {/* Theme Customizer */}
      <ThemeCustomizer
        isOpen={showThemeCustomizer}
        onClose={() => setShowThemeCustomizer(false)}
      />

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

export default withAuth(ChatPage);
