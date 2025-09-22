// import { Test, TestingModule } from '@nestjs/testing';
// import { RoomMessageService } from './room-message.service';
// import { RoomMessageRepository } from './room-message.repository';
// import { MessageType, MediaType } from '../../generated/prisma';

// describe('RoomMessageService', () => {
//   let service: RoomMessageService;
//   let repository: jest.Mocked<RoomMessageRepository>;

//   const mockMessage = {
//     id: 'message123',
//     roomId: 'room123',
//     userId: 'user123',
//     content: 'Hello room!',
//     type: MessageType.TEXT,
//     mediaUrl: null,
//     mediaType: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     user: {
//       id: 'user123',
//       username: 'testuser',
//       avatar: 'avatar.png',
//     },
//   };

//   const mockSystemMessage = {
//     ...mockMessage,
//     type: MessageType.SYSTEM,
//     content: 'User joined the room',
//   };

//   const mockRepository = {
//     createMessage: jest.fn(),
//     getMessages: jest.fn(),
//     markMessagesAsRead: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         RoomMessageService,
//         {
//           provide: RoomMessageRepository,
//           useValue: mockRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<RoomMessageService>(RoomMessageService);
//     repository = module.get(RoomMessageRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('sendMessage', () => {
//     it('should send text message successfully', async () => {
//       repository.createMessage.mockResolvedValue(mockMessage);

//       const result = await service.sendMessage(
//         'room123',
//         'user123',
//         'Hello room!',
//         MessageType.TEXT,
//       );

//       expect(repository.createMessage).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         'Hello room!',
//         MessageType.TEXT,
//         undefined,
//         undefined,
//       );
//       expect(result).toEqual(mockMessage);
//     });

//     it('should send media message successfully', async () => {
//       const mediaMessage = {
//         ...mockMessage,
//         content: null,
//         type: MessageType.MEDIA,
//         mediaUrl: 'https://example.com/image.jpg',
//         mediaType: MediaType.IMAGE,
//       };
//       repository.createMessage.mockResolvedValue(mediaMessage);

//       const result = await service.sendMessage(
//         'room123',
//         'user123',
//         null,
//         MessageType.MEDIA,
//         'https://example.com/image.jpg',
//         MediaType.IMAGE,
//       );

//       expect(repository.createMessage).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         null,
//         MessageType.MEDIA,
//         'https://example.com/image.jpg',
//         MediaType.IMAGE,
//       );
//       expect(result).toEqual(mediaMessage);
//     });

//     it('should throw error when both content and media are missing', async () => {
//       await expect(
//         service.sendMessage('room123', 'user123', null, MessageType.TEXT, null),
//       ).rejects.toThrow('Message must have content or media');

//       expect(repository.createMessage).not.toHaveBeenCalled();
//     });

//     it('should allow message with content only', async () => {
//       repository.createMessage.mockResolvedValue(mockMessage);

//       await service.sendMessage('room123', 'user123', 'Hello!');

//       expect(repository.createMessage).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         'Hello!',
//         undefined,
//         undefined,
//         undefined,
//       );
//     });

//     it('should allow message with media only', async () => {
//       const mediaOnlyMessage = {
//         ...mockMessage,
//         content: null,
//         mediaUrl: 'https://example.com/file.pdf',
//       };
//       repository.createMessage.mockResolvedValue(mediaOnlyMessage);

//       await service.sendMessage(
//         'room123',
//         'user123',
//         null,
//         MessageType.MEDIA,
//         'https://example.com/file.pdf',
//       );

//       expect(repository.createMessage).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         null,
//         MessageType.MEDIA,
//         'https://example.com/file.pdf',
//         undefined,
//       );
//     });
//   });

//   describe('getRoomMessages', () => {
//     const mockMessages = [mockMessage];

//     it('should get room messages with default limit', async () => {
//       repository.getMessages.mockResolvedValue(mockMessages);

//       const result = await service.getRoomMessages('room123', 'user123');

//       expect(repository.getMessages).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         50,
//         undefined,
//       );
//       expect(result).toEqual(mockMessages);
//     });

//     it('should get room messages with custom limit and cursor', async () => {
//       repository.getMessages.mockResolvedValue(mockMessages);

//       const result = await service.getRoomMessages('room123', 'user123', 100, 'cursor123');

//       expect(repository.getMessages).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         100,
//         'cursor123',
//       );
//       expect(result).toEqual(mockMessages);
//     });

//     it('should handle empty message list', async () => {
//       repository.getMessages.mockResolvedValue([]);

//       const result = await service.getRoomMessages('room123', 'user123');

//       expect(repository.getMessages).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         50,
//         undefined,
//       );
//       expect(result).toEqual([]);
//     });
//   });

//   describe('sendSystemMessage', () => {
//     it('should send system message successfully', async () => {
//       repository.createMessage.mockResolvedValue(mockSystemMessage);

//       const result = await service.sendSystemMessage('room123', 'User joined the room', 'user123');

//       expect(repository.createMessage).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         'User joined the room',
//         MessageType.SYSTEM,
//       );
//       expect(result).toEqual({
//         room: mockSystemMessage.roomId,
//         user: mockSystemMessage.user.username,
//         content: mockSystemMessage.content,
//         timestamp: mockSystemMessage.createdAt,
//       });
//     });

//     it('should format system message response correctly', async () => {
//       const systemMessage = {
//         ...mockSystemMessage,
//         content: 'User left the room',
//       };
//       repository.createMessage.mockResolvedValue(systemMessage);

//       const result = await service.sendSystemMessage('room123', 'User left the room', 'user123');

//       expect(result).toMatchObject({
//         room: 'room123',
//         user: 'testuser',
//         content: 'User left the room',
//         timestamp: expect.any(Date),
//       });
//     });
//   });

//   describe('markMessagesRead', () => {
//     const mockReadData = {
//       readCount: 5,
//       lastReadMessageId: 'message456',
//       updatedAt: new Date(),
//     };

//     it('should mark messages as read successfully', async () => {
//       repository.markMessagesAsRead.mockResolvedValue(mockReadData);

//       const result = await service.markMessagesRead('room123', 'user123', 'message456');

//       expect(repository.markMessagesAsRead).toHaveBeenCalledWith(
//         'room123',
//         'user123',
//         'message456',
//       );
//       expect(result).toEqual(mockReadData);
//     });

//     it('should handle marking messages read with different message IDs', async () => {
//       repository.markMessagesAsRead.mockResolvedValue(mockReadData);

//       await service.markMessagesRead('room456', 'user456', 'message789');

//       expect(repository.markMessagesAsRead).toHaveBeenCalledWith(
//         'room456',
//         'user456',
//         'message789',
//       );
//     });
//   });
// });
