import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { PermissionGuard } from '../guards/permission.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import {
  SystemSettingsDto,
  UpdateSystemSettingsDto,
  SystemSettingsResponseDto,
} from '../dto/settings.dto';

@ApiTags('System Settings')
@ApiBearerAuth()
@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions(['settings.read'])
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully', type: SystemSettingsResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getSettings(): Promise<SystemSettingsResponseDto> {
    this.logger.log('Fetching system settings');
    return this.settingsService.getSettings();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(['settings.update'])
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully', type: SystemSettingsResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid settings data' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async updateSettings(@Body() updateSettingsDto: UpdateSystemSettingsDto): Promise<SystemSettingsResponseDto> {
    this.logger.log(`Updating system settings: ${JSON.stringify(updateSettingsDto)}`);
    return this.settingsService.updateSettings(updateSettingsDto);
  }
}
