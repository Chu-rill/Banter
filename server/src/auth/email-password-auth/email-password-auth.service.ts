import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import {
  SignupDto,
  LoginDto,
  VerifyEmailDto,
  EmailValidationDto,
  ForgotPasswordDto,
} from './validation';
import { UserRepository } from 'src/user/user.repository';
import {
  comparePassword,
  encrypt,
} from 'src/utils/helper-functions/encryption';
import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/email/email.service';
import { RoomMessageGateway } from 'src/room-message/room-message.gateway';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: EmailService,
    private readonly messageGateway: RoomMessageGateway,
  ) {}

  // AUTHENTICATION METHODS

  async register(registerDto: SignupDto) {
    const { username, email, password } = registerDto;
    this.logger.log(`Starting registration for email: ${email}`);

    try {
      // Check if user already exists
      this.logger.debug(`Checking if user exists with email: ${email}`);
      const existingUser = await this.userRepository.getUserByEmail(email);

      if (existingUser) {
        this.logger.warn(
          `Registration failed: User already exists with email: ${email}`,
        );
        throw new ConflictException('User already exists');
      }

      // Hash password
      this.logger.debug('Hashing password');
      const hashedPassword = await encrypt(password.trim());

      // Create user
      this.logger.debug(
        `Creating user with username: ${username}, email: ${email}`,
      );
      const user = await this.userRepository.createUser(
        username,
        email,
        hashedPassword,
      );

      this.logger.log(`User created successfully with ID: ${user.id}`);

      // Generate action token for email verification
      this.logger.debug(`Generating action token for user: ${user.id}`);
      const token = await this.generateActionToken(user.id);

      const emailData = {
        subject: 'Banter Verification Email',
        username: user.username,
        token,
      };

      // Send verification email
      this.logger.debug(`Sending welcome email to: ${user.email}`);
      try {
        await this.mailService.sendWelcomeEmail(user.email, emailData);
        this.logger.log(`Welcome email sent successfully to: ${user.email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send verification email to ${user.email}:`,
          emailError.stack,
        );
      }

      this.logger.log(
        `Registration completed successfully for user: ${user.id}`,
      );
      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message:
          'User registered successfully. Please check your email for verification.',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Registration failed for email ${email}:`, error.stack);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    this.logger.log(`Login attempt for email: ${email}`);

    try {
      // Find user
      this.logger.debug(`Looking up user with email: ${email}`);
      const user = await this.userRepository.getUserByEmail(email);

      if (!user) {
        this.logger.warn(`Login failed: User not found with email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check password
      this.logger.debug(`Verifying password for user: ${user.id}`);
      const isPasswordValid = await comparePassword(
        password.trim(),
        user.password!,
      );

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for user: ${user.id}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isVerified) {
        this.logger.warn(
          `Login failed: Email not verified for user: ${user.id}`,
        );
        throw new UnauthorizedException(
          'Please verify your email before logging in',
        );
      }

      // Update online status and generate tokens concurrently
      this.logger.debug(
        `Updating online status and generating tokens for user: ${user.id}`,
      );
      const [, , accessToken, refreshToken] = await Promise.all([
        this.userService.updateOnlineStatus(user.id, true),
        this.messageGateway.broadcastUserStatus(user.id, true),
        this.generateAuthToken(user.id),
        this.generateRefreshToken(user.id),
      ]);

      this.logger.log(`Login successful for user: ${user.id}`);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
          isOnline: user.isOnline,
          avatar: user.avatar,
        },
        token: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Login failed for email ${email}:`, error.stack);
      throw new InternalServerErrorException('Login failed');
    }
  }

  async logout(userId: string) {
    this.logger.log(`Logout request for user: ${userId}`);

    try {
      await Promise.all([
        this.userService.updateOnlineStatus(userId, false),
        this.messageGateway.broadcastUserStatus(userId, true),
        this.userRepository.revokeAllUserRefreshTokens(userId), // Revoke all refresh tokens
      ]);
      this.logger.log(`User logged out successfully: ${userId}`);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'User logged out successfully',
        data: null,
      };
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}:`, error.stack);
      throw new InternalServerErrorException('Logout failed');
    }
  }

  // Email Verification Methods

  async confirmEmailAddress(dto: VerifyEmailDto) {
    const { token } = dto;
    this.logger.log(
      `Email confirmation attempt with token: ${token.substring(0, 8)}...`,
    );

    try {
      // Find user by action token
      this.logger.debug(`Looking up user by action token`);
      const user = await this.userRepository.findByActionToken(token);

      if (!user) {
        this.logger.warn(
          `Email confirmation failed: Invalid token: ${token.substring(0, 8)}...`,
        );
        throw new NotFoundException('Invalid confirmation token');
      }

      // Check if token is expired
      if (!user.actionTokenExpiry && user.actionTokenExpiry! < new Date()) {
        this.logger.warn(
          `Email confirmation failed: Token expired for user: ${user.id}`,
        );
        throw new BadRequestException('Confirmation token has expired');
      }

      // Check if already verified
      if (user.isVerified) {
        this.logger.warn(
          `Email confirmation failed: Already verified for user: ${user.id}`,
        );
        throw new BadRequestException('Email is already verified');
      }

      // Mark user as verified, generate tokens, and update online status concurrently
      this.logger.debug(
        `Confirming user and updating status for user: ${user.id}`,
      );
      const [, accessToken, refreshToken] = await Promise.all([
        this.userRepository.markUserAsVerified(user.id),
        this.generateAuthToken(user.id),
        this.generateRefreshToken(user.id),
        this.userService.updateOnlineStatus(user.id, true),
      ]);

      this.logger.log(`Email confirmation successful for user: ${user.id}`);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Email confirmed successfully',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: true,
        },
        token: accessToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Email confirmation failed for token ${token.substring(0, 8)}...:`,
        error.stack,
      );
      throw new InternalServerErrorException('Email confirmation failed');
    }
  }

  async resendEmailConfirmation(dto: EmailValidationDto) {
    const { email } = dto;
    this.logger.log(`Resending email confirmation to: ${email}`);

    try {
      this.logger.debug(`Looking up user with email: ${email}`);
      const user = await this.userRepository.getUserByEmail(email);

      if (!user) {
        this.logger.warn(
          `Resend confirmation failed: User not found with email: ${email}`,
        );
        throw new NotFoundException('User not found');
      }

      if (user.isVerified) {
        this.logger.warn(
          `Resend confirmation failed: Email already verified for user: ${user.id}`,
        );
        throw new BadRequestException('Email is already verified');
      }

      this.logger.debug(`Generating new action token for user: ${user.id}`);
      const token = await this.generateActionToken(user.id);

      const emailData = {
        subject: 'Banter Verification Email',
        username: user.username,
        token,
      };

      this.logger.debug(`Sending confirmation email to: ${user.email}`);
      await this.mailService.sendWelcomeEmail(user.email, emailData);

      this.logger.log(
        `Email confirmation resent successfully to: ${user.email}`,
      );
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Confirmation email sent successfully',
        data: null,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Resend email confirmation failed for ${email}:`,
        error.stack,
      );

      if (error.message?.includes('Failed to send')) {
        throw new BadRequestException('Failed to send confirmation email');
      }

      throw new InternalServerErrorException(
        'Failed to resend email confirmation',
      );
    }
  }

  // Password Reset Methods

  async initiatePasswordReset(emailDto: EmailValidationDto) {
    const { email } = emailDto;

    this.logger.debug(`Looking up user with email: ${email}`);
    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      this.logger.warn(
        `Password reset attempt for non-existent email: ${email}`,
      );
      throw new NotFoundException('User not found');
    }

    // Generate action token for password reset
    const token = await this.generateActionToken(user.id);

    const emailData = {
      subject: 'Password Reset Request',
      username: user.username,
      token,
    };

    this.logger.debug(`Sending password reset email to: ${user.email}`);
    try {
      await this.mailService.forgetPasswordEmail(user.email, emailData);
      this.logger.log(
        `Password reset email sent successfully to: ${user.email}`,
      );
    } catch (emailError) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}:`,
        emailError.stack,
      );
    }
    this.logger.log(`Password reset initiated for user: ${user.id}`);
    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Password reset link sent successfully',
      data: null,
    };
  }

  async resetPassword(resetPasswordDto: ForgotPasswordDto) {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findByActionToken(token);

    if (
      !user ||
      !user.actionTokenExpiry ||
      user.actionTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    try {
      this.logger.debug(`Resetting password for user: ${user.id}`);

      let hashedPassword = await encrypt(newPassword.trim());

      // Update user password and clear reset token
      await this.userRepository.updateUserPassword(user.id, hashedPassword);

      // Send confirmation email
      let data = {
        subject: 'Password Change Confirmation',
        username: user.username,
      };
      await this.mailService.sendPasswordChangeConfirmation(user.email, data);

      this.logger.log(`Password successfully reset for user: ${user.email}`);
      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Password has been reset successfully',
        data: null,
      };
    } catch (error) {
      this.logger.error('Reset password error:', error);
      throw new BadRequestException(
        'Something went wrong. Please try again later.',
      );
    }
  }

  //Helper Methods

  async generateAuthToken(userId: string): Promise<string> {
    try {
      this.logger.debug(`Generating auth token for user: ${userId}`);
      return await this.jwtService.signAsync({ userId }, { expiresIn: '15m' });
    } catch (error) {
      this.logger.error(
        `Failed to generate auth token for user ${userId}:`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate authentication token',
      );
    }
  }

  async generateRefreshToken(userId: string): Promise<string> {
    try {
      this.logger.debug(`Generating refresh token for user: ${userId}`);

      // Generate secure random token
      const token = crypto.randomBytes(64).toString('hex');

      // Set expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Store refresh token in database
      await this.userRepository.createRefreshToken(userId, token, expiresAt);

      return token;
    } catch (error) {
      this.logger.error(
        `Failed to generate refresh token for user ${userId}:`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate refresh token',
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      this.logger.debug('Processing refresh token request');

      // Find refresh token in database
      const tokenRecord = await this.userRepository.findRefreshToken(refreshToken);

      if (!tokenRecord) {
        this.logger.warn('Refresh token not found');
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token is revoked
      if (tokenRecord.isRevoked) {
        this.logger.warn(`Refresh token is revoked for user: ${tokenRecord.userId}`);
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Check if token is expired
      if (tokenRecord.expiresAt < new Date()) {
        this.logger.warn(`Refresh token expired for user: ${tokenRecord.userId}`);
        await this.userRepository.revokeRefreshToken(refreshToken);
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Generate new access token
      const accessToken = await this.generateAuthToken(tokenRecord.userId);

      // Generate new refresh token (token rotation)
      const newRefreshToken = await this.generateRefreshToken(tokenRecord.userId);

      // Revoke old refresh token
      await this.userRepository.revokeRefreshToken(refreshToken);

      this.logger.log(`Tokens refreshed successfully for user: ${tokenRecord.userId}`);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Failed to refresh access token:', error.stack);
      throw new InternalServerErrorException('Failed to refresh access token');
    }
  }

  async generateActionToken(userId: string): Promise<string> {
    try {
      this.logger.debug(`Generating action token for user: ${userId}`);

      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');

      // Set expiry to 5 minutes from now
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 5);

      // Update user with action token
      await this.userRepository.updateActionToken(userId, token, expiry);

      this.logger.debug(
        `Action token generated and stored for user: ${userId}`,
      );
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to generate action token for user ${userId}:`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to generate action token');
    }
  }
}
