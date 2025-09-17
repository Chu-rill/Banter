// import { Test, TestingModule } from '@nestjs/testing';
// import { UserService } from './user.service';
// import { UserRepository } from './user.repository';
// import { NotFoundException } from '@nestjs/common';
// import { UpdateUserDto } from './validation';

// describe('UserService', () => {
//   let service: UserService;
//   let userRepository: jest.Mocked<UserRepository>;

//   const mockUser = {
//     id: 'user123',
//     username: 'testuser',
//     email: 'test@example.com',
//     avatar: 'avatar.png' as string | null,
//     isOnline: false,
//     isVerified: false, // Added missing property
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockUserRepository = {
//     getUserById: jest.fn(),
//     updateUser: jest.fn(),
//     getAllUsers: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         UserService,
//         {
//           provide: UserRepository,
//           useValue: mockUserRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<UserService>(UserService);
//     userRepository = module.get(UserRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('getUserById', () => {
//     it('should return user when found', async () => {
//       userRepository.getUserById.mockResolvedValue(mockUser);

//       const result = await service.getUserById('user123');

//       expect(userRepository.getUserById).toHaveBeenCalledWith('user123');
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'User retrieved successfully',
//         data: mockUser,
//       });
//     });

//     it('should throw NotFoundException when user not found', async () => {
//       userRepository.getUserById.mockResolvedValue('123');

//       await expect(service.getUserById('nonexistent')).rejects.toThrow(
//         new NotFoundException('User not found'),
//       );
//       expect(userRepository.getUserById).toHaveBeenCalledWith('nonexistent');
//     });
//   });

//   describe('updateUser', () => {
//     const updateData: UpdateUserDto = {
//       username: 'updateduser',
//       email: 'updated@example.com',
//     };

//     it('should update user successfully', async () => {
//       const updatedUser = { ...mockUser, ...updateData };
//       userRepository.updateUser.mockResolvedValue(updatedUser);

//       const result = await service.updateUser('user123', updateData);

//       expect(userRepository.updateUser).toHaveBeenCalledWith(
//         'user123',
//         updateData,
//       );
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Profile updated successfully',
//         data: updatedUser,
//       });
//     });

//     it('should throw NotFoundException when user not found during update', async () => {
//       userRepository.updateUser.mockRejectedValue(new Error('User not found'));

//       await expect(
//         service.updateUser('nonexistent', updateData),
//       ).rejects.toThrow(new NotFoundException('User not found'));
//       expect(userRepository.updateUser).toHaveBeenCalledWith(
//         'nonexistent',
//         updateData,
//       );
//     });
//   });

//   describe('getAllUsers', () => {
//     const mockUsers = [mockUser];
//     const mockTotal = 1;
//     const mockGetAllUsersResult = { users: mockUsers, total: mockTotal };

//     it('should return users with default pagination', async () => {
//       userRepository.getAllUsers.mockResolvedValue(mockGetAllUsersResult);

//       const result = await service.getAllUsers();

//       expect(userRepository.getAllUsers).toHaveBeenCalledWith(1, 10);
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Users retrieved successfully',
//         data: {
//           users: mockUsers,
//           pagination: {
//             page: 1,
//             limit: 10,
//             total: mockTotal,
//             totalPages: 1,
//             hasNext: false,
//             hasPrev: false,
//           },
//         },
//       });
//     });

//     it('should return users with custom pagination', async () => {
//       userRepository.getAllUsers.mockResolvedValue(mockGetAllUsersResult);

//       const result = await service.getAllUsers(2, 5);

//       expect(userRepository.getAllUsers).toHaveBeenCalledWith(2, 5);
//       expect(result.data.pagination).toEqual({
//         page: 2,
//         limit: 5,
//         total: mockTotal,
//         totalPages: 1,
//         hasNext: false,
//         hasPrev: true,
//       });
//     });

//     it('should handle safe defaults for invalid pagination values', async () => {
//       userRepository.getAllUsers.mockResolvedValue(mockGetAllUsersResult);

//       await service.getAllUsers(0, -5);

//       expect(userRepository.getAllUsers).toHaveBeenCalledWith(1, 10);
//     });

//     it('should limit maximum page size to 100', async () => {
//       userRepository.getAllUsers.mockResolvedValue(mockGetAllUsersResult);

//       await service.getAllUsers(1, 150);

//       expect(userRepository.getAllUsers).toHaveBeenCalledWith(1, 100);
//     });

//     it('should handle string values for page and limit', async () => {
//       userRepository.getAllUsers.mockResolvedValue(mockGetAllUsersResult);

//       await service.getAllUsers('2' as any, 'abc' as any);

//       expect(userRepository.getAllUsers).toHaveBeenCalledWith(2, 10);
//     });

//     it('should calculate pagination correctly with multiple pages', async () => {
//       const largeTotal = 25;
//       userRepository.getAllUsers.mockResolvedValue({
//         users: mockUsers,
//         total: largeTotal,
//       });

//       const result = await service.getAllUsers(2, 10);

//       expect(result.data.pagination).toEqual({
//         page: 2,
//         limit: 10,
//         total: largeTotal,
//         totalPages: 3,
//         hasNext: true,
//         hasPrev: true,
//       });
//     });
//   });

//   describe('updateOnlineStatus', () => {
//     it('should update user online status', async () => {
//       const updatedUser = { ...mockUser, isOnline: true };
//       userRepository.updateUser.mockResolvedValue(updatedUser);

//       const result = await service.updateOnlineStatus('user123', true);

//       expect(userRepository.updateUser).toHaveBeenCalledWith('user123', {
//         isOnline: true,
//       });
//       expect(result).toEqual(updatedUser);
//     });

//     it('should update user offline status', async () => {
//       const updatedUser = { ...mockUser, isOnline: false };
//       userRepository.updateUser.mockResolvedValue(updatedUser);

//       const result = await service.updateOnlineStatus('user123', false);

//       expect(userRepository.updateUser).toHaveBeenCalledWith('user123', {
//         isOnline: false,
//       });
//       expect(result).toEqual(updatedUser);
//     });
//   });

//   describe('edge cases', () => {
//     it('should handle user with null avatar', async () => {
//       const userWithNullAvatar = { ...mockUser, avatar: null };
//       userRepository.getUserById.mockResolvedValue(userWithNullAvatar);

//       const result = await service.getUserById('user123');

//       expect(result.data.avatar).toBeNull();
//     });

//     it('should handle verified user', async () => {
//       const verifiedUser = { ...mockUser, isVerified: true };
//       userRepository.getUserById.mockResolvedValue(verifiedUser);

//       const result = await service.getUserById('user123');

//       expect(result.data.isVerified).toBe(true);
//     });
//   });
// });
