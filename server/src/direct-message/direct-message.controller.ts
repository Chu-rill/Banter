import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Direct Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('direct-messages')
export class DirectMessageController {
  constructor(private readonly directMessageService: DirectMessageService) {}

  @Post(':recipientId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a direct message to a user' })
  @ApiParam({
    name: 'recipientId',
    type: String,
    description: 'Recipient user ID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async sendMessage(
    @Param('recipientId') recipientId: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.directMessageService.sendDirectMessage(
      req.user.id,
      recipientId,
      content,
    );
  }

  @Get('with/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get direct messages with a specific user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'Other user ID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  @ApiResponse({ status: 200, description: 'List of direct messages' })
  async getMessagesWithUser(@Param('userId') userId: string, @Request() req) {
    return this.directMessageService.getChat(req.user.id, userId);
  }
}
