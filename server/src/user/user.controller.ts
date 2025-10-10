import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guards/auth.guard';
import {
  GetUsersQueryDto,
  GetUsersQueryDtoSwagger,
  UpdateUserDto,
  UpdateUserDtoSwagger,
} from './validation';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthRequest } from 'src/types/auth.request';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  async getProfile(@Request() req) {
    return this.userService.getUserById(req.user.id);
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the currently authenticated user' })
  @ApiBody({ type: UpdateUserDtoSwagger })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(req.user.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(
    @Req() req: AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.id;
    return this.userService.updateAvatar(userId, file);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a user by ID ' })
  async findOne(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search users by username or list all users with pagination' })
  @ApiQuery({ type: GetUsersQueryDtoSwagger })
  async getUsers(
    @Query('username') username?: string,
    @Query() query?: GetUsersQueryDto,
  ) {
    // If username is provided, search by username (partial match)
    if (username) {
      return this.userService.searchUsersByUsername(username);
    }
    // Otherwise, return paginated list of all users
    return this.userService.getAllUsers(query?.page, query?.limit);
  }
}
