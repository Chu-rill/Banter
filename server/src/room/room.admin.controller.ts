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
@UseGuards(RoomAdminGuard)
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

  @Patch(':id')
  // @UsePipes(new ZodPipe(UpdateRoomSchema))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a Room' })
  @ApiBody({ type: CreateRoomDtoSwagger })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  async updateRoom(@Body() updateRoomDto: any, @Param('id') id: string) {
    // console.log('Param id:', id);
    // console.log('Body dto:', updateRoomDto);
    return this.roomService.updateRoom(id, updateRoomDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRoom(@Param('id') roomId: string, @Request() req) {
    // Only room creator can delete the room
    return this.roomService.deleteRoom(roomId, req.user.id);
  }
}
