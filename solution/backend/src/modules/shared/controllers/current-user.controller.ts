import {
  Controller,
  Get,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRoleService } from '../services/user-role.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { UserPermissionsResponseDto } from '../dto/user-role.dto';

@ApiTags('Current User')
@ApiBearerAuth()
@Controller('api/v1/current-user')
@UseGuards(JwtAuthGuard)
export class CurrentUserController {
  private readonly logger = new Logger(CurrentUserController.name);

  constructor(private readonly userRoleService: UserRoleService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get current user roles and permissions' })
  @ApiResponse({ status: 200, description: 'Current user roles and permissions retrieved successfully', type: UserPermissionsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserRoles(@CurrentUser() user: any): Promise<UserPermissionsResponseDto> {
    this.logger.log('Fetching current user roles and permissions');
    return this.userRoleService.getCurrentUserRoles(user.userId);
  }
}
