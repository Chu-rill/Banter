// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthService } from './email-password-auth.service';
// import { UserRepository } from '../../user/user.repository';
// import { UserService } from '../../user/user.service';
// import { EmailService } from '../../email/email.service';
// import { RoomMessageGateway } from '../../room-message/room-message.gateway';
// import { JwtService } from '@nestjs/jwt';
// import {
//   ConflictException,
//   UnauthorizedException,
//   BadRequestException,
//   NotFoundException,
//   InternalServerErrorException,
//   Logger,
// } from '@nestjs/common';
// import {
//   SignupDto,
//   LoginDto,
//   VerifyEmailDto,
//   EmailValidationDto,
//   ForgotPasswordDto,
// } from './validation';
// import * as crypto from 'crypto';

// jest.mock('../../utils/helper-functions/encryption', () => ({
//   encrypt: jest.fn(),
//   comparePassword: jest.fn(),
// }));

// const { encrypt, comparePassword } = require('../../utils/helper-functions/encryption');

// describe('AuthService', () => {
//   let service: AuthService;
//   let userRepository: jest.Mocked<UserRepository>;
//   let userService: jest.Mocked<UserService>;
//   let jwtService: jest.Mocked<JwtService>;
//   let emailService: jest.Mocked<EmailService>;
//   let messageGateway: jest.Mocked<RoomMessageGateway>;

//   const mockUser = {
//     id: 'user123',
//     username: 'testuser',
//     email: 'test@example.com',
//     password: 'hashedPassword123',
//     isVerified: true,
//     createdAt: new Date(),
//     avatar: null,
//     actionTokenExpiry: new Date(Date.now() + 5 * 60 * 1000),
//   };

//   const mockUserRepository = {
//     getUserByEmail: jest.fn(),
//     createUser: jest.fn(),
//     findByActionToken: jest.fn(),
//     markUserAsVerified: jest.fn(),
//     updateActionToken: jest.fn(),
//     updateUserPassword: jest.fn(),
//   };

//   const mockUserService = {
//     updateOnlineStatus: jest.fn(),
//   };

//   const mockJwtService = {
//     signAsync: jest.fn(),
//   };

//   const mockEmailService = {
//     sendWelcomeEmail: jest.fn(),
//     forgetPasswordEmail: jest.fn(),
//     sendPasswordChangeConfirmation: jest.fn(),
//   };

//   const mockMessageGateway = {
//     broadcastUserStatus: jest.fn(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: UserRepository,
//           useValue: mockUserRepository,
//         },
//         {
//           provide: UserService,
//           useValue: mockUserService,
//         },
//         {
//           provide: JwtService,
//           useValue: mockJwtService,
//         },
//         {
//           provide: EmailService,
//           useValue: mockEmailService,
//         },
//         {
//           provide: RoomMessageGateway,
//           useValue: mockMessageGateway,
//         },
//       ],
//     }).compile();

//     service = module.get<AuthService>(AuthService);
//     userRepository = module.get(UserRepository);
//     userService = module.get(UserService);
//     jwtService = module.get(JwtService);
//     emailService = module.get(EmailService);
//     messageGateway = module.get(RoomMessageGateway);

//     // Mock the logger to avoid console output during tests
//     jest.spyOn(Logger.prototype, 'log').mockImplementation();
//     jest.spyOn(Logger.prototype, 'debug').mockImplementation();
//     jest.spyOn(Logger.prototype, 'warn').mockImplementation();
//     jest.spyOn(Logger.prototype, 'error').mockImplementation();
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('register', () => {
//     const registerDto: SignupDto = {
//       username: 'testuser',
//       email: 'test@example.com',
//       password: 'TestPass123',
//     };

//     it('should register user successfully', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(null);
//       encrypt.mockResolvedValue('hashedPassword123');
//       userRepository.createUser.mockResolvedValue(mockUser);
//       jest.spyOn(service, 'generateActionToken').mockResolvedValue('token123');
//       emailService.sendWelcomeEmail.mockResolvedValue(undefined);

//       const result = await service.register(registerDto);

//       expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(encrypt).toHaveBeenCalledWith('TestPass123');
//       expect(userRepository.createUser).toHaveBeenCalledWith(
//         'testuser',
//         'test@example.com',
//         'hashedPassword123',
//       );
//       expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
//       expect(result).toEqual({
//         statusCode: 201,
//         success: true,
//         message: 'User registered successfully. Please check your email for verification.',
//         data: {
//           id: mockUser.id,
//           username: mockUser.username,
//           email: mockUser.email,
//           createdAt: mockUser.createdAt,
//         },
//       });
//     });

//     it('should throw ConflictException when user already exists', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(mockUser);

//       await expect(service.register(registerDto)).rejects.toThrow(
//         new ConflictException('User already exists'),
//       );
//       expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
//     });

//     it('should handle email sending failure gracefully', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(null);
//       encrypt.mockResolvedValue('hashedPassword123');
//       userRepository.createUser.mockResolvedValue(mockUser);
//       jest.spyOn(service, 'generateActionToken').mockResolvedValue('token123');
//       emailService.sendWelcomeEmail.mockRejectedValue(new Error('Email failed'));

//       const result = await service.register(registerDto);

//       expect(result.statusCode).toBe(201);
//       expect(Logger.prototype.error).toHaveBeenCalled();
//     });
//   });

//   describe('login', () => {
//     const loginDto: LoginDto = {
//       email: 'test@example.com',
//       password: 'TestPass123',
//     };

//     it('should login user successfully', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(mockUser);
//       comparePassword.mockResolvedValue(true);
//       userService.updateOnlineStatus.mockResolvedValue(undefined);
//       messageGateway.broadcastUserStatus.mockResolvedValue(undefined);
//       jwtService.signAsync.mockResolvedValue('jwt-token-123');

//       const result = await service.login(loginDto);

//       expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(comparePassword).toHaveBeenCalledWith('TestPass123', mockUser.password);
//       expect(userService.updateOnlineStatus).toHaveBeenCalledWith(mockUser.id, true);
//       expect(jwtService.signAsync).toHaveBeenCalledWith({ userId: mockUser.id });
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Login successful',
//         data: {
//           id: mockUser.id,
//           username: mockUser.username,
//           email: mockUser.email,
//           isVerified: mockUser.isVerified,
//           avatar: mockUser.avatar,
//         },
//         token: 'jwt-token-123',
//       });
//     });

//     it('should throw UnauthorizedException when user not found', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(null);

//       await expect(service.login(loginDto)).rejects.toThrow(
//         new UnauthorizedException('Invalid credentials'),
//       );
//       expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
//     });

//     it('should throw UnauthorizedException when password is invalid', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(mockUser);
//       comparePassword.mockResolvedValue(false);

//       await expect(service.login(loginDto)).rejects.toThrow(
//         new UnauthorizedException('Invalid credentials'),
//       );
//     });

//     it('should throw UnauthorizedException when email is not verified', async () => {
//       const unverifiedUser = { ...mockUser, isVerified: false };
//       userRepository.getUserByEmail.mockResolvedValue(unverifiedUser);
//       comparePassword.mockResolvedValue(true);

//       await expect(service.login(loginDto)).rejects.toThrow(
//         new UnauthorizedException('Please verify your email before logging in'),
//       );
//     });
//   });

//   describe('logout', () => {
//     it('should logout user successfully', async () => {
//       userService.updateOnlineStatus.mockResolvedValue(undefined);
//       messageGateway.broadcastUserStatus.mockResolvedValue(undefined);

//       const result = await service.logout('user123');

//       expect(userService.updateOnlineStatus).toHaveBeenCalledWith('user123', false);
//       expect(messageGateway.broadcastUserStatus).toHaveBeenCalledWith('user123', true);
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'User logged out successfully',
//         data: null,
//       });
//     });
//   });

//   describe('confirmEmailAddress', () => {
//     const verifyDto: VerifyEmailDto = { token: 'verification-token' };

//     it('should confirm email successfully', async () => {
//       const unverifiedUser = { ...mockUser, isVerified: false };
//       userRepository.findByActionToken.mockResolvedValue(unverifiedUser);
//       userRepository.markUserAsVerified.mockResolvedValue(undefined);
//       jwtService.signAsync.mockResolvedValue('jwt-token-123');
//       userService.updateOnlineStatus.mockResolvedValue(undefined);

//       const result = await service.confirmEmailAddress(verifyDto);

//       expect(userRepository.findByActionToken).toHaveBeenCalledWith('verification-token');
//       expect(userRepository.markUserAsVerified).toHaveBeenCalledWith(unverifiedUser.id);
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Email confirmed successfully',
//         data: {
//           id: unverifiedUser.id,
//           username: unverifiedUser.username,
//           email: unverifiedUser.email,
//           isVerified: true,
//         },
//         token: 'jwt-token-123',
//       });
//     });

//     it('should throw NotFoundException when token is invalid', async () => {
//       userRepository.findByActionToken.mockResolvedValue(null);

//       await expect(service.confirmEmailAddress(verifyDto)).rejects.toThrow(
//         new NotFoundException('Invalid confirmation token'),
//       );
//     });

//     it('should throw BadRequestException when email is already verified', async () => {
//       userRepository.findByActionToken.mockResolvedValue(mockUser);

//       await expect(service.confirmEmailAddress(verifyDto)).rejects.toThrow(
//         new BadRequestException('Email is already verified'),
//       );
//     });
//   });

//   describe('resendEmailConfirmation', () => {
//     const emailDto: EmailValidationDto = { email: 'test@example.com' };

//     it('should resend confirmation email successfully', async () => {
//       const unverifiedUser = { ...mockUser, isVerified: false };
//       userRepository.getUserByEmail.mockResolvedValue(unverifiedUser);
//       jest.spyOn(service, 'generateActionToken').mockResolvedValue('new-token');
//       emailService.sendWelcomeEmail.mockResolvedValue(undefined);

//       const result = await service.resendEmailConfirmation(emailDto);

//       expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Confirmation email sent successfully',
//       });
//     });

//     it('should throw NotFoundException when user not found', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(null);

//       await expect(service.resendEmailConfirmation(emailDto)).rejects.toThrow(
//         new NotFoundException('User not found'),
//       );
//     });

//     it('should throw BadRequestException when email is already verified', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(mockUser);

//       await expect(service.resendEmailConfirmation(emailDto)).rejects.toThrow(
//         new BadRequestException('Email is already verified'),
//       );
//     });
//   });

//   describe('initiatePasswordReset', () => {
//     const emailDto: EmailValidationDto = { email: 'test@example.com' };

//     it('should initiate password reset successfully', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(mockUser);
//       jest.spyOn(service, 'generateActionToken').mockResolvedValue('reset-token');
//       emailService.forgetPasswordEmail.mockResolvedValue(undefined);

//       const result = await service.initiatePasswordReset(emailDto);

//       expect(userRepository.getUserByEmail).toHaveBeenCalledWith('test@example.com');
//       expect(emailService.forgetPasswordEmail).toHaveBeenCalled();
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Password reset link sent successfully',
//       });
//     });

//     it('should throw NotFoundException when user not found', async () => {
//       userRepository.getUserByEmail.mockResolvedValue(null);

//       await expect(service.initiatePasswordReset(emailDto)).rejects.toThrow(
//         new NotFoundException('User not found'),
//       );
//     });
//   });

//   describe('resetPassword', () => {
//     const resetDto: ForgotPasswordDto = {
//       token: 'reset-token',
//       newPassword: 'NewPass123',
//       confirmPassword: 'NewPass123',
//     };

//     it('should reset password successfully', async () => {
//       userRepository.findByActionToken.mockResolvedValue(mockUser);
//       encrypt.mockResolvedValue('newHashedPassword');
//       userRepository.updateUserPassword.mockResolvedValue(undefined);
//       emailService.sendPasswordChangeConfirmation.mockResolvedValue(undefined);

//       const result = await service.resetPassword(resetDto);

//       expect(userRepository.findByActionToken).toHaveBeenCalledWith('reset-token');
//       expect(encrypt).toHaveBeenCalledWith('NewPass123');
//       expect(userRepository.updateUserPassword).toHaveBeenCalledWith(
//         mockUser.id,
//         'newHashedPassword',
//       );
//       expect(emailService.sendPasswordChangeConfirmation).toHaveBeenCalled();
//       expect(result).toEqual({
//         statusCode: 200,
//         success: true,
//         message: 'Password has been reset successfully',
//       });
//     });

//     it('should throw BadRequestException when passwords do not match', async () => {
//       const mismatchedDto = { ...resetDto, confirmPassword: 'DifferentPass123' };

//       await expect(service.resetPassword(mismatchedDto)).rejects.toThrow(
//         new BadRequestException('Passwords do not match'),
//       );
//     });

//     it('should throw BadRequestException when token is invalid or expired', async () => {
//       userRepository.findByActionToken.mockResolvedValue(null);

//       await expect(service.resetPassword(resetDto)).rejects.toThrow(
//         new BadRequestException('Reset token is invalid or has expired'),
//       );
//     });

//     it('should throw BadRequestException when token is expired', async () => {
//       const expiredTokenUser = {
//         ...mockUser,
//         actionTokenExpiry: new Date(Date.now() - 60 * 1000),
//       };
//       userRepository.findByActionToken.mockResolvedValue(expiredTokenUser);

//       await expect(service.resetPassword(resetDto)).rejects.toThrow(
//         new BadRequestException('Reset token is invalid or has expired'),
//       );
//     });
//   });

//   describe('generateActionToken', () => {
//     it('should generate action token successfully', async () => {
//       const mockCrypto = jest.spyOn(crypto, 'randomBytes').mockReturnValue(
//         Buffer.from('mock-random-bytes'),
//       );
//       userRepository.updateActionToken.mockResolvedValue(undefined);

//       const result = await service.generateActionToken('user123');

//       expect(mockCrypto).toHaveBeenCalledWith(32);
//       expect(userRepository.updateActionToken).toHaveBeenCalledWith(
//         'user123',
//         expect.any(String),
//         expect.any(Date),
//       );
//       expect(result).toBe('6d6f636b2d72616e646f6d2d6279746573');

//       mockCrypto.mockRestore();
//     });

//     it('should handle errors during token generation', async () => {
//       userRepository.updateActionToken.mockRejectedValue(new Error('Database error'));

//       await expect(service.generateActionToken('user123')).rejects.toThrow(
//         InternalServerErrorException,
//       );
//     });
//   });
// });
