import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/auth.guard';
import { RoomAdminGuard } from '../guards/room.admin.guard';
import { RoomService } from './room.service';

@Controller('rooms/admin')
@UseGuards(JwtAuthGuard, RoomAdminGuard)
export class RoomAdminController {
  constructor(private readonly roomService: RoomService) {}

  @Post(':id/kick/:userId')
  async kickMember(
    @Param('id') roomId: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    // Only room creator can kick members
    return this.roomService.kickMember(roomId, req.user.id, userId);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') roomId: string, @Request() req) {
    // Only room creator can delete the room
    return this.roomService.deleteRoom(roomId, req.user.id);
  }
}
