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

    const [newMember, user] = await Promise.all([
      this.roomRepository.joinRoom(roomId, userId),
      this.userRepository.getUserById(userId),
    ]);

    const systemMessage = await this.roomMessageService.sendSystemMessage(
      roomId,
      `User ${user.username} joined the room`,
      userId,
    );

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
      `User ${user.username} left the room`,
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
}
