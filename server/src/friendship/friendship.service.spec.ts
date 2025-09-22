// import { Test, TestingModule } from '@nestjs/testing';
// import { FriendshipService } from './friendship.service';
// import { FriendshipRepository } from './friendship.repository';
// import { PrismaService } from '../prisma/prisma.service';
// import { UserRepository } from '../user/user.repository';
// import { AppGateway } from '../gateway/app.gateway';
// import { BadRequestException, Logger } from '@nestjs/common';
// import { FriendStatus } from '../../generated/prisma';

// describe('FriendshipService', () => {
//   let service: FriendshipService;
//   let friendshipRepository: jest.Mocked<FriendshipRepository>;
//   let prismaService: jest.Mocked<PrismaService>;
//   let userRepository: jest.Mocked<UserRepository>;
//   let gateway: jest.Mocked<AppGateway>;

//   const mockUser = {
//     id: 'user123',
//     username: 'testuser',
//     email: 'test@example.com',
//     avatar: 'avatar.png',
//   };

//   const mockFriendship = {
//     id: 'friendship123',
//     requesterId: 'user123',
//     receiverId: 'user456',
//     status: FriendStatus.PENDING,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockNotification = {
//     id: 'notification123',
//     userId: 'user456',
//     type: 'FRIEND_REQUEST',
//     message: 'You have a new friend request from testuser',
//     metadata: {
//       requesterId: 'user123',
//       requesterName: 'testuser',
//       requesterAvatar: 'avatar.png',
//     },
//     createdAt: new Date(),
//   };

//   const mockFriendshipRepository = {
//     existing: jest.fn(),
//     sendFriendRequest: jest.fn(),
//     respondToRequest: jest.fn(),
//     getFriendshipsByStatus: jest.fn(),
//     areFriends: jest.fn(),
//   };

//   const mockPrismaService = {
//     notification: {
//       create: jest.fn(),
//     },
//   };

//   const mockUserRepository = {
//     getUserById: jest.fn(),
//   };

//   const mockGateway = {
//     server: {
//       emit: jest.fn(),
//     },
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         FriendshipService,
//         {
//           provide: FriendshipRepository,
//           useValue: mockFriendshipRepository,
//         },
//         {
//           provide: PrismaService,
//           useValue: mockPrismaService,
//         },
//         {
//           provide: UserRepository,
//           useValue: mockUserRepository,
//         },
//         {
//           provide: AppGateway,
//           useValue: mockGateway,
//         },
//       ],
//     }).compile();

//     service = module.get<FriendshipService>(FriendshipService);
//     friendshipRepository = module.get(FriendshipRepository);
//     prismaService = module.get(PrismaService);
//     userRepository = module.get(UserRepository);
//     gateway = module.get(AppGateway);

//     // Mock the logger to avoid console output during tests
//     jest.spyOn(Logger.prototype, 'error').mockImplementation();
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('addFriend', () => {
//     it('should send friend request successfully', async () => {
//       friendshipRepository.existing.mockResolvedValue(null);
//       friendshipRepository.sendFriendRequest.mockResolvedValue(mockFriendship);
//       userRepository.getUserById.mockResolvedValue(mockUser);
//       mockPrismaService.notification.create.mockResolvedValue(mockNotification);

//       const result = await service.addFriend('user123', 'user456');

//       expect(friendshipRepository.existing).toHaveBeenCalledWith('user123', 'user456');
//       expect(friendshipRepository.sendFriendRequest).toHaveBeenCalledWith('user123', 'user456');
//       expect(userRepository.getUserById).toHaveBeenCalledWith('user123');
//       expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
//         data: {
//           userId: 'user456',
//           type: 'FRIEND_REQUEST',
//           message: 'You have a new friend request from testuser',
//           metadata: {
//             requesterId: 'user123',
//             requesterName: 'testuser',
//             requesterAvatar: 'avatar.png',
//           },
//         },
//       });
//       expect(gateway.server.emit).toHaveBeenCalledWith('notification:friend', mockNotification);
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Friend request sent successfully',
//         data: mockFriendship,
//       });
//     });

//     it('should throw BadRequestException when friendship already exists', async () => {
//       friendshipRepository.existing.mockResolvedValue(mockFriendship);

//       await expect(service.addFriend('user123', 'user456')).rejects.toThrow(
//         new BadRequestException('Friendship already exists'),
//       );
//       expect(friendshipRepository.existing).toHaveBeenCalledWith('user123', 'user456');
//     });
//   });

//   describe('updateFriendshipStatus', () => {
//     it('should accept friend request successfully', async () => {
//       const acceptedFriendship = { ...mockFriendship, status: FriendStatus.ACCEPTED };
//       friendshipRepository.respondToRequest.mockResolvedValue(acceptedFriendship);
//       userRepository.getUserById.mockResolvedValue(mockUser);
//       mockPrismaService.notification.create.mockResolvedValue(mockNotification);

//       const result = await service.updateFriendshipStatus(
//         'friendship123',
//         'user123',
//         'user456',
//         FriendStatus.ACCEPTED,
//       );

//       expect(friendshipRepository.respondToRequest).toHaveBeenCalledWith(
//         'friendship123',
//         FriendStatus.ACCEPTED,
//       );
//       expect(userRepository.getUserById).toHaveBeenCalledWith('user123');
//       expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
//         data: {
//           userId: 'user456',
//           type: 'FRIEND_ACCEPTED',
//           message: 'You accepted the request from testuser',
//           metadata: {
//             requesterId: 'user123',
//             requesterName: 'testuser',
//             requesterAvatar: 'avatar.png',
//           },
//         },
//       });
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Friend request accepted successfully',
//         data: acceptedFriendship,
//       });
//     });

//     it('should decline friend request successfully', async () => {
//       const declinedFriendship = { ...mockFriendship, status: FriendStatus.DECLINED };
//       friendshipRepository.respondToRequest.mockResolvedValue(declinedFriendship);
//       userRepository.getUserById.mockResolvedValue(mockUser);
//       mockPrismaService.notification.create.mockResolvedValue(mockNotification);

//       const result = await service.updateFriendshipStatus(
//         'friendship123',
//         'user123',
//         'user456',
//         FriendStatus.DECLINED,
//       );

//       expect(result.message).toBe('Friend request declined successfully');
//       expect(result.data).toEqual(declinedFriendship);
//     });

//     it('should block friend successfully', async () => {
//       const blockedFriendship = { ...mockFriendship, status: FriendStatus.BLOCKED };
//       friendshipRepository.respondToRequest.mockResolvedValue(blockedFriendship);
//       userRepository.getUserById.mockResolvedValue(mockUser);
//       mockPrismaService.notification.create.mockResolvedValue(mockNotification);

//       const result = await service.updateFriendshipStatus(
//         'friendship123',
//         'user123',
//         'user456',
//         FriendStatus.BLOCKED,
//       );

//       expect(result.message).toBe('Friend blocked successfully');
//       expect(result.data).toEqual(blockedFriendship);
//     });

//     it('should handle repository errors', async () => {
//       friendshipRepository.respondToRequest.mockRejectedValue(new Error('Database error'));
//       userRepository.getUserById.mockResolvedValue(mockUser);

//       await expect(
//         service.updateFriendshipStatus(
//           'friendship123',
//           'user123',
//           'user456',
//           FriendStatus.ACCEPTED,
//         ),
//       ).rejects.toThrow(new BadRequestException('Failed to update friendship'));

//       expect(Logger.prototype.error).toHaveBeenCalled();
//     });
//   });

//   describe('listFriends', () => {
//     it('should return list of friends', async () => {
//       const friends = [mockFriendship];
//       friendshipRepository.getFriendshipsByStatus.mockResolvedValue(friends);

//       const result = await service.listFriends('user123');

//       expect(friendshipRepository.getFriendshipsByStatus).toHaveBeenCalledWith(
//         'user123',
//         FriendStatus.ACCEPTED,
//       );
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'List of friends retrieved successfully',
//         data: friends,
//       });
//     });
//   });

//   describe('listRequests', () => {
//     it('should return list of friend requests', async () => {
//       const requests = [mockFriendship];
//       friendshipRepository.getFriendshipsByStatus.mockResolvedValue(requests);

//       const result = await service.listRequests('user123');

//       expect(friendshipRepository.getFriendshipsByStatus).toHaveBeenCalledWith(
//         'user123',
//         FriendStatus.PENDING,
//       );
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'List of friend requests retrieved successfully',
//         data: requests,
//       });
//     });
//   });

//   describe('listBlocked', () => {
//     it('should return list of blocked friends', async () => {
//       const blocked = [mockFriendship];
//       friendshipRepository.getFriendshipsByStatus.mockResolvedValue(blocked);

//       const result = await service.listBlocked('user123');

//       expect(friendshipRepository.getFriendshipsByStatus).toHaveBeenCalledWith(
//         'user123',
//         FriendStatus.BLOCKED,
//       );
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'List of blocked friend retrieved successfully',
//         data: blocked,
//       });
//     });
//   });

//   describe('canSendMessage', () => {
//     it('should return true when users are friends', async () => {
//       friendshipRepository.areFriends.mockResolvedValue(true);

//       const result = await service.canSendMessage('user123', 'user456');

//       expect(friendshipRepository.areFriends).toHaveBeenCalledWith('user123', 'user456');
//       expect(result).toBe(true);
//     });

//     it('should return false when users are not friends', async () => {
//       friendshipRepository.areFriends.mockResolvedValue(false);

//       const result = await service.canSendMessage('user123', 'user456');

//       expect(friendshipRepository.areFriends).toHaveBeenCalledWith('user123', 'user456');
//       expect(result).toBe(false);
//     });
//   });
// });
