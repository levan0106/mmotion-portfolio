import { Injectable, Logger } from '@nestjs/common';
import { SystemSettingsDto, UpdateSystemSettingsDto, SystemSettingsResponseDto } from '../dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  // In-memory storage for now. In production, this should be stored in database
  private settings: SystemSettingsDto = {
    roleHierarchyEnabled: true,
    permissionInheritance: true,
    autoRoleAssignment: true,
    defaultRoleForNewUsers: 'Investor',
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
  };

  async getSettings(): Promise<SystemSettingsResponseDto> {
    this.logger.log('Retrieving system settings');
    
    return {
      success: true,
      message: 'Settings retrieved successfully',
      data: { ...this.settings },
    };
  }

  async updateSettings(updateSettingsDto: UpdateSystemSettingsDto): Promise<SystemSettingsResponseDto> {
    this.logger.log(`Updating system settings: ${JSON.stringify(updateSettingsDto)}`);
    
    // Validate settings
    this.validateSettings(updateSettingsDto);
    
    // Update settings
    this.settings = { ...this.settings, ...updateSettingsDto };
    
    this.logger.log(`Settings updated successfully: ${JSON.stringify(this.settings)}`);
    
    return {
      success: true,
      message: 'Settings updated successfully',
      data: { ...this.settings },
    };
  }

  private validateSettings(settings: UpdateSystemSettingsDto): void {
    // Validate session timeout
    if (settings.sessionTimeout && (settings.sessionTimeout < 5 || settings.sessionTimeout > 1440)) {
      throw new Error('Session timeout must be between 5 and 1440 minutes');
    }

    // Validate max login attempts
    if (settings.maxLoginAttempts && (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 10)) {
      throw new Error('Max login attempts must be between 1 and 10');
    }

    // Validate password expiry
    if (settings.passwordExpiry && (settings.passwordExpiry < 1 || settings.passwordExpiry > 365)) {
      throw new Error('Password expiry must be between 1 and 365 days');
    }

    // Validate default role
    if (settings.defaultRoleForNewUsers && settings.defaultRoleForNewUsers.trim() === '') {
      throw new Error('Default role for new users cannot be empty');
    }
  }

  // Get current settings (for internal use)
  getCurrentSettings(): SystemSettingsDto {
    return { ...this.settings };
  }

  // Check if auto role assignment is enabled
  isAutoRoleAssignmentEnabled(): boolean {
    return this.settings.autoRoleAssignment;
  }

  // Get default role for new users
  getDefaultRoleForNewUsers(): string {
    return this.settings.defaultRoleForNewUsers;
  }
}
