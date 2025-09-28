// components/chat/ChatWindow.tsx
"use client";

import { useState } from "react";
import { Room } from "@/types";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import VideoCall from "./VideoCall";
import FileUpload from "./FileUpload";
import GroupInfo from "../room/GroupInfo/GroupInfo";
import { useChat } from "@/hooks/useChat";
import ChatSearch from "./ChatSearch";

interface ChatWindowProps {
  room: Room;
  onToggleSidebar: () => void;
  onLeaveRoom?: () => void;
}

export default function ChatWindow({ room, onToggleSidebar, onLeaveRoom }: ChatWindowProps) {
  const {
    messages,
    typingUsers,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
    // addReaction,
  } = useChat(room.id);

  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
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
        onToggleSidebar={onToggleSidebar}
        onStartVideoCall={handleStartVideoCall}
        onStartVoiceCall={handleStartVoiceCall}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onShowDetails={() => setShowRoomDetails(true)}
      />

      {showSearch && (
        <ChatSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      )}

      <ChatMessages
        messages={messages}
        typingUsers={typingUsers}
        isLoading={isLoading}
        searchQuery={searchQuery}
        // onAddReaction={addReaction}
      />

      <ChatInput
        roomId={room.id}
        onSendMessage={sendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        onOpenFileUpload={() => setShowFileUpload(true)}
      />

      {showVideoCall && (
        <VideoCall
          room={room}
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          isVideoCall={isVideoCallMode}
        />
      )}

      {showFileUpload && (
        <FileUpload
          roomId={room.id}
          onFileUploaded={(file) => {
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

      {showRoomDetails && (
        <GroupInfo
          room={room}
          onClose={() => setShowRoomDetails(false)}
          onLeaveRoom={onLeaveRoom}
        />
      )}
    </div>
  );
}
