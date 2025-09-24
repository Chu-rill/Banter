// Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
  isVerified?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  profilePicture?: string;
  type: "PUBLIC" | "PRIVATE";
  mode: "CHAT" | "VIDEO" | "BOTH";
  creatorId: string;
  participants: User[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  price?: number;
  isPaid?: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  user: User;
  type: "TEXT" | "MEDIA" | "VOICE" | "SYSTEM";
  content?: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
  createdAt: string;
  isRead: boolean;
}

export interface Friend {
  id: string;
  requesterId: string;
  receiverId: string;
  requester: User;
  receiver: User;
  status: "PENDING" | "ACCEPTED" | "BLOCKED" | "DECLINED";
  createdAt: string;
}

//Auth Responses
export interface AuthResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: User;
  token?: string;
}

export interface UserResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: User | User[] | { users: User[]; pagination: UserPagination };
}

export interface RoomResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: Room | Room[] | { rooms: Room[]; pagination: RoomPagination };
}

export interface MessageResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: Message[];
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RoomPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Error Response
export interface ErrorResponse {
  statusCode: number;
  success: boolean;
  message: string;
  error?: any;
}

export interface MessageWithUser extends Message {
  user: User;
  isOwn?: boolean;
}

export interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
}
