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

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  constructor(
    private roomRepository: RoomRepository,
    private userRepository: UserRepository,
    private gateway: AppGateway,
    private roomMessageService: RoomMessageService,
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

  async joinRoom(dto: RoomConnectionDto) {
    const { roomId, userId } = dto;

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

    // this.gateway.server.to(roomId).emit('room:userJoined', systemMessage);
    this.gateway.server.emit('room:userJoined', systemMessage);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Joined room successfully',
      data: newMember,
    };
  }

  async leaveRoom(dto: RoomConnectionDto) {
    const { roomId, userId } = dto;
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

    // this.gateway.server.to(roomId).emit('room:userLeft', systemMessage);
    this.gateway.server.emit('room:userLeft', systemMessage);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Left room successfully',
      data: oldMember,
    };
  }
}
