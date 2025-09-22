import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OauthService } from './oauth.service';
import { GoogleGuard } from '../../guards/google.guard';
import { ConfigService } from '@nestjs/config';

@Controller('oauth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleGuard)
  async googleAuth(@Req() req) {
    // This triggers the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.oauthService.validateOAuthGoogleLogin(req);

    const redirectUrl = `${this.configService.get<string>(
      'FRONTEND_URL',
    )}?token=${result.token}`;

    return res.redirect(redirectUrl);
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
