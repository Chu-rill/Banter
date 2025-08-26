import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UsePipes,
  Delete,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import {
  CreateRoomDto,
  CreateRoomDtoSwagger,
  CreateRoomSchema,
  GetAllRoomsQueryDto,
  GetAllRoomsQueryDtoSwagger,
  GetAllRoomsQuerySchema,
  GetRoomDto,
  GetRoomSchema,
  RoomConnectionSchema,
} from './validation';
import { ZodPipe } from 'src/utils/schema-validation/validation.pipe';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Rooms')
@ApiBearerAuth('JWT-auth')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private roomService: RoomService) {}

  @Post()
  @UsePipes(new ZodPipe(CreateRoomSchema))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Room' })
  @ApiBody({ type: CreateRoomDtoSwagger })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomService.createRoom(createRoomDto, req.user.id);
  }

  @Get()
  @UsePipes(new ZodPipe(GetAllRoomsQuerySchema))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all rooms using a query' })
  @ApiQuery({ type: GetAllRoomsQueryDtoSwagger })
  async getAllRooms(@Query() query: GetAllRoomsQueryDto) {
    return this.roomService.getAllRooms(query);
  }

  @Get(':id')
  @UsePipes(new ZodPipe(GetRoomSchema))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a room by the roomId' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room CUID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  async getRoomById(@Param() dto: GetRoomDto) {
    return this.roomService.getRoomById(dto);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a room' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room CUID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  async joinRoom(@Param('id') id: string, @Request() req) {
    const dto = { roomId: id, userId: req.user.id };

    const parsed = RoomConnectionSchema.parse(dto);
    return this.roomService.joinRoom(parsed);
  }

  @Delete(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a room' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room CUID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  async leaveRoom(@Param('id') id: string, @Request() req) {
    const dto = { roomId: id, userId: req.user.id };

    const parsed = RoomConnectionSchema.parse(dto);
    return this.roomService.leaveRoom(parsed);
  }
}
