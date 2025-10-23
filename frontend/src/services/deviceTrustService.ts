/**
 * Device Trust Service for Frontend
 * Handles device fingerprinting and trust management
 */

import { deviceFingerprintService } from './deviceFingerprintService';
import { apiService } from './api';

export interface DeviceInfo {
  deviceFingerprint: string;
  deviceName: string;
  browserInfo: string;
  ipAddress: string;
  location: string;
}

export interface TrustedDevice {
  deviceId: string;
  deviceName: string;
  browserInfo: string;
  location: string;
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUsed: string;
  createdAt: string;
  isActive: boolean;
  timeSinceLastUsed: string;
}

export interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  expiredDevices: number;
  highTrustDevices: number;
}

class DeviceTrustService {
  /**
   * Get current device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const fingerprint = deviceFingerprintService.generateDeviceFingerprint();
    const deviceName = this.getDeviceName();
    const browserInfo = navigator.userAgent;
    const ipAddress = await this.getIPAddress();
    const location = await this.getLocation();
    
    return {
      deviceFingerprint: fingerprint,
      deviceName,
      browserInfo,
      ipAddress,
      location
    };
  }

  /**
   * Check if current device is trusted (DEPRECATED)
   * Device trust is now handled in login API
   */
  async checkDeviceTrust(_username: string): Promise<boolean> {
    console.warn('DEPRECATED: checkDeviceTrust method is deprecated. Device trust is now handled in login API.');
    return false; // Always return false to force using login API
  }

  /**
   * Get all trusted devices
   */
  async getTrustedDevices(): Promise<TrustedDevice[]> {
    try {
      const response = await apiService.api.get('/api/v1/device-trust/devices');
      return response.data;
    } catch (error) {
      console.error('Error getting trusted devices:', error);
      return [];
    }
  }

  /**
   * Add current device as trusted
   */
  async addTrustedDevice(): Promise<void> {
    try {
      const deviceInfo = await this.getDeviceInfo();
      await apiService.api.post('/api/v1/device-trust/devices', deviceInfo);
    } catch (error) {
      console.error('Error adding trusted device:', error);
      throw error;
    }
  }

  /**
   * Revoke a specific device
   */
  async revokeDevice(deviceId: string): Promise<void> {
    try {
      await apiService.api.delete(`/api/v1/device-trust/devices/${deviceId}`);
    } catch (error) {
      console.error('Error revoking device:', error);
      throw error;
    }
  }

  /**
   * Revoke all devices
   */
  async revokeAllDevices(): Promise<void> {
    try {
      await apiService.api.delete('/api/v1/device-trust/devices');
    } catch (error) {
      console.error('Error revoking all devices:', error);
      throw error;
    }
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(): Promise<DeviceStats> {
    try {
      const response = await apiService.api.get('/api/v1/device-trust/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting device stats:', error);
      return {
        totalDevices: 0,
        activeDevices: 0,
        expiredDevices: 0,
        highTrustDevices: 0
      };
    }
  }

  /**
   * Get human-readable device name
   */
  private getDeviceName(): string {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return `Chrome on ${platform}`;
    if (userAgent.includes('Firefox')) return `Firefox on ${platform}`;
    if (userAgent.includes('Safari')) return `Safari on ${platform}`;
    if (userAgent.includes('Edge')) return `Edge on ${platform}`;
    if (userAgent.includes('Opera')) return `Opera on ${platform}`;
    
    return `${platform} Browser`;
  }

  /**
   * Get IP address (simplified to avoid rate limits)
   */
  private async getIPAddress(): Promise<string> {
    // Skip IP address to avoid rate limits
    return 'unknown';
  }

  /**
   * Get location (simplified to avoid rate limits)
   */
  private async getLocation(): Promise<string> {
    // Skip location to avoid rate limits
    return 'unknown';
  }

  /**
   * Get trust level color
   */
  getTrustLevelColor(trustLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (trustLevel) {
      case 'HIGH': return '#4caf50';
      case 'MEDIUM': return '#ff9800';
      case 'LOW': return '#f44336';
      default: return '#9e9e9e';
    }
  }

  /**
   * Get trust level label
   */
  getTrustLevelLabel(trustLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    switch (trustLevel) {
      case 'HIGH': return 'High Trust';
      case 'MEDIUM': return 'Medium Trust';
      case 'LOW': return 'Low Trust';
      default: return 'Unknown';
    }
  }
}

export const deviceTrustService = new DeviceTrustService();
