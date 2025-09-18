import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AutoSyncService } from '../services/auto-sync.service';

export class ToggleAutoSyncDto {
  enabled: boolean;
}

export class AutoSyncStatusDto {
  enabled: boolean;
  lastSync?: string;
  nextSync?: string;
  interval: number; // in minutes
}

@ApiTags('Auto Sync')
@Controller('api/v1/global-assets/auto-sync')
export class AutoSyncController {
  constructor(private readonly autoSyncService: AutoSyncService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get auto sync status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Auto sync status retrieved successfully',
    type: AutoSyncStatusDto
  })
  async getStatus(): Promise<AutoSyncStatusDto> {
    return await this.autoSyncService.getStatus();
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle auto sync on/off' })
  @ApiBody({ type: ToggleAutoSyncDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Auto sync toggled successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request body' 
  })
  async toggle(@Body() toggleDto: ToggleAutoSyncDto): Promise<{ message: string; enabled: boolean }> {
    await this.autoSyncService.toggle(toggleDto.enabled);
    return {
      message: `Auto sync ${toggleDto.enabled ? 'enabled' : 'disabled'} successfully`,
      enabled: toggleDto.enabled
    };
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual sync' })
  @ApiResponse({ 
    status: 200, 
    description: 'Manual sync triggered successfully' 
  })
  async trigger(): Promise<{ message: string; syncId: string }> {
    const syncId = await this.autoSyncService.triggerManualSync();
    return {
      message: 'Manual sync triggered successfully',
      syncId
    };
  }
}
