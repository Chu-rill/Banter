'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreVertical,
  Hash,
  Users,
  Menu,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Settings,
  Search,
  StopCircle
} from 'lucide-react';
import { Room, Message, messageApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import socketService from '@/lib/socket';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatTimeAgo, debounce } from '@/lib/utils';
import EmojiPicker from 'emoji-picker-react';
import VideoCall from './VideoCall';
import FileUpload from './FileUpload';

interface ChatWindowProps {
  room: Room;
  onToggleSidebar: () => void;
}

interface MessageWithUser extends Message {
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  isOwn?: boolean;
}

interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
}

export default function ChatWindow({ room, onToggleSidebar }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callUsers, setCallUsers] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Load messages when room changes
  useEffect(() => {
    if (room?.id) {
      loadMessages();
      joinRoom();
    }
    
    return () => {
      if (room?.id) {
        leaveRoom();
      }
    };
  }, [room?.id]);

  // Socket event listeners
  useEffect(() => {
    socketService.on('message-received', handleMessageReceived);
    socketService.on('message-sent', handleMessageSent);
    socketService.on('user-typing', handleUserTyping);
    socketService.on('user-stopped-typing', handleUserStoppedTyping);
    socketService.on('room-messages', handleRoomMessages);
    
    return () => {
      socketService.off('message-received', handleMessageReceived);
      socketService.off('message-sent', handleMessageSent);
      socketService.off('user-typing', handleUserTyping);
      socketService.off('user-stopped-typing', handleUserStoppedTyping);
      socketService.off('room-messages', handleRoomMessages);
    };
  }, []);

  // Request notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const roomMessages = await messageApi.getRoomMessages(room.id, 50);
      setMessages(roomMessages.map(msg => ({
        ...msg,
        isOwn: msg.userId === user?.id
      })));
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = () => {
    socketService.joinRoom(room.id);
  };

  const leaveRoom = () => {
    socketService.leaveRoom(room.id);
    if (isTypingRef.current) {
      socketService.stopTyping(room.id);
      isTypingRef.current = false;
    }
  };

  const handleMessageReceived = (message: MessageWithUser) => {
    if (message.roomId === room.id) {
      setMessages(prev => [...prev, { ...message, isOwn: false }]);

      // Browser notification if window not focused and message from others
      if (typeof document !== 'undefined' && document.hidden && message.userId !== user?.id && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`${message.user.username}`, {
            body: message.type === 'TEXT' ? message.content : message.mediaType ? `sent a ${message.mediaType.toLowerCase()}` : 'sent a message',
          });
        } catch {}
      }
    }
  };

  const handleMessageSent = (message: MessageWithUser) => {
    if (message.roomId === room.id) {
      setMessages(prev => [...prev, { ...message, isOwn: true }]);
    }
  };

  const handleUserTyping = (data: TypingUser) => {
    if (data.roomId === room.id && data.userId !== user?.id) {
      setTypingUsers(prev => {
        const existing = prev.find(u => u.userId === data.userId);
        if (existing) return prev;
        return [...prev, data];
      });
    }
  };

  const handleUserStoppedTyping = (data: { userId: string; roomId: string }) => {
    if (data.roomId === room.id) {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    }
  };

  const handleRoomMessages = (data: { roomId: string; messages: MessageWithUser[] }) => {
    if (data.roomId === room.id) {
      setMessages(data.messages.map(msg => ({
        ...msg,
        isOwn: msg.userId === user?.id
      })));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    try {
      setIsSending(true);
      
      // Stop typing indicator
      if (isTypingRef.current) {
        socketService.stopTyping(room.id);
        isTypingRef.current = false;
      }
      
      // Send via socket for real-time delivery
      socketService.sendMessage({
        roomId: room.id,
        content: newMessage.trim(),
        type: 'TEXT'
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const debouncedStopTyping = useCallback(
    debounce(() => {
      if (isTypingRef.current) {
        socketService.stopTyping(room.id);
        isTypingRef.current = false;
      }
    }, 1000),
    [room.id]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Start typing indicator
    if (e.target.value.trim() && !isTypingRef.current) {
      socketService.startTyping(room.id);
      isTypingRef.current = true;
    }
    
    // Reset typing timeout
    debouncedStopTyping();
  };

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const startVideoCall = () => {
    setIsVideoCallMode(true);
    setShowVideoCall(true);
    setIsInCall(true);
  };

  const startVoiceCall = () => {
    setIsVideoCallMode(false);
    setShowVideoCall(true);
    setIsInCall(true);
  };
  
  const endVideoCall = () => {
    setShowVideoCall(false);
    setIsInCall(false);
    setCallUsers([]);
  };

  const endCall = () => {
    setIsInCall(false);
    setCallUsers([]);
  };

  const addReaction = (messageId: string, emoji: string) => {
    setReactions(prev => {
      const existing = prev[messageId] || {};
      const count = existing[emoji] || 0;
      return { ...prev, [messageId]: { ...existing, [emoji]: count + 1 } };
    });
  };

  const renderMessage = (message: MessageWithUser) => {
    const isOwn = message.isOwn || message.userId === user?.id;
    const showAvatar = !isOwn;
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex items-end space-x-2 mb-4",
          isOwn ? "flex-row-reverse space-x-reverse" : "flex-row"
        )}
      >
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {message.user.avatar ? (
              <img
                src={message.user.avatar}
                alt={message.user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              message.user.username.charAt(0).toUpperCase()
            )}
          </div>
        )}
        
        <div className={cn("flex flex-col max-w-[70%]", isOwn ? "items-end" : "items-start")}>
          {!isOwn && (
            <span className="text-xs text-muted-foreground mb-1 px-2">
              {message.user.username}
            </span>
          )}
          
          <div
            className={cn(
              "px-4 py-2 rounded-2xl break-words",
              isOwn 
                ? "bg-primary text-primary-foreground rounded-br-md" 
                : "bg-muted text-foreground rounded-bl-md"
            )}
          >
            {message.type === 'TEXT' ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : message.type === 'MEDIA' ? (
              <div className="space-y-2">
                {message.mediaType === 'IMAGE' && (
                  <img 
                    src={message.mediaUrl} 
                    alt="Shared image" 
                    className="max-w-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.mediaUrl, '_blank')}
                  />
                )}
                {message.mediaType === 'VIDEO' && (
                  <video 
                    src={message.mediaUrl} 
                    controls 
                    className="max-w-64 rounded-lg"
                  />
                )}
                {message.mediaType === 'AUDIO' && (
                  <audio 
                    src={message.mediaUrl} 
                    controls 
                    className="max-w-64"
                  />
                )}
                {message.content && (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            ) : (
              <p className="text-sm italic">{message.content}</p>
            )}
          </div>
          
          {/* Reactions Row */}
          <div className={cn("flex items-center gap-1 mt-1 px-2", isOwn ? "justify-end" : "justify-start")}
               role="group" aria-label="Message reactions">
            {['👍','❤️','😂','😮','🎉'].map((emo) => (
              <button
                key={emo}
                className="text-xs hover:scale-110 transition-transform"
                type="button"
                aria-label={`React with ${emo}`}
                onClick={() => addReaction(message.id, emo)}
              >
                {emo}
              </button>
            ))}
            {/* Show counts */}
            {reactions[message.id] && (
              <div className="flex items-center gap-1 ml-2">
                {Object.entries(reactions[message.id]).map(([emo, count]) => (
                  <span key={emo} className="text-[10px] px-1 py-0.5 bg-muted rounded">
                    {emo} {count}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <span className={cn(
            "text-xs text-muted-foreground mt-1 px-2",
            isOwn ? "text-right" : "text-left"
          )}>
            {formatTimeAgo(message.createdAt)}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        {/* Mobile-first responsive header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="md:hidden flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
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
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{room.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{room.participants.length} members</span>
                {room.isActive && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Active</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={startVoiceCall}
              disabled={isInCall}
              className="hidden sm:flex"
              aria-label="Start voice call"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={startVideoCall}
              disabled={isInCall}
              aria-label="Start video call"
            >
              <Video className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Search messages" 
              onClick={() => setShowSearch(!showSearch)}
              className="hidden sm:flex"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Call Interface (when in call) */}
      {isInCall && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Call in progress
              </span>
              <span className="text-sm text-muted-foreground">
                {callUsers.length + 1} participants
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <VideoOff className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={endCall}>
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Inline Search */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-card/50">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages in this room..."
            aria-label="Search messages"
          />
        </div>
      )}
      
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1 scrollbar-thin touch-pan-y" 
        role="log" 
        aria-live="polite"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Hash className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Welcome to #{room.name}!</h3>
                <p className="text-sm text-muted-foreground">
                  This is the beginning of your conversation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages
              .filter(m => !searchQuery || (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map(renderMessage)}
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 px-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-2 md:p-4 border-t border-border bg-card/50 backdrop-blur-sm safe-area-inset-bottom">
        {/* Mobile search toggle */}
        <div className="sm:hidden mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Messages
          </Button>
        </div>
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 z-50">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            />
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-1 md:space-x-2" aria-label="Send message">
          <div className="flex-1 relative">
            <Input
              ref={messageInputRef}
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message #${room.name}...`}
              className="pr-16 md:pr-20 resize-none min-h-[40px] max-h-32 text-base"
              maxLength={2000}
              disabled={isSending}
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setShowFileUpload(true)}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label="Insert emoji"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Voice recorder */}
          <Button
            type="button"
            size="icon"
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            onClick={async () => {
              if (isRecording) {
                // Stop
                setIsRecording(false);
                mediaRecorderRef.current?.stop();
                return;
              }
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mr = new MediaRecorder(stream);
                recordedChunksRef.current = [];
                mr.ondataavailable = (e) => {
                  if (e.data.size > 0) recordedChunksRef.current.push(e.data);
                };
                mr.onstop = async () => {
                  const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                  const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
                  try {
                    // Upload then send media message
                    const uploaded = await uploadApi.uploadFile(file, room.id);
                    socketService.sendMessage({
                      roomId: room.id,
                      type: 'MEDIA',
                      mediaUrl: uploaded.url,
                      mediaType: 'AUDIO',
                    });
                  } catch (err) {
                    console.error('Voice upload failed', err);
                  }
                  // stop all tracks
                  stream.getTracks().forEach(t => t.stop());
                };
                mediaRecorderRef.current = mr;
                mr.start();
                setIsRecording(true);
              } catch (err) {
                console.error('Mic permission denied', err);
              }
            }}
            className={cn('flex-shrink-0', isRecording && 'bg-red-500 text-white hover:bg-red-600')}
          >
            {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>
            Press Enter to send, Shift + Enter for new line
          </span>
          <span>
            {newMessage.length}/2000
          </span>
        </div>
      </div>
      
      {/* Video Call Interface */}
      <VideoCall 
        room={room}
        isOpen={showVideoCall}
        onClose={endVideoCall}
        isVideoCall={isVideoCallMode}
      />

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload 
          roomId={room.id}
          onFileUploaded={(file) => {
            // After upload, send a media message
            socketService.sendMessage({
              roomId: room.id,
              type: 'MEDIA',
              mediaUrl: file.url,
              mediaType: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('audio/') ? 'AUDIO' : 'FILE',
            });
            setShowFileUpload(false);
          }}
          onClose={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
}
