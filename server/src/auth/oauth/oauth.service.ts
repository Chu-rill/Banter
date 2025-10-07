import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { UserRepository } from 'src/user/user.repository';
import { AuthService } from '../email-password-auth/email-password-auth.service';
import { UserService } from 'src/user/user.service';
import { RoomMessageGateway } from 'src/room-message/room-message.gateway';

@Injectable()
export class OauthService {
  constructor(
    private jwt: JwtService,
    private userRepository: UserRepository,
    private mailService: EmailService,
    private authService: AuthService,
    private readonly userService: UserService,
    private readonly messageGateway: RoomMessageGateway,
  ) {}

  async validateOAuthGoogleLogin(req): Promise<any> {
    if (!req || !req.user) {
      console.log('Google login failed:', req);
      throw new UnauthorizedException('No user from Google');
    }

    const auth = {
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      picture: req.user.picture,
    };

    let user = await this.userRepository.getUserByEmail(auth.email);

    if (!user) {
      let username = `${auth.firstName}${auth.lastName}`;
      user = await this.userRepository.createUserOauth(
        username,
        auth.email,
        auth.picture,
      );

      const token = await this.authService.generateActionToken(user.id);
      const data = {
        subject: 'Banter welcome email',
        username: user.username,
        token,
      };
      await this.mailService.sendWelcomeEmailOauth(user.email, data);
      await Promise.all([
        this.userRepository.markUserAsVerified(user.id),
        this.userService.updateOnlineStatus(user.id, true),
      ]);
    }

    const [, , accessToken, refreshToken] = await Promise.all([
      this.userService.updateOnlineStatus(user.id, true),
      this.messageGateway.broadcastUserStatus(user.id, true),
      this.authService.generateAuthToken(user.id),
      this.authService.generateRefreshToken(user.id),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Google Auth Successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        isVerified: user.isVerified,
      },
      token: accessToken,
      refreshToken: refreshToken,
    };
  }
}
