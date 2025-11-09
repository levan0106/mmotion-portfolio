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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PermissionService } from '../services/permission.service';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionCategoryDto,
} from '../dto/permission.dto';

@ApiTags('Permission Management')
@ApiBearerAuth()
@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(['permissions.create'])
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully', type: PermissionResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - permission name already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    this.logger.log(`Creating permission: ${createPermissionDto.name}`);
    return this.permissionService.createPermission(createPermissionDto);
  }

  @Get()
  @RequirePermissions(['permissions.read'])
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully', type: [PermissionResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getAllPermissions(): Promise<PermissionResponseDto[]> {
    this.logger.log('Fetching all permissions');
    return this.permissionService.getAllPermissions();
  }

  @Get('categories')
  @RequirePermissions(['permissions.read'])
  @ApiOperation({ summary: 'Get permissions grouped by category' })
  @ApiResponse({ status: 200, description: 'Permissions by category retrieved successfully', type: [PermissionCategoryDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getPermissionsByCategory(): Promise<PermissionCategoryDto[]> {
    this.logger.log('Fetching permissions by category');
    return this.permissionService.getPermissionsByCategory();
  }

  @Get('search')
  @RequirePermissions(['permissions.read'])
  @ApiOperation({ summary: 'Search permissions' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully', type: [PermissionResponseDto] })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async searchPermissions(@Query('q') query: string): Promise<PermissionResponseDto[]> {
    this.logger.log(`Searching permissions with query: ${query}`);
    return this.permissionService.searchPermissions(query);
  }

  @Get('categories/list')
  @RequirePermissions(['permissions.read'])
  @ApiOperation({ summary: 'Get permission categories' })
  @ApiResponse({ status: 200, description: 'Permission categories retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getPermissionCategories(): Promise<string[]> {
    this.logger.log('Fetching permission categories');
    return this.permissionService.getPermissionCategories();
  }

  @Get(':id')
  @RequirePermissions(['permissions.read'])
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Permission retrieved successfully', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getPermissionById(@Param('id') permissionId: string): Promise<PermissionResponseDto> {
    this.logger.log(`Fetching permission: ${permissionId}`);
    return this.permissionService.getPermissionById(permissionId);
  }

  @Put(':id')
  @RequirePermissions(['permissions.update'])
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot update system permission' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updatePermission(
    @Param('id') permissionId: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    this.logger.log(`Updating permission: ${permissionId}`);
    return this.permissionService.updatePermission(permissionId, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(['permissions.delete'])
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot delete system permission or permission in use' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async deletePermission(@Param('id') permissionId: string): Promise<void> {
    this.logger.log(`Deleting permission: ${permissionId}`);
    return this.permissionService.deletePermission(permissionId);
  }
}
