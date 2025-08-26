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
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';
import { UpdateStatusDto } from './validation';
@UseGuards(JwtAuthGuard)
@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  // ➡️ Send friend request
  @Post(':receiverId')
  async addFriend(@Param('receiverId') receiverId: string, @Request() req) {
    const requesterId = req.user.id; // assuming injected by auth guard
    return this.friendshipService.addFriend(requesterId, receiverId);
  }

  // ➡️ Accept friend request
  @Patch(':friendshipId/status')
  async updateStatus(
    @Param('friendshipId') friendshipId: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    const receiverId = req.user.id;
    return this.friendshipService.updateFriendshipStatus(
      friendshipId,
      dto.requesterId,
      receiverId,
      dto.status,
    );
  }

  // ➡️ List current user’s friends
  @Get('me')
  async listMyFriends(@Request() req) {
    const userId = req.user.id;
    return this.friendshipService.listFriends(userId);
  }

  @Get('me/requests')
  async listMyFriendsRequest(@Request() req) {
    const userId = req.user.id;
    return this.friendshipService.listRequests(userId);
  }

  // ➡️ Remove friendship (unfriend)
  // @Delete(':requesterId')
  // async removeFriend(
  //   @Param('requesterId') requesterId: string,
  //   @Request() req,
  // ) {
  //   const receiverId = req.user.id;
  //   // you'd probably want a dedicated repo/service method for "removeFriend"
  //   return this.friendshipService.blockFriendship(requesterId, receiverId);
  // }
}
