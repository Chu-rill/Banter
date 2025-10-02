import {
  Controller,
  Post,
  Patch,
  Param,
  Delete,
  Get,
  Request,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import {
  UpdateFriendStatusDtoSwagger,
  UpdateStatusDto,
  UpdateStatusSchema,
} from './validation';
import { ZodPipe } from 'src/utils/schema-validation/validation.pipe';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FriendStatus } from '@generated/prisma';

@ApiTags('Friendship')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  // ➡️ Send friend request
  @Post(':receiverId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiParam({
    name: 'receiverId',
    type: String,
    description: 'User ID to send friend request to',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  @ApiResponse({ status: 201, description: 'Friend request sent' })
  async addFriend(@Param('receiverId') receiverId: string, @Request() req) {
    const requesterId = req.user.id;
    return this.friendshipService.addFriend(requesterId, receiverId);
  }

  // ➡️ Accept friend request
  @Patch(':friendshipId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update friendship status accept' })
  @ApiParam({
    name: 'friendshipId',
    type: String,
    description: 'Friendship ID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  @ApiResponse({ status: 200, description: 'Friendship status updated' })
  async acceptRequest(
    @Param('friendshipId') friendshipId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.friendshipService.updateFriendshipStatus(
      friendshipId,
      userId,
      FriendStatus.ACCEPTED,
    );
  }

  //DECLINE
  @Patch(':friendshipId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update friendship status  decline' })
  @ApiParam({
    name: 'friendshipId',
    type: String,
    description: 'Friendship ID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  @ApiResponse({ status: 200, description: 'Friendship status updated' })
  async declineRequest(
    @Param('friendshipId') friendshipId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.friendshipService.updateFriendshipStatus(
      friendshipId,
      userId,
      FriendStatus.DECLINED,
    );
  }

  //BLOCK
  @Patch(':friendshipId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update friendship status block' })
  @ApiParam({
    name: 'friendshipId',
    type: String,
    description: 'Friendship ID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  @ApiBody({ type: UpdateFriendStatusDtoSwagger })
  @ApiResponse({ status: 200, description: 'Friendship status updated' })
  async blockRequest(
    @Param('friendshipId') friendshipId: string,
    @Body(new ZodPipe(UpdateStatusSchema)) dto: UpdateStatusDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.friendshipService.updateFriendshipStatus(
      friendshipId,
      userId,
      FriendStatus.BLOCKED,
    );
  }
  // ➡️ List current user’s friends
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user’s friends' })
  @ApiResponse({ status: 200, description: 'List of friends' })
  async listMyFriends(@Request() req) {
    const userId = req.user.id;
    return this.friendshipService.listFriends(userId);
  }

  @Get('requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user’s friend requests' })
  @ApiResponse({ status: 200, description: 'List of friend requests' })
  async listMyFriendsRequest(@Request() req) {
    const userId = req.user.id;
    return this.friendshipService.listRequests(userId);
  }

  // ➡️ Remove friendship (unfriend)
  // @Delete(':requesterId')
  // @ApiOperation({ summary: 'Remove a friend' })
  // @ApiParam({
  //   name: 'requesterId',
  //   type: String,
  //   description: 'Requester user ID',
  //   example: 'cl9v1z5t30000qzrmn1g6v6y',
  // })
  // @ApiResponse({ status: 200, description: 'Friendship removed' })
  // async removeFriend(
  //   @Param('requesterId') requesterId: string,
  //   @Request() req,
  // ) {
  //   const receiverId = req.user.id;
  //   return this.friendshipService.blockFriendship(requesterId, receiverId);
  // }
}
