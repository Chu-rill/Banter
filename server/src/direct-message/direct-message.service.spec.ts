// import { Test, TestingModule } from '@nestjs/testing';
// import { DirectMessageService } from './direct-message.service';
// import { DirectMessageRepository } from './direct-message-repository';

// describe('DirectMessageService', () => {
//   let service: DirectMessageService;
//   let repository: jest.Mocked<DirectMessageRepository>;

//   const mockMessage = {
//     id: 'message123',
//     senderId: 'user123',
//     receiverId: 'user456',
//     content: 'Hello there!',
//     type: 'TEXT',
//     mediaType: null,
//     mediaUrl: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const mockConversation = {
//     messages: [mockMessage],
//     participants: [
//       { id: 'user123', username: 'sender' },
//       { id: 'user456', username: 'receiver' },
//     ],
//   };

//   const mockRepository = {
//     sendMessage: jest.fn(),
//     getConversation: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         DirectMessageService,
//         {
//           provide: DirectMessageRepository,
//           useValue: mockRepository,
//         },
//       ],
//     }).compile();

//     service = module.get<DirectMessageService>(DirectMessageService);
//     repository = module.get(DirectMessageRepository);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('sendDirectMessage', () => {
//     it('should send text message successfully', async () => {
//       repository.sendMessage.mockResolvedValue(mockMessage);

//       const result = await service.sendDirectMessage(
//         'user123',
//         'user456',
//         'Hello there!',
//         null,
//         'TEXT',
//         null,
//       );

//       expect(repository.sendMessage).toHaveBeenCalledWith(
//         'user123',
//         'user456',
//         'Hello there!',
//         'TEXT',
//         null,
//         null,
//       );
//       expect(result).toEqual(mockMessage);
//     });

//     it('should send media message successfully', async () => {
//       const mediaMessage = {
//         ...mockMessage,
//         content: null,
//         type: 'MEDIA',
//         mediaType: 'IMAGE',
//         mediaUrl: 'https://example.com/image.jpg',
//       };
//       repository.sendMessage.mockResolvedValue(mediaMessage);

//       const result = await service.sendDirectMessage(
//         'user123',
//         'user456',
//         null,
//         'https://example.com/image.jpg',
//         'MEDIA',
//         'IMAGE',
//       );

//       expect(repository.sendMessage).toHaveBeenCalledWith(
//         'user123',
//         'user456',
//         null,
//         'MEDIA',
//         'IMAGE',
//         'https://example.com/image.jpg',
//       );
//       expect(result).toEqual(mediaMessage);
//     });

//     it('should send message with undefined optional parameters', async () => {
//       repository.sendMessage.mockResolvedValue(mockMessage);

//       const result = await service.sendDirectMessage('user123', 'user456', 'Hello!');

//       expect(repository.sendMessage).toHaveBeenCalledWith(
//         'user123',
//         'user456',
//         'Hello!',
//         undefined,
//         undefined,
//         undefined,
//       );
//       expect(result).toEqual(mockMessage);
//     });
//   });

//   describe('getChat', () => {
//     it('should get conversation with default limit', async () => {
//       repository.getConversation.mockResolvedValue(mockConversation);

//       const result = await service.getChat('user123', 'user456');

//       expect(repository.getConversation).toHaveBeenCalledWith('user123', 'user456', 50);
//       expect(result).toEqual(mockConversation);
//     });

//     it('should get conversation with custom limit', async () => {
//       repository.getConversation.mockResolvedValue(mockConversation);

//       const result = await service.getChat('user123', 'user456', 100);

//       expect(repository.getConversation).toHaveBeenCalledWith('user123', 'user456', 100);
//       expect(result).toEqual(mockConversation);
//     });

//     it('should handle empty conversation', async () => {
//       const emptyConversation = {
//         messages: [],
//         participants: [
//           { id: 'user123', username: 'sender' },
//           { id: 'user456', username: 'receiver' },
//         ],
//       };
//       repository.getConversation.mockResolvedValue(emptyConversation);

//       const result = await service.getChat('user123', 'user456');

//       expect(repository.getConversation).toHaveBeenCalledWith('user123', 'user456', 50);
//       expect(result).toEqual(emptyConversation);
//       expect(result.messages).toHaveLength(0);
//     });
//   });
// });
