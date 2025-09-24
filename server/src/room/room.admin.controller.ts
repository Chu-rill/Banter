import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  UsePipes,
  HttpStatus,
  HttpCode,
  Body,
  Put,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/auth.guard';
import { RoomAdminGuard } from '../guards/room.admin.guard';
import { RoomService } from './room.service';
import { ZodPipe } from 'src/utils/schema-validation/validation.pipe';
import {
  CreateRoomDtoSwagger,
  UpdateRoomDto,
  UpdateRoomSchema,
} from './validation';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Rooms-Admin')
@ApiBearerAuth('JWT-auth')
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
    // return this.roomService.kickMember(roomId, req.user.id, userId);
  }

  @Patch()
  @UsePipes(new ZodPipe(UpdateRoomSchema))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a Room' })
  @ApiBody({ type: CreateRoomDtoSwagger })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  async updateRoom(@Body() updateRoomDto: UpdateRoomDto, @Request() req) {
    return this.roomService.updateRoom(req.user.id, updateRoomDto);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') roomId: string, @Request() req) {
    // Only room creator can delete the room
    // return this.roomService.deleteRoom(roomId, req.user.id);
  }
}
