import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { SettingsService } from './settings.service';

@Injectable()
export class AutoRoleAssignmentService {
  private readonly logger = new Logger(AutoRoleAssignmentService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Assign default role to a new user based on system settings
   * This method is used by both UserService and AuthService
   */
  async assignDefaultRole(userId: string): Promise<void> {
    try {
      // Check if auto role assignment is enabled
      const settings = this.settingsService.getCurrentSettings();
      if (!settings.autoRoleAssignment) {
        this.logger.log('Auto role assignment is disabled');
        return;
      }

      // Get the default role
      const defaultRole = await this.roleRepository.findOne({
        where: { name: settings.defaultRoleForNewUsers },
      });

      if (!defaultRole) {
        this.logger.warn(`Default role '${settings.defaultRoleForNewUsers}' not found`);
        return;
      }

      // Check if user already has this role
      const existingUserRole = await this.userRoleRepository.findOne({
        where: { userId, roleId: defaultRole.roleId },
      });

      if (existingUserRole) {
        this.logger.log(`User ${userId} already has role ${defaultRole.name}`);
        return;
      }

      // Assign the default role
      const userRole = this.userRoleRepository.create({
        userId,
        roleId: defaultRole.roleId,
        assignedAt: new Date(),
        isActive: true,
      });

      await this.userRoleRepository.save(userRole);
      this.logger.log(`Assigned default role '${defaultRole.name}' to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to assign default role to user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if auto role assignment is enabled
   */
  isAutoRoleAssignmentEnabled(): boolean {
    const settings = this.settingsService.getCurrentSettings();
    return settings.autoRoleAssignment;
  }

  /**
   * Get the default role name for new users
   */
  getDefaultRoleName(): string {
    const settings = this.settingsService.getCurrentSettings();
    return settings.defaultRoleForNewUsers;
  }

  /**
   * Get default role entity
   */
  async getDefaultRole(): Promise<Role | null> {
    const settings = this.settingsService.getCurrentSettings();
    return await this.roleRepository.findOne({
      where: { name: settings.defaultRoleForNewUsers },
    });
  }
}
