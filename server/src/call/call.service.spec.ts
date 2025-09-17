// import { Test, TestingModule } from '@nestjs/testing';
// import { CallService } from './call.service';
// import { CallRepository } from './call.repository';
// import { NotFoundException, ForbiddenException } from '@nestjs/common';
// import { StartCallDto } from './dto/start-call.dto';

// describe('CallService', () => {
//   let service: CallService;
//   let callRepository: jest.Mocked<CallRepository>;

//   const mockRoom = {
//     id: 'room123',
//     name: 'Test Room',
//     participants: [
//       { id: 'user1', username: 'user1' },
//       { id: 'user2', username: 'user2' },
//     ],
//   };

//   const mockCallSession = {
//     id: 'session123',
//     roomId: 'room123',
//     userId: 'user123',
//     startTime: new Date(),
//     duration: null,
//     createdAt: new Date(),
//   };

//   const mockCallRepository = {
//     findRoomWithAccess: jest.fn(),
//     createCallSession: jest.fn(),
//     findCallSessionById: jest.fn(),
//     updateCallSessionDuration: jest.fn(),
//     findUserCallHistory: jest.fn(),
//     countUserCallHistory: jest.fn(),
//     findRoomCallHistory: jest.fn(),
//     aggregateUserCallStats: jest.fn(),
//     findRecentUserCalls: jest.fn(),
//     aggregateAllCallStats: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         CallService,
//         {
//           provide: CallRepository,
//           useValue: mockCallRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<CallService>(CallService);
//     callRepository = module.get(CallRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('startCall', () => {
//     const startCallDto: StartCallDto = {
//       roomId: 'room123',
//       type: 'VIDEO',
//     };

//     it('should start call successfully', async () => {
//       callRepository.findRoomWithAccess.mockResolvedValue(mockRoom);
//       callRepository.createCallSession.mockResolvedValue(mockCallSession);

//       const result = await service.startCall('user123', startCallDto);

//       expect(callRepository.findRoomWithAccess).toHaveBeenCalledWith('room123', 'user123');
//       expect(callRepository.createCallSession).toHaveBeenCalledWith('room123', 'user123');
//       expect(result).toEqual({
//         callSession: mockCallSession,
//         room: {
//           id: mockRoom.id,
//           name: mockRoom.name,
//           participants: mockRoom.participants,
//         },
//         stunServers: expect.any(Array),
//       });
//     });

//     it('should throw NotFoundException when room not found or access denied', async () => {
//       callRepository.findRoomWithAccess.mockResolvedValue(null);

//       await expect(service.startCall('user123', startCallDto)).rejects.toThrow(
//         new NotFoundException('Room not found or access denied'),
//       );
//       expect(callRepository.findRoomWithAccess).toHaveBeenCalledWith('room123', 'user123');
//     });
//   });

//   describe('endCall', () => {
//     it('should end call successfully', async () => {
//       const updatedSession = { ...mockCallSession, duration: 300 };
//       callRepository.findCallSessionById.mockResolvedValue(mockCallSession);
//       callRepository.updateCallSessionDuration.mockResolvedValue(updatedSession);

//       const result = await service.endCall('user123', 'session123', 300);

//       expect(callRepository.findCallSessionById).toHaveBeenCalledWith('session123');
//       expect(callRepository.updateCallSessionDuration).toHaveBeenCalledWith('session123', 300);
//       expect(result).toEqual(updatedSession);
//     });

//     it('should throw NotFoundException when call session not found', async () => {
//       callRepository.findCallSessionById.mockResolvedValue(null);

//       await expect(service.endCall('user123', 'session123', 300)).rejects.toThrow(
//         new NotFoundException('Call session not found'),
//       );
//     });

//     it('should throw NotFoundException when user does not own the call session', async () => {
//       const otherUserSession = { ...mockCallSession, userId: 'otheruser' };
//       callRepository.findCallSessionById.mockResolvedValue(otherUserSession);

//       await expect(service.endCall('user123', 'session123', 300)).rejects.toThrow(
//         new NotFoundException('Call session not found'),
//       );
//     });
//   });

//   describe('getCallHistory', () => {
//     const mockCalls = [mockCallSession];

//     it('should return call history with pagination', async () => {
//       callRepository.findUserCallHistory.mockResolvedValue(mockCalls);
//       callRepository.countUserCallHistory.mockResolvedValue(1);

//       const result = await service.getCallHistory('user123', 1, 10);

//       expect(callRepository.findUserCallHistory).toHaveBeenCalledWith('user123', 0, 10);
//       expect(callRepository.countUserCallHistory).toHaveBeenCalledWith('user123');
//       expect(result).toEqual({
//         calls: mockCalls,
//         pagination: {
//           page: 1,
//           limit: 10,
//           total: 1,
//           totalPages: 1,
//         },
//       });
//     });

//     it('should use default pagination values', async () => {
//       callRepository.findUserCallHistory.mockResolvedValue(mockCalls);
//       callRepository.countUserCallHistory.mockResolvedValue(1);

//       await service.getCallHistory('user123');

//       expect(callRepository.findUserCallHistory).toHaveBeenCalledWith('user123', 0, 10);
//     });
//   });

//   describe('getRoomCallHistory', () => {
//     it('should return room call history when user has access', async () => {
//       const roomCalls = [mockCallSession];
//       callRepository.findRoomWithAccess.mockResolvedValue(mockRoom);
//       callRepository.findRoomCallHistory.mockResolvedValue(roomCalls);

//       const result = await service.getRoomCallHistory('user123', 'room123');

//       expect(callRepository.findRoomWithAccess).toHaveBeenCalledWith('room123', 'user123');
//       expect(callRepository.findRoomCallHistory).toHaveBeenCalledWith('room123');
//       expect(result).toEqual(roomCalls);
//     });

//     it('should throw ForbiddenException when user does not have access', async () => {
//       callRepository.findRoomWithAccess.mockResolvedValue(null);

//       await expect(service.getRoomCallHistory('user123', 'room123')).rejects.toThrow(
//         new ForbiddenException('Access denied to room'),
//       );
//     });
//   });

//   describe('getCallStats', () => {
//     const mockStats = {
//       _sum: { duration: 1800 },
//       _count: { id: 5 },
//       _avg: { duration: 360 },
//     };

//     const mockRecentCalls = [
//       { createdAt: new Date('2023-01-01'), duration: 300 },
//       { createdAt: new Date('2023-01-01'), duration: 600 },
//       { createdAt: new Date('2023-01-02'), duration: 900 },
//     ];

//     it('should return user call statistics', async () => {
//       callRepository.aggregateUserCallStats.mockResolvedValue(mockStats);
//       callRepository.findRecentUserCalls.mockResolvedValue(mockRecentCalls);

//       const result = await service.getCallStats('user123');

//       expect(callRepository.aggregateUserCallStats).toHaveBeenCalledWith('user123');
//       expect(callRepository.findRecentUserCalls).toHaveBeenCalledWith(
//         'user123',
//         expect.any(Date),
//       );
//       expect(result).toEqual({
//         totalDuration: 1800,
//         totalCalls: 5,
//         avgDuration: 360,
//         recentActivity: expect.any(Array),
//       });
//     });

//     it('should handle null stats gracefully', async () => {
//       const nullStats = {
//         _sum: { duration: null },
//         _count: { id: null },
//         _avg: { duration: null },
//       };
//       callRepository.aggregateUserCallStats.mockResolvedValue(nullStats);
//       callRepository.findRecentUserCalls.mockResolvedValue([]);

//       const result = await service.getCallStats('user123');

//       expect(result).toEqual({
//         totalDuration: 0,
//         totalCalls: 0,
//         avgDuration: 0,
//         recentActivity: [],
//       });
//     });
//   });

//   describe('getAllCallStats', () => {
//     it('should return global call statistics', async () => {
//       const mockGlobalStats = {
//         _count: { id: 100 },
//         _sum: { duration: 36000 },
//         _avg: { duration: 360 },
//       };
//       callRepository.aggregateAllCallStats.mockResolvedValue(mockGlobalStats);

//       const result = await service.getAllCallStats();

//       expect(callRepository.aggregateAllCallStats).toHaveBeenCalled();
//       expect(result).toEqual({
//         totalCalls: 100,
//         totalDuration: 36000,
//         avgDuration: 360,
//       });
//     });
//   });

//   describe('getActiveCallRooms', () => {
//     it('should return empty array for active call rooms', async () => {
//       const result = await service.getActiveCallRooms();
//       expect(result).toEqual([]);
//     });
//   });

//   describe('private methods', () => {
//     describe('getSTUNServers', () => {
//       it('should return default STUN servers when no environment variables are set', () => {
//         const result = (service as any).getSTUNServers();

//         expect(result).toEqual([
//           { urls: 'stun:stun.l.google.com:19302' },
//           { urls: 'stun:stun1.l.google.com:19302' },
//         ]);
//       });
//     });

//     describe('groupCallsByDay', () => {
//       it('should group calls by day correctly', () => {
//         const calls = [
//           { createdAt: new Date('2023-01-01T10:00:00Z'), duration: 300 },
//           { createdAt: new Date('2023-01-01T15:00:00Z'), duration: 600 },
//           { createdAt: new Date('2023-01-02T12:00:00Z'), duration: 900 },
//         ];

//         const result = (service as any).groupCallsByDay(calls);

//         expect(result).toEqual([
//           {
//             date: '2023-01-01',
//             count: 2,
//             totalDuration: 900,
//             avgDuration: 450,
//           },
//           {
//             date: '2023-01-02',
//             count: 1,
//             totalDuration: 900,
//             avgDuration: 900,
//           },
//         ]);
//       });
//     });
//   });
// });
