import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CallService } from './call.service';
import { StartCallDto } from './dto/start-call.dto';
import { EndCallDto } from './dto/end-call.dto';

@ApiTags('Call')
@Controller('call')
@ApiBearerAuth('JWT-auth')
export class CallController {
  constructor(private readonly callService: CallService) {}

  // @Post('start')
  // @ApiOperation({ summary: 'Start a new call in a room' })
  // @ApiResponse({ status: 201, description: 'Call started successfully' })
  // @ApiResponse({ status: 404, description: 'Room not found or access denied' })
  // async startCall(@Request() req: any, @Body() startCallDto: StartCallDto) {
  //   const userId = req.user?.userId;
  //   return await this.callService.startCall(userId, startCallDto);
  // }

  @Post('end')
  @ApiOperation({ summary: 'End an active call' })
  @ApiResponse({ status: 200, description: 'Call ended successfully' })
  @ApiResponse({ status: 404, description: 'Call session not found' })
  async endCall(@Request() req: any, @Body() endCallDto: EndCallDto) {
    const userId = req.user?.userId;
    return await this.callService.endCall(
      userId,
      endCallDto.callSessionId,
      endCallDto.duration,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get call history for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Call history retrieved successfully',
  })
  async getCallHistory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.userId;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return await this.callService.getCallHistory(userId, pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get call statistics for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Call stats retrieved successfully',
  })
  async getCallStats(@Request() req: any) {
    const userId = req.user?.userId;
    return await this.callService.getCallStats(userId);
  }

  @Get('room/:roomId/history')
  @ApiOperation({ summary: 'Get call history for a specific room' })
  @ApiResponse({
    status: 200,
    description: 'Room call history retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Access denied to room' })
  async getRoomCallHistory(
    @Request() req: any,
    @Param('roomId') roomId: string,
  ) {
    const userId = req.user?.userId;
    return await this.callService.getRoomCallHistory(userId, roomId);
  }

  @Get('active-rooms')
  @ApiOperation({ summary: 'Get currently active call rooms (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Active call rooms retrieved successfully',
  })
  async getActiveCallRooms() {
    return await this.callService.getActiveCallRooms();
  }

  @Get('admin/stats')
  @ApiOperation({ summary: 'Get overall call statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Overall call stats retrieved successfully',
  })
  async getAllCallStats() {
    return await this.callService.getAllCallStats();
  }
}
