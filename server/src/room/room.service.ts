import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RoomRepository } from './room.repository';
import {
  CreateRoomDto,
  GetAllRoomsQueryDto,
  GetRoomDto,
  RoomConnectionDto,
  UpdateRoomDto,
} from './validation';
import { RoomMessageService } from 'src/room-message/room-message.service';
import { UserRepository } from 'src/user/user.repository';
import { AppGateway } from 'src/gateway/app.gateway';
import { RoomRedisService } from 'src/redis/room.redis';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  constructor(
    private roomRepository: RoomRepository,
    private userRepository: UserRepository,
    private gateway: AppGateway,
    private roomMessageService: RoomMessageService,
    private roomRedis: RoomRedisService, // Inject RoomRedisService
  ) {}

  async createRoom(createRoomDto: CreateRoomDto, creatorId: string) {
    const { name, description, type, maxParticipants, mode } = createRoomDto;

    const room = await this.roomRepository.createRoom(
      name,
      description,
      type,
      maxParticipants,
      creatorId,
      mode,
    );

    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Room created successfully',
      data: room,
    };
  }

  async updateRoom(id: string, updateData: UpdateRoomDto) {
    const res = await this.roomRepository.getRoomById(id);
    if (!res) {
      throw new NotFoundException('Room not found');
    }
    const room = await this.roomRepository.updateRoom(id, updateData);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Room updated successfully',
      data: room,
    };
  }

  async getAllRooms(dto: GetAllRoomsQueryDto) {
    let { page, limit } = dto;
    const { rooms, total } = await this.roomRepository.getAllRooms(page, limit);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Room retrieved successfully',
      data: {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getRoomById(dto: GetRoomDto) {
    const { id } = dto;
    const room = await this.roomRepository.getRoomById(id);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Room retrieved successfully',
      data: room,
    };
  }

  async getRoomMessages(dto: GetRoomDto) {
    const { id } = dto;
    const room = await this.roomRepository.getMessagesByRoomId(id);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Messages retrieved successfully',
      data: room,
    };
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await this.roomRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.participants.length >= room.maxParticipants) {
      throw new BadRequestException('Room is full');
    }

    // If room is private, check if user has an approved join request
    if (room.type === 'PRIVATE') {
      const isCreator = room.creatorId === userId;

      if (!isCreator) {
        const joinRequest = await this.roomRepository.getJoinRequest(
          roomId,
          userId,
        );

        if (!joinRequest) {
          throw new BadRequestException(
            'You need to request to join this private room',
          );
        }

        if (joinRequest.status === 'PENDING') {
          throw new BadRequestException(
            'Your join request is pending approval',
          );
        }

        if (joinRequest.status === 'DENIED') {
          throw new BadRequestException('Your join request was denied');
        }
      }
    }

    // Check if user is already a member
    const isAlreadyMember = await this.roomRepository.isRoomMember(
      roomId,
      userId,
    );

    const [newMember, user] = await Promise.all([
      this.roomRepository.joinRoom(roomId, userId),
      this.userRepository.getUserById(userId),
    ]);

    // Only send system message if user is a new member
    let systemMessage: any = null;
    if (!isAlreadyMember) {
      systemMessage = await this.roomMessageService.sendSystemMessage(
        roomId,
        `${user.username} joined the room`,
        userId,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: systemMessage,
      data: { ...newMember, timestamp: new Date() },
    };
  }

  async leaveRoom(roomId: string, userId: string) {
    const room = await this.roomRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isParticipant = room.participants.some(
      (participant) => participant.id === userId,
    );

    if (!isParticipant) {
      throw new BadRequestException('You are not a participant of this room');
    }

    const [oldMember, user] = await Promise.all([
      this.roomRepository.leaveRoom(roomId, userId),
      this.userRepository.getUserById(userId),
    ]);

    const systemMessage = await this.roomMessageService.sendSystemMessage(
      roomId,
      `${user.username} left the room`,
      userId,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: systemMessage,
      data: { ...oldMember, timestamp: new Date() },
    };
  }

  async canMessage(roomId: string, userId: string): Promise<boolean> {
    return this.roomRepository.isRoomMember(roomId, userId);
  }

  async findById(id: string) {
    const room = await this.roomRepository.getRoomById(id);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async deleteRoom(id: string, userId: string) {
    let res = this.roomRepository.getRoomById(id);
    if (!res) {
      throw new NotFoundException('Room not found');
    }
    const room = await this.roomRepository.deleteRoom(id, userId);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Room deleted successfully',
    };
  }

  // Room Join Request Methods
  async requestToJoinRoom(roomId: string, userId: string) {
    const room = await this.roomRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.type !== 'PRIVATE') {
      throw new BadRequestException(
        'This room is public, you can join directly',
      );
    }

    // Check if user is already a member
    const isAlreadyMember = await this.roomRepository.isRoomMember(
      roomId,
      userId,
    );
    if (isAlreadyMember) {
      throw new BadRequestException('You are already a member of this room');
    }

    // Check if user is the creator
    if (room.creatorId === userId) {
      throw new BadRequestException('You are the creator of this room');
    }

    // Check if request already exists
    const existingRequest = await this.roomRepository.getJoinRequest(
      roomId,
      userId,
    );
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        throw new BadRequestException(
          'You already have a pending join request',
        );
      }
      if (existingRequest.status === 'APPROVED') {
        throw new BadRequestException('Your request was already approved');
      }
      // If denied, allow creating a new request
      await this.roomRepository.deleteJoinRequest(existingRequest.id);
    }

    const joinRequest = await this.roomRepository.createJoinRequest(
      roomId,
      userId,
    );
    const user = await this.userRepository.getUserById(userId);

    // TODO: Notify room creator via WebSocket when gateway method is available
    // this.gateway.notifyRoomCreator(room.creatorId, {
    //   type: 'ROOM_JOIN_REQUEST',
    //   roomId,
    //   roomName: room.name,
    //   userId,
    //   username: user.username,
    //   avatar: user.avatar,
    //   requestId: joinRequest.id,
    // });

    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Join request sent successfully',
      data: joinRequest,
    };
  }

  async getPendingJoinRequests(roomId: string, userId: string) {
    const room = await this.roomRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId !== userId) {
      throw new BadRequestException(
        'Only the room creator can view join requests',
      );
    }

    const requests = await this.roomRepository.getPendingJoinRequests(roomId);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Join requests retrieved successfully',
      data: requests,
    };
  }

  async approveJoinRequest(requestId: string, userId: string) {
    const request = await this.roomRepository.getJoinRequestById(requestId);

    if (!request) throw new NotFoundException('Join request not found');

    const room = await this.roomRepository.getRoomById(request.roomId);

    if (!room) throw new NotFoundException('Room not found');

    if (room.creatorId !== userId) {
      throw new BadRequestException(
        'Only the room creator can approve join requests',
      );
    }

    const updatedRequest = await this.roomRepository.updateJoinRequestStatus(
      requestId,
      'APPROVED',
    );

    await this.joinRoom(request.roomId, request.userId);

    // ✅ Add to Redis (so socket can be tracked)
    const socketId = await this.roomRedis.getSocketIdByUserId(request.userId);
    if (socketId) {
      await this.roomRedis.addUserToRoom(
        request.userId,
        request.roomId,
        socketId,
      );

      // ✅ Emit "user-joined-room" to notify others in the room
      this.gateway.server
        .to(request.roomId)
        .emit('user-joined-room', {
          userId: request.userId,
          roomId: request.roomId,
        });
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Join request approved',
      data: updatedRequest,
    };
  }

  async denyJoinRequest(requestId: string, userId: string) {
    const request = await this.roomRepository.getJoinRequestById(requestId);

    if (!request) {
      throw new NotFoundException('Join request not found');
    }

    const room = await this.roomRepository.getRoomById(request.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.creatorId !== userId) {
      throw new BadRequestException(
        'Only the room creator can deny join requests',
      );
    }

    const updatedRequest = await this.roomRepository.updateJoinRequestStatus(
      requestId,
      'DENIED',
    );

    // TODO: Notify the requester via WebSocket when gateway method is available
    // this.gateway.notifyUser(request.userId, {
    //   type: 'ROOM_JOIN_DENIED',
    //   roomId: request.roomId,
    //   roomName: room.name,
    //   requestId,
    // });

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Join request denied',
      data: updatedRequest,
    };
  }
}
