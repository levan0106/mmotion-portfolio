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
   * Revoke device by fingerprint and username (public endpoint - no auth required)
   */
  async revokeDeviceByFingerprintAndUsername(deviceFingerprint: string, username: string): Promise<void> {
    try {
      await apiService.api.delete(`/api/v1/device-trust/devices/fingerprint/${deviceFingerprint}/username/${username}`);
    } catch (error) {
      console.error('Error revoking device by fingerprint and username:', error);
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
    const userAgent = navigator.userAgent;
    
    // Detect device type
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    
    // Detect browser
    let browser = 'Unknown Browser';
    if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
    else if (userAgent.includes('Chrome/')) browser = 'Google Chrome';
    else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) browser = 'Opera';
    
    // Detect operating system
    let os = 'Unknown OS';
    if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
    else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    // Create device description
    let deviceType = '';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    else if (isDesktop) deviceType = 'desktop';
    else deviceType = 'device';
    
    return `${deviceType} • ${browser} • ${os}`;
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
    // Try to get location from browser timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) {
        // Convert timezone to readable location
        if (timezone.includes('Ho_Chi_Minh') || timezone.includes('Bangkok')) {
          return 'Việt Nam';
        } else if (timezone.includes('Tokyo')) {
          return 'Nhật Bản';
        } else if (timezone.includes('Seoul')) {
          return 'Hàn Quốc';
        } else if (timezone.includes('Singapore')) {
          return 'Singapore';
        } else if (timezone.includes('New_York')) {
          return 'Hoa Kỳ';
        } else if (timezone.includes('London')) {
          return 'Anh';
        } else if (timezone.includes('Paris')) {
          return 'Pháp';
        } else if (timezone.includes('Berlin')) {
          return 'Đức';
        } else if (timezone.includes('Sydney')) {
          return 'Úc';
        } else {
          return timezone.replace(/_/g, ' ');
        }
      }
    } catch (error) {
      console.log('Could not detect location from timezone');
    }
    
    // Fallback to browser language
    const language = navigator.language || navigator.languages?.[0];
    if (language?.startsWith('vi')) {
      return 'Việt Nam';
    } else if (language?.startsWith('en')) {
      return 'English';
    } else if (language?.startsWith('ja')) {
      return 'Japan';
    } else if (language?.startsWith('ko')) {
      return 'Korea';
    } else if (language?.startsWith('zh')) {
      return 'China';
    }
    
    return 'Không xác định';
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
