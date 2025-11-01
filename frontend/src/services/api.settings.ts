import api from './api';

export interface SystemSettings {
  roleHierarchyEnabled: boolean;
  permissionInheritance: boolean;
  autoRoleAssignment: boolean;
  defaultRoleForNewUsers: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiry: number;
}

export interface AutoRoleAssignmentConfig {
  enabled: boolean;
  defaultRoleName: string;
  rules: RoleAssignmentRule[];
}

export interface RoleAssignmentRule {
  id: string;
  name: string;
  condition: string;
  roleName: string;
  priority: number;
  enabled: boolean;
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  settings?: SystemSettings;
}

export class SettingsApi {
  /**
   * Get current system settings
   */
  static async getSettings(): Promise<SystemSettings> {
    const response = await api.get('/api/v1/settings');
    return response.data;
  }

  /**
   * Update system settings
   */
  static async updateSettings(settings: Partial<SystemSettings>): Promise<SettingsResponse> {
    const response = await api.put('/api/v1/settings', settings);
    return response;
  }

  /**
   * Get auto role assignment configuration
   */
  static async getAutoRoleAssignmentConfig(): Promise<AutoRoleAssignmentConfig> {
    const response = await api.get('/api/v1/settings/auto-role-assignment');
    return response;
  }

  /**
   * Update auto role assignment configuration
   */
  static async updateAutoRoleAssignmentConfig(config: Partial<AutoRoleAssignmentConfig>): Promise<SettingsResponse> {
    const response = await api.put('/api/v1/settings/auto-role-assignment', config);
    return response;
  }

  /**
   * Test auto role assignment with sample user data
   */
  static async testAutoRoleAssignment(userData: any): Promise<{
    success: boolean;
    assignedRole: string;
    reason: string;
  }> {
    const response = await api.post('/api/v1/settings/auto-role-assignment/test', userData);
    return response;
  }

  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<{
    totalUsers: number;
    totalRoles: number;
    totalPermissions: number;
    activeUsers: number;
    systemRoles: number;
    customRoles: number;
  }> {
    const response = await api.get('/api/v1/settings/stats');
    return response;
  }

  /**
   * Execute bulk action
   */
  static async executeBulkAction(action: string): Promise<{
    success: boolean;
    message: string;
    result?: any;
  }> {
    const response = await api.post('/api/v1/settings/bulk-actions', { action });
    return response;
  }

  /**
   * Export system data
   */
  static async exportData(format: 'json' | 'csv' | 'excel'): Promise<Blob> {
    const response = await api.get(`/api/v1/settings/export?format=${format}`, {
      responseType: 'blob',
    });
    return response;
  }

  /**
   * Create backup
   */
  static async createBackup(): Promise<{
    success: boolean;
    message: string;
    backupId: string;
    downloadUrl: string;
  }> {
    const response = await api.post('/api/v1/settings/backup');
    return response;
  }

  /**
   * Run security audit
   */
  static async runSecurityAudit(): Promise<{
    success: boolean;
    message: string;
    issues: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }>;
  }> {
    const response = await api.post('/api/v1/settings/security-audit');
    return response;
  }

  /**
   * Cleanup expired roles
   */
  static async cleanupExpiredRoles(): Promise<{
    success: boolean;
    message: string;
    cleanedCount: number;
  }> {
    const response = await api.post('/api/v1/settings/cleanup-expired-roles');
    return response;
  }

  /**
   * Get demo account status
   */
  static async getDemoAccountStatus(): Promise<{
    enabled: boolean;
    accountId?: string;
    accountName?: string;
  }> {
    const response = await api.get('/api/v1/settings/demo-account');
    // Handle both response.data and direct response
    const data = response.data || response;
    if (!data || typeof data.enabled !== 'boolean') {
      // Return default if invalid response
      return { enabled: false };
    }
    return data;
  }

  /**
   * Toggle demo account (enable/disable)
   */
  static async toggleDemoAccount(enabled: boolean): Promise<{
    enabled: boolean;
    accountId?: string;
    accountName?: string;
  }> {
    const response = await api.post('/api/v1/settings/demo-account/toggle', { enabled });
    // Handle both response.data and direct response
    const data = response.data || response;
    if (!data || typeof data.enabled !== 'boolean') {
      throw new Error('Invalid response format from server');
    }
    return data;
  }
}
