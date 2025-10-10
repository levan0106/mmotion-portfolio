import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserSearchParamsDto,
  UserStatsResponseDto,
} from '../dto/user.dto';

@ApiTags('User Management')
@ApiBearerAuth()
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions(['users.read'])
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: [UserResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUsers(@Query() params: UserSearchParamsDto): Promise<{ users: UserResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log('Fetching all users');
    return this.userService.getUsers(params);
  }

  @Get('search')
  @RequirePermissions(['users.read'])
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Users search completed successfully', type: [UserResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async searchUsers(@Query() params: UserSearchParamsDto): Promise<{ users: UserResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`Searching users with query: ${params.query}`);
    return this.userService.searchUsers(params);
  }

  @Get('stats')
  @RequirePermissions(['users.read'])
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully', type: UserStatsResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUserStats(): Promise<UserStatsResponseDto> {
    this.logger.log('Fetching user statistics');
    return this.userService.getUserStats();
  }

  @Get(':id')
  @RequirePermissions(['users.read'])
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user: ${id}`);
    return this.userService.getUser(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(['users.create'])
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - user email already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating user: ${createUserDto.email}`);
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  @RequirePermissions(['users.update'])
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${id}`);
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['users.delete'])
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    this.logger.log(`Deleting user: ${id}`);
    return this.userService.deleteUser(id);
  }

  @Put(':id/activate')
  @RequirePermissions(['users.update'])
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async activateUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Activating user: ${id}`);
    return this.userService.activateUser(id);
  }

  @Put(':id/deactivate')
  @RequirePermissions(['users.update'])
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async deactivateUser(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Deactivating user: ${id}`);
    return this.userService.deactivateUser(id);
  }
}
