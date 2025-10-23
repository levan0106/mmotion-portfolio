import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DeviceTrustService, DeviceInfo } from '../services/device-trust.service';
import { CurrentUser } from '../decorators/current-user.decorator';

export class AddTrustedDeviceDto {
  deviceFingerprint: string;
  deviceName: string;
  browserInfo: string;
  ipAddress: string;
  location: string;
}

export class RevokeDeviceDto {
  deviceId: string;
}

@ApiTags('Device Trust')
@Controller('api/v1/device-trust')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceTrustController {
  private readonly logger = new Logger(DeviceTrustController.name);

  constructor(private readonly deviceTrustService: DeviceTrustService) {}

  /**
   * Get all trusted devices for current user
   */
  @Get('devices')
  @ApiOperation({ 
    summary: 'Get trusted devices',
    description: 'Get all trusted devices for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of trusted devices',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          deviceId: { type: 'string' },
          deviceName: { type: 'string' },
          browserInfo: { type: 'string' },
          location: { type: 'string' },
          trustLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
          lastUsed: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' },
          timeSinceLastUsed: { type: 'string' }
        }
      }
    }
  })
  async getTrustedDevices(@CurrentUser() user: any) {
    this.logger.log(`Getting trusted devices for user ${user.userId}`);
    return await this.deviceTrustService.getTrustedDevices(user.userId);
  }

  /**
   * Add a new trusted device
   */
  @Post('devices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add trusted device',
    description: 'Add a new trusted device for the current user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Device added successfully',
    schema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string' },
        deviceName: { type: 'string' },
        trustLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
        expiresAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid device information' })
  async addTrustedDevice(
    @CurrentUser() user: any,
    @Body() addDeviceDto: AddTrustedDeviceDto
  ) {
    this.logger.log(`Adding trusted device for user ${user.userId}`);
    
    const deviceInfo: DeviceInfo = {
      deviceFingerprint: addDeviceDto.deviceFingerprint,
      deviceName: addDeviceDto.deviceName,
      browserInfo: addDeviceDto.browserInfo,
      ipAddress: addDeviceDto.ipAddress,
      location: addDeviceDto.location
    };

    const device = await this.deviceTrustService.addTrustedDevice(user.userId, deviceInfo);
    
    return {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      trustLevel: device.trustLevel,
      expiresAt: device.expiresAt
    };
  }

  /**
   * Revoke a specific trusted device
   */
  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Revoke trusted device',
    description: 'Revoke trust for a specific device'
  })
  @ApiResponse({ status: 204, description: 'Device revoked successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeDevice(
    @CurrentUser() user: any,
    @Param('deviceId') deviceId: string
  ) {
    this.logger.log(`Revoking device ${deviceId} for user ${user.userId}`);
    await this.deviceTrustService.revokeDevice(deviceId, user.userId);
  }

  /**
   * Revoke all trusted devices
   */
  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Revoke all trusted devices',
    description: 'Revoke trust for all devices of the current user'
  })
  @ApiResponse({ status: 204, description: 'All devices revoked successfully' })
  async revokeAllDevices(@CurrentUser() user: any) {
    this.logger.log(`Revoking all devices for user ${user.userId}`);
    await this.deviceTrustService.revokeAllDevices(user.userId);
  }


  /**
   * Check if current device is trusted (DEPRECATED - use login API instead)
   */
  @Post('check')
  @ApiOperation({ 
    summary: 'Check device trust (DEPRECATED)',
    description: 'DEPRECATED: Device trust is now handled in login API. This endpoint is kept for backward compatibility.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Device trust status',
    schema: {
      type: 'object',
      properties: {
        isTrusted: { type: 'boolean' },
        deviceId: { type: 'string' },
        trustLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }
      }
    }
  })
  async checkDeviceTrust(
    @CurrentUser() user: any,
    @Body() checkDeviceDto: { deviceFingerprint: string }
  ) {
    this.logger.warn(`DEPRECATED: Device trust check API called for user ${user.userId}. Use login API instead.`);
    
    // Always return false to force using login API
    return {
      isTrusted: false,
      deviceId: null,
      trustLevel: null
    };
  }

  /**
   * Get device statistics for current user
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get device statistics',
    description: 'Get statistics about trusted devices for the current user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Device statistics',
    schema: {
      type: 'object',
      properties: {
        totalDevices: { type: 'number' },
        activeDevices: { type: 'number' },
        expiredDevices: { type: 'number' },
        highTrustDevices: { type: 'number' }
      }
    }
  })
  async getDeviceStats(@CurrentUser() user: any) {
    this.logger.log(`Getting device stats for user ${user.userId}`);
    
    const devices = await this.deviceTrustService.getTrustedDevices(user.userId);
    const now = new Date();
    
    const stats = {
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.isActive).length,
      expiredDevices: devices.filter(d => !d.isActive).length,
      highTrustDevices: devices.filter(d => d.trustLevel === 'HIGH').length
    };
    
    return stats;
  }
}
