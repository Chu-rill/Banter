import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  Logger,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { OauthService } from './oauth.service';
import { GoogleGuard } from '../../guards/google.guard';
import { ConfigService } from '@nestjs/config';

@Controller('oauth')
export class OauthController {
  private readonly logger = new Logger(OauthController.name);

  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth(@Req() req) {
    // This triggers the Google OAuth flow
    // The GoogleGuard will redirect to Google's OAuth page
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      // Log the incoming request for debugging
      // this.logger.log('Google OAuth callback received');

      // Validate OAuth login and get result with tokens
      const result = await this.oauthService.validateOAuthGoogleLogin(req);

      if (!result || !result.token) {
        throw new Error('No token generated');
      }

      // Get frontend URL from config
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') ||
        'http://localhost:3000';

      // Construct redirect URL with both tokens
      let redirectUrl = `${frontendUrl}/oauth-redirect?token=${encodeURIComponent(result.token)}&refreshToken=${encodeURIComponent(result.refreshToken)}`;

      // this.logger.log(`Redirecting to: ${redirectUrl}`);

      // Redirect to frontend with tokens
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);

      // Get frontend URL for error redirect
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL_REDIRECT') ||
        'http://localhost:3000/oauth/callback';

      // Determine error message
      let errorMessage = 'Authentication failed';

      if (error instanceof HttpException) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Redirect with error
      const errorRedirectUrl = `${frontendUrl}?error=${encodeURIComponent(errorMessage)}`;

      return res.redirect(errorRedirectUrl);
    }
  }
}

// import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
// import { OauthService } from './oauth.service';
// import { GoogleGuard } from 'src/guard/google.guard';

// @Controller('oauth')
// export class OauthController {
//   constructor(private readonly oauthService: OauthService) {}

//   @Get('google')
//   @UseGuards(GoogleGuard)
//   async googleAuth(@Req() req) {
//     // This triggers the Google OAuth flow
//   }

//   @Get('google/callback')
//   @UseGuards(GoogleGuard)
//   async googleAuthRedirect(@Req() req) {
//     return this.oauthService.validateOAuthGoogleLogin(req);
//   }
// }
