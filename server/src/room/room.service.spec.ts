// import { Test, TestingModule } from '@nestjs/testing';
// import { RoomService } from './room.service';
// import { RoomRepository } from './room.repository';
// import { UserRepository } from '../user/user.repository';
// import { RoomMessageService } from '../room-message/room-message.service';
// import { AppGateway } from '../gateway/app.gateway';
// import { RoomRedisService } from '../redis/room.redis';
// import {
//   NotFoundException,
//   BadRequestException,
//   Logger,
// } from '@nestjs/common';
// import {
//   CreateRoomDto,
//   GetAllRoomsQueryDto,
//   GetRoomDto,
// } from './validation';

// describe('RoomService', () => {
//   let service: RoomService;
//   let roomRepository: jest.Mocked<RoomRepository>;
//   let userRepository: jest.Mocked<UserRepository>;
//   let roomMessageService: jest.Mocked<RoomMessageService>;
//   let gateway: jest.Mocked<AppGateway>;
//   let roomRedis: jest.Mocked<RoomRedisService>;

//   const mockRoom = {
//     id: 'room123',
//     name: 'Test Room',
//     description: 'Test Description',
//     type: 'PUBLIC',
//     maxParticipants: 10,
//     mode: 'CHAT',
//     creatorId: 'creator123',
//     participants: [
//       { id: 'user1', username: 'user1' },
//       { id: 'user2', username: 'user2' },
//     ],
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockUser = {
//     id: 'user123',
//     username: 'testuser',
//     email: 'test@example.com',
//     avatar: 'avatar.png',
//     isOnline: true,
//   };

//   const mockRoomRepository = {
//     createRoom: jest.fn(),
//     getAllRooms: jest.fn(),
//     getRoomById: jest.fn(),
//     joinRoom: jest.fn(),
//     leaveRoom: jest.fn(),
//     isRoomMember: jest.fn(),
//   };

//   const mockUserRepository = {
//     getUserById: jest.fn(),
//   };

//   const mockRoomMessageService = {
//     sendSystemMessage: jest.fn(),
//   };

//   const mockGateway = {
//     broadcast: jest.fn(),
//   };

//   const mockRoomRedis = {
//     addUserToRoom: jest.fn(),
//     removeUserFromRoom: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         RoomService,
//         {
//           provide: RoomRepository,
//           useValue: mockRoomRepository,
//         },
//         {
//           provide: UserRepository,
//           useValue: mockUserRepository,
//         },
//         {
//           provide: RoomMessageService,
//           useValue: mockRoomMessageService,
//         },
//         {
//           provide: AppGateway,
//           useValue: mockGateway,
//         },
//         {
//           provide: RoomRedisService,
//           useValue: mockRoomRedis,
//         },
//       ],
//     }).compile();

//     service = module.get<RoomService>(RoomService);
//     roomRepository = module.get(RoomRepository);
//     userRepository = module.get(UserRepository);
//     roomMessageService = module.get(RoomMessageService);
//     gateway = module.get(AppGateway);
//     roomRedis = module.get(RoomRedisService);

//     // Mock the logger to avoid console output during tests
//     jest.spyOn(Logger.prototype, 'log').mockImplementation();
//     jest.spyOn(Logger.prototype, 'error').mockImplementation();
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('createRoom', () => {
//     const createRoomDto: CreateRoomDto = {
//       name: 'Test Room',
//       description: 'Test Description',
//       type: 'PUBLIC' as any,
//       maxParticipants: 10,
//       mode: 'CHAT' as any,
//     };

//     it('should create room successfully', async () => {
//       roomRepository.createRoom.mockResolvedValue(mockRoom);

//       const result = await service.createRoom(createRoomDto, 'creator123');

//       expect(roomRepository.createRoom).toHaveBeenCalledWith(
//         'Test Room',
//         'Test Description',
//         'PUBLIC',
//         10,
//         'creator123',
//         'CHAT',
//       );
//       expect(result).toEqual({
//         statusCode: 201,
//         success: true,
//         message: 'Room created successfully',
//         data: mockRoom,
//       });
//     });
//   });

//   describe('getAllRooms', () => {
//     const queryDto: GetAllRoomsQueryDto = { page: 1, limit: 10 };

//     it('should return all rooms with pagination', async () => {
//       const mockRooms = [mockRoom];
//       const mockTotal = 1;
//       roomRepository.getAllRooms.mockResolvedValue({
//         rooms: mockRooms,
//         total: mockTotal,
//       });

//       const result = await service.getAllRooms(queryDto);

//       expect(roomRepository.getAllRooms).toHaveBeenCalledWith(1, 10);
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Room retrieved successfully',
//         data: {
//           rooms: mockRooms,
//           pagination: {
//             page: 1,
//             limit: 10,
//             total: mockTotal,
//             pages: 1,
//           },
//         },
//       });
//     });
//   });

//   describe('getRoomById', () => {
//     const getRoomDto: GetRoomDto = { id: 'room123' };

//     it('should return room when found', async () => {
//       roomRepository.getRoomById.mockResolvedValue(mockRoom);

//       const result = await service.getRoomById(getRoomDto);

//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Room retrieved successfully',
//         data: mockRoom,
//       });
//     });

//     it('should throw NotFoundException when room not found', async () => {
//       roomRepository.getRoomById.mockResolvedValue(null);

//       await expect(service.getRoomById(getRoomDto)).rejects.toThrow(
//         new NotFoundException('Room not found'),
//       );
//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//     });
//   });

//   describe('joinRoom', () => {
//     const newMember = { id: 'user123', roomId: 'room123' };

//     it('should join room successfully', async () => {
//       roomRepository.getRoomById.mockResolvedValue(mockRoom);
//       roomRepository.joinRoom.mockResolvedValue(newMember);
//       userRepository.getUserById.mockResolvedValue(mockUser);
//       roomMessageService.sendSystemMessage.mockResolvedValue('System message');

//       const result = await service.joinRoom('room123', 'user123');

//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//       expect(roomRepository.joinRoom).toHaveBeenCalledWith('room123', 'user123');
//       expect(userRepository.getUserById).toHaveBeenCalledWith('user123');
//       expect(roomMessageService.sendSystemMessage).toHaveBeenCalledWith(
//         'room123',
//         'User testuser joined the room',
//         'user123',
//       );
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'System message',
//         data: { ...newMember, timestamp: expect.any(Date) },
//       });
//     });

//     it('should throw NotFoundException when room not found', async () => {
//       roomRepository.getRoomById.mockResolvedValue(null);

//       await expect(service.joinRoom('nonexistent', 'user123')).rejects.toThrow(
//         new NotFoundException('Room not found'),
//       );
//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('nonexistent');
//     });

//     it('should throw BadRequestException when room is full', async () => {
//       const fullRoom = {
//         ...mockRoom,
//         participants: new Array(10).fill({ id: 'user' }),
//       };
//       roomRepository.getRoomById.mockResolvedValue(fullRoom);

//       await expect(service.joinRoom('room123', 'user123')).rejects.toThrow(
//         new BadRequestException('Room is full'),
//       );
//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//     });
//   });

//   describe('leaveRoom', () => {
//     const oldMember = { id: 'user123', roomId: 'room123' };

//     it('should leave room successfully', async () => {
//       const roomWithUser = {
//         ...mockRoom,
//         participants: [{ id: 'user123', username: 'testuser' }],
//       };
//       roomRepository.getRoomById.mockResolvedValue(roomWithUser);
//       roomRepository.leaveRoom.mockResolvedValue(oldMember);
//       userRepository.getUserById.mockResolvedValue(mockUser);
//       roomMessageService.sendSystemMessage.mockResolvedValue('System message');

//       const result = await service.leaveRoom('room123', 'user123');

//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//       expect(roomRepository.leaveRoom).toHaveBeenCalledWith('room123', 'user123');
//       expect(userRepository.getUserById).toHaveBeenCalledWith('user123');
//       expect(roomMessageService.sendSystemMessage).toHaveBeenCalledWith(
//         'room123',
//         'User testuser left the room',
//         'user123',
//       );
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'System message',
//         data: { ...oldMember, timestamp: expect.any(Date) },
//       });
//     });

//     it('should throw NotFoundException when room not found', async () => {
//       roomRepository.getRoomById.mockResolvedValue(null);

//       await expect(service.leaveRoom('nonexistent', 'user123')).rejects.toThrow(
//         new NotFoundException('Room not found'),
//       );
//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('nonexistent');
//     });

//     it('should throw BadRequestException when user is not a participant', async () => {
//       roomRepository.getRoomById.mockResolvedValue(mockRoom);

//       await expect(service.leaveRoom('room123', 'nonparticipant')).rejects.toThrow(
//         new BadRequestException('You are not a participant of this room'),
//       );
//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//     });
//   });

//   describe('canMessage', () => {
//     it('should return true when user is room member', async () => {
//       roomRepository.isRoomMember.mockResolvedValue(true);

//       const result = await service.canMessage('room123', 'user123');

//       expect(roomRepository.isRoomMember).toHaveBeenCalledWith('room123', 'user123');
//       expect(result).toBe(true);
//     });

//     it('should return false when user is not room member', async () => {
//       roomRepository.isRoomMember.mockResolvedValue(false);

//       const result = await service.canMessage('room123', 'user123');

//       expect(roomRepository.isRoomMember).toHaveBeenCalledWith('room123', 'user123');
//       expect(result).toBe(false);
//     });
//   });

//   describe('findById', () => {
//     it('should return room when found', async () => {
//       roomRepository.getRoomById.mockResolvedValue(mockRoom);

//       const result = await service.findById('room123');

//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('room123');
//       expect(result).toEqual(mockRoom);
//     });

//     it('should throw NotFoundException when room not found', async () => {
//       roomRepository.getRoomById.mockResolvedValue(null);

//       await expect(service.findById('nonexistent')).rejects.toThrow(
//         new NotFoundException('Room not found'),
//       );
//       expect(roomRepository.getRoomById).toHaveBeenCalledWith('nonexistent');
//     });
//   });
// });
