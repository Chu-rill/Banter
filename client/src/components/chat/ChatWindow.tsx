// components/chat/ChatWindow.tsx
"use client";

import { useState } from "react";
import { Room, User } from "@/types";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import VideoCall from "./VideoCall";
import FileUpload from "./FileUpload";
import GroupInfo from "../room/GroupInfo/GroupInfo";
import { useChat } from "@/hooks/useRoomChat";
import { useDirectChat } from "@/hooks/useDirectChat";
import ChatSearch from "./ChatSearch";
import UserDetails from "../user/UserDetails";

interface ChatWindowProps {
  room?: Room;
  friend?: User;
  onToggleSidebar: () => void;
  onLeaveRoom?: () => void;
}

export default function ChatWindow({
  room,
  friend,
  onToggleSidebar,
  onLeaveRoom,
}: ChatWindowProps) {
  // Use room chat or direct chat based on what's provided
  const roomChat = useChat(room?.id || "");
  const directChat = useDirectChat(friend?.id || "");

  const isRoomChat = !!room;
  const { messages, isLoading, sendMessage, startTyping, stopTyping } =
    isRoomChat ? roomChat : directChat;

  // For room chat, get typing users
  const typingUsers = isRoomChat ? roomChat.typingUsers : [];
  const isTyping = !isRoomChat ? directChat.isTyping : false;

  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isVideoCallMode, setIsVideoCallMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleStartVideoCall = () => {
    setIsVideoCallMode(true);
    setShowVideoCall(true);
  };

  const handleStartVoiceCall = () => {
    setIsVideoCallMode(false);
    setShowVideoCall(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <ChatHeader
        room={room}
        friend={friend}
        onToggleSidebar={onToggleSidebar}
        onStartVideoCall={handleStartVideoCall}
        onStartVoiceCall={handleStartVoiceCall}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onShowDetails={() => {
          if (isRoomChat) {
            setShowRoomDetails(true);
          } else {
            setShowUserDetails(true);
          }
        }}
      />

      {showSearch && (
        <ChatSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      )}

      <ChatMessages
        messages={messages}
        typingUsers={typingUsers}
        isLoading={isLoading}
        searchQuery={searchQuery}
        isTyping={isTyping}
      />

      <ChatInput
        roomId={room?.id}
        friendId={friend?.id}
        onSendMessage={(message) => {
          // Only allow "TEXT" or "MEDIA" types and ensure type is defined
          if (message.type === "TEXT" || message.type === "MEDIA") {
            sendMessage({
              ...message,
              type: message.type, // explicitly set type to satisfy type checker
            });
          }
        }}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        onOpenFileUpload={() => setShowFileUpload(true)}
      />

      {showVideoCall && (
        <VideoCall
          room={room}
          friend={friend}
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          isVideoCall={isVideoCallMode}
        />
      )}

      {showFileUpload && (
        <FileUpload
          onFileUploaded={(file) => {
            console.log("onFileUploaded file:", file);
            // Map file.type to allowed mediaType values

            sendMessage({
              type: "MEDIA",
              mediaUrl: file.url,
              mediaType: file.type,
            });
            setShowFileUpload(false);
          }}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {showRoomDetails && room && (
        <GroupInfo
          room={room}
          onClose={() => setShowRoomDetails(false)}
          onLeaveRoom={onLeaveRoom}
        />
      )}

      {showUserDetails && friend && (
        <UserDetails
          friend={friend}
          onClose={() => setShowUserDetails(false)}
          onStartVideoCall={handleStartVideoCall}
          onStartVoiceCall={handleStartVoiceCall}
        />
      )}
    </div>
  );
}
