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
  UpdateRoomDto,
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

  @Get(':id/messages')
  @UsePipes(new ZodPipe(GetRoomSchema))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the room messages by the roomId' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Room CUID',
    example: 'cl9v1z5t30000qzrmn1g6v6y',
  })
  async getMessagesByRoomById(@Param() dto: GetRoomDto) {
    return this.roomService.getRoomMessages(dto);
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
    const roomId = id;
    const userId = req.user.id;

    // const parsed = RoomConnectionSchema.parse(userId);
    return this.roomService.joinRoom(roomId, userId);
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
    const roomId = id;
    const userId = req.user.id;

    // const parsed = RoomConnectionSchema.parse(dto);
    return this.roomService.leaveRoom(roomId, userId);
  }

  // Room Join Request Endpoints
  @Post(':id/request-join')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request to join a private room' })
  @ApiParam({ name: 'id', type: String, description: 'Room ID' })
  @ApiResponse({ status: 201, description: 'Join request sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async requestToJoinRoom(@Param('id') roomId: string, @Request() req) {
    return this.roomService.requestToJoinRoom(roomId, req.user.id);
  }

  @Get(':id/join-requests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending join requests for a room (creator only)' })
  @ApiParam({ name: 'id', type: String, description: 'Room ID' })
  @ApiResponse({ status: 200, description: 'Join requests retrieved successfully' })
  async getPendingJoinRequests(@Param('id') roomId: string, @Request() req) {
    return this.roomService.getPendingJoinRequests(roomId, req.user.id);
  }

  @Post('join-requests/:requestId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a join request (creator only)' })
  @ApiParam({ name: 'requestId', type: String, description: 'Join Request ID' })
  @ApiResponse({ status: 200, description: 'Join request approved' })
  async approveJoinRequest(@Param('requestId') requestId: string, @Request() req) {
    return this.roomService.approveJoinRequest(requestId, req.user.id);
  }

  @Post('join-requests/:requestId/deny')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deny a join request (creator only)' })
  @ApiParam({ name: 'requestId', type: String, description: 'Join Request ID' })
  @ApiResponse({ status: 200, description: 'Join request denied' })
  async denyJoinRequest(@Param('requestId') requestId: string, @Request() req) {
    return this.roomService.denyJoinRequest(requestId, req.user.id);
  }
}
