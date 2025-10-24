import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TrustedDevice } from '../entities/trusted-device.entity';

export interface DeviceInfo {
  deviceFingerprint: string;
  deviceName: string;
  browserInfo: string;
  ipAddress: string;
  location: string;
}

export interface TrustedDeviceResponse {
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string;
  browserInfo: string;
  location: string;
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUsed: Date;
  createdAt: Date;
  isActive: boolean;
  timeSinceLastUsed: string;
}

@Injectable()
export class DeviceTrustService {
  private readonly logger = new Logger(DeviceTrustService.name);

  constructor(
    @InjectRepository(TrustedDevice)
    private readonly trustedDeviceRepository: Repository<TrustedDevice>,
  ) {}

  /**
   * Check if device is trusted for a user
   */
  async isDeviceTrusted(userId: string, deviceFingerprint: string): Promise<boolean> {
    try {
      const device = await this.trustedDeviceRepository.findOne({
        where: {
          userId,
          deviceFingerprint,
          isTrusted: true,
          expiresAt: MoreThan(new Date())
        }
      });

      if (device) {
        // Update last used timestamp
        device.lastUsed = new Date();
        await this.trustedDeviceRepository.save(device);
        this.logger.log(`Device ${device.deviceId} used for user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking device trust: ${error.message}`);
      return false;
    }
  }

  /**
   * Add a new trusted device
   */
  async addTrustedDevice(userId: string, deviceInfo: DeviceInfo): Promise<TrustedDevice> {
    try {
      // Check if device already exists
      const existingDevice = await this.trustedDeviceRepository.findOne({
        where: {
          userId,
          deviceFingerprint: deviceInfo.deviceFingerprint
        }
      });

      if (existingDevice) {
        // Update existing device
        existingDevice.isTrusted = true;
        existingDevice.lastUsed = new Date();
        existingDevice.expiresAt = this.calculateExpirationDate();
        existingDevice.deviceName = deviceInfo.deviceName;
        existingDevice.browserInfo = deviceInfo.browserInfo;
        existingDevice.ipAddress = deviceInfo.ipAddress;
        existingDevice.location = deviceInfo.location;
        existingDevice.trustLevel = await this.calculateTrustLevel(deviceInfo);

        const updatedDevice = await this.trustedDeviceRepository.save(existingDevice);
        this.logger.log(`Device ${updatedDevice.deviceId} updated for user ${userId}`);
        return updatedDevice;
      }

      // Create new trusted device
      const expiresAt = this.calculateExpirationDate();
      const trustLevel = await this.calculateTrustLevel(deviceInfo);

      const device = this.trustedDeviceRepository.create({
        userId,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceName: deviceInfo.deviceName,
        browserInfo: deviceInfo.browserInfo,
        ipAddress: deviceInfo.ipAddress,
        location: deviceInfo.location,
        isTrusted: true,
        trustLevel,
        lastUsed: new Date(),
        expiresAt
      });

      const savedDevice = await this.trustedDeviceRepository.save(device);
      this.logger.log(`New trusted device ${savedDevice.deviceId} created for user ${userId}`);
      return savedDevice;
    } catch (error) {
      this.logger.error(`Error adding trusted device: ${error.message}`);
      throw new BadRequestException('Failed to add trusted device');
    }
  }

  /**
   * Get all trusted devices for a user
   */
  async getTrustedDevices(userId: string): Promise<TrustedDeviceResponse[]> {
    try {
      const devices = await this.trustedDeviceRepository.find({
        where: { userId },
        order: { lastUsed: 'DESC' }
      });

      return devices.map(device => ({
        deviceId: device.deviceId,
        deviceFingerprint: device.deviceFingerprint,
        deviceName: device.deviceName,
        browserInfo: device.browserInfo,
        location: device.location,
        trustLevel: device.trustLevel,
        lastUsed: device.lastUsed,
        createdAt: device.createdAt,
        isActive: device.isActive,
        timeSinceLastUsed: this.calculateTimeSince(device.lastUsed)
      }));
    } catch (error) {
      this.logger.error(`Error getting trusted devices: ${error.message}`);
      throw new BadRequestException('Failed to get trusted devices');
    }
  }

  /**
   * Revoke trust for a specific device (delete from database)
   */
  async revokeDevice(deviceId: string, userId: string): Promise<void> {
    try {
      const device = await this.trustedDeviceRepository.findOne({
        where: { deviceId, userId }
      });

      if (!device) {
        throw new NotFoundException('Device not found');
      }

      // Delete device from database
      await this.trustedDeviceRepository.remove(device);
      
      this.logger.log(`Device ${deviceId} deleted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error revoking device: ${error.message}`);
      throw new BadRequestException('Failed to revoke device');
    }
  }

  /**
   * Revoke all devices for a user (delete from database)
   */
  async revokeAllDevices(userId: string): Promise<void> {
    try {
      // Delete all devices for user
      await this.trustedDeviceRepository.delete({ userId });
      
      this.logger.log(`All devices deleted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error revoking all devices: ${error.message}`);
      throw new BadRequestException('Failed to revoke all devices');
    }
  }

  /**
   * Expire all trusted devices for user (mark as expired but keep in database)
   */
  async expireAllDevices(userId: string): Promise<void> {
    try {
      // Update all devices to set isTrusted = false and expiresAt = now
      await this.trustedDeviceRepository.update(
        { userId },
        { 
          isTrusted: false,
          expiresAt: new Date()
        }
      );

      this.logger.log(`All devices expired for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error expiring all devices: ${error.message}`);
      throw new BadRequestException('Failed to expire all devices');
    }
  }

  /**
   * Calculate time since last used
   */
  private calculateTimeSince(lastUsed: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - lastUsed.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      // Show exact date for older entries
      return lastUsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Clean up expired devices
   */
  async cleanupExpiredDevices(): Promise<number> {
    try {
      const result = await this.trustedDeviceRepository.update(
        { expiresAt: MoreThan(new Date()) },
        { isTrusted: false }
      );

      this.logger.log(`Cleaned up ${result.affected} expired devices`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(`Error cleaning up expired devices: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate trust level based on device information
   */
  private async calculateTrustLevel(deviceInfo: DeviceInfo): Promise<'LOW' | 'MEDIUM' | 'HIGH'> {
    let score = 0;
    
    // Check device fingerprint complexity
    if (deviceInfo.deviceFingerprint.length > 20) score += 2;
    if (deviceInfo.deviceFingerprint.length > 50) score += 1;
    
    // Check browser info
    if (deviceInfo.browserInfo.includes('Chrome')) score += 1;
    if (deviceInfo.browserInfo.includes('Firefox')) score += 1;
    if (deviceInfo.browserInfo.includes('Safari')) score += 1;
    
    // Check IP address
    if (deviceInfo.ipAddress && deviceInfo.ipAddress !== 'unknown') score += 1;
    
    // Check location
    if (deviceInfo.location && deviceInfo.location !== 'Unknown location') score += 1;
    
    // Check device name
    if (deviceInfo.deviceName && deviceInfo.deviceName.length > 10) score += 1;
    
    if (score >= 6) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate expiration date (30 days from now)
   */
  private calculateExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return expiresAt;
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(userId: string): Promise<{
    totalDevices: number;
    activeDevices: number;
    expiredDevices: number;
    highTrustDevices: number;
  }> {
    try {
      const devices = await this.trustedDeviceRepository.find({
        where: { userId }
      });

      const now = new Date();
      const activeDevices = devices.filter(d => d.isTrusted && d.expiresAt > now).length;
      const expiredDevices = devices.filter(d => d.expiresAt <= now).length;
      const highTrustDevices = devices.filter(d => d.trustLevel === 'HIGH').length;

      return {
        totalDevices: devices.length,
        activeDevices,
        expiredDevices,
        highTrustDevices
      };
    } catch (error) {
      this.logger.error(`Error getting device stats: ${error.message}`);
      throw new BadRequestException('Failed to get device statistics');
    }
  }
}
