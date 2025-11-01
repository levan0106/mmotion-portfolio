import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SettingsService } from '../services/settings.service';
import { AccountService } from '../services/account.service';
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

  constructor(
    private readonly settingsService: SettingsService,
    private readonly accountService: AccountService,
  ) {}

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

  @Get('demo-account')
  @RequirePermissions(['settings.read'])
  @ApiOperation({ summary: 'Get demo account status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Demo account status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
        accountId: { type: 'string', example: 'ffffffff-ffff-4fff-bfff-ffffffffffff' },
        accountName: { type: 'string', example: 'Demo Account' }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getDemoAccountStatus() {
    this.logger.log('Fetching demo account status');
    return this.accountService.getDemoAccountStatus();
  }

  @Post('demo-account/toggle')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(['settings.update'])
  @ApiOperation({ summary: 'Toggle demo account (enable/disable)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true }
      },
      required: ['enabled']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Demo account status updated successfully',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', example: true },
        accountId: { type: 'string', example: 'ffffffff-ffff-4fff-bfff-ffffffffffff' },
        accountName: { type: 'string', example: 'Demo Account' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async toggleDemoAccount(@Body() body: { enabled: boolean }) {
    this.logger.log(`Toggling demo account: ${body.enabled ? 'enable' : 'disable'}`);
    return this.accountService.toggleDemoAccount(body.enabled);
  }
}
