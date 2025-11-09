import { Controller, Get, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, Max, IsArray, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { AutoSyncService, AutoSyncConfig } from '../services/auto-sync.service';

export class ToggleAutoSyncDto {
  @ApiProperty({ description: 'Enable or disable auto sync', example: true })
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  enabled: boolean;
}

export class UpdateConfigDto {
  @ApiProperty({ description: 'Enable or disable auto sync', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  enabled?: boolean;

  @ApiProperty({ description: 'Schedule type: interval or fixed_times', example: 'fixed_times', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['interval', 'fixed_times'])
  scheduleType?: 'interval' | 'fixed_times';

  @ApiProperty({ description: 'Sync interval in minutes (for interval type)', example: 15, minimum: 1, maximum: 1440, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440) // Max 24 hours
  @Transform(({ value }) => {
    const num = parseInt(value);
    return isNaN(num) ? undefined : num;
  })
  intervalMinutes?: number;

  @ApiProperty({ description: 'Fixed times for execution (for fixed_times type)', example: ['09:01', '15:01', '18:50'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fixedTimes?: string[];

  @ApiProperty({ description: 'Timezone for fixed times', example: 'Asia/Ho_Chi_Minh', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: 'Custom cron expression (overrides other settings)', example: '0 */30 * * * *', required: false })
  @IsOptional()
  @IsString()
  cronExpression?: string;
}

export class AutoSyncStatusDto {
  enabled: boolean;
  lastSync?: string;
  nextSync?: string;
  scheduleType: string;
  interval?: number; // in minutes (for interval type)
  fixedTimes?: string[]; // for fixed_times type
  timezone?: string; // for fixed_times type
  cronExpression: string;
}

export class AutoSyncConfigDto {
  enabled: boolean;
  scheduleType: 'interval' | 'fixed_times';
  intervalMinutes?: number; // for interval type
  fixedTimes?: string[]; // for fixed_times type
  timezone?: string; // for fixed_times type
  cronExpression?: string; // Make optional to match AutoSyncConfig
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

  @Get('config')
  @ApiOperation({ summary: 'Get auto sync configuration' })
  @ApiResponse({ 
    status: 200, 
    description: 'Auto sync configuration retrieved successfully',
    type: AutoSyncConfigDto
  })
  async getConfig(): Promise<AutoSyncConfigDto> {
    return await this.autoSyncService.getConfig();
  }

  @Post('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update auto sync configuration' })
  @ApiBody({ type: UpdateConfigDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Auto sync configuration updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request body' 
  })
  async updateConfig(@Body() configDto: UpdateConfigDto): Promise<{ message: string; config: AutoSyncConfig }> {
    this.autoSyncService.updateConfig(configDto);
    const config = await this.autoSyncService.getConfig();
    return {
      message: 'Auto sync configuration updated successfully',
      config
    };
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