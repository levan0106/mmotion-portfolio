import { User } from './api.user';

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

export interface RoleAssignmentResult {
  success: boolean;
  assignedRole: string;
  reason: string;
  userId: string;
}

export class AutoRoleAssignmentService {
  private static config: AutoRoleAssignmentConfig = {
    enabled: true,
    defaultRoleName: 'Investor',
    rules: [
      {
        id: 'email-domain',
        name: 'Email Domain Rule',
        condition: 'email.endsWith("@company.com")',
        roleName: 'Employee',
        priority: 1,
        enabled: true,
      },
      {
        id: 'department-it',
        name: 'IT Department Rule',
        condition: 'department === "IT"',
        roleName: 'Developer',
        priority: 2,
        enabled: true,
      },
      {
        id: 'position-manager',
        name: 'Manager Position Rule',
        condition: 'position === "Manager"',
        roleName: 'Manager',
        priority: 3,
        enabled: true,
      },
    ],
  };

  /**
   * Get current configuration
   */
  static getConfig(): AutoRoleAssignmentConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  static updateConfig(config: Partial<AutoRoleAssignmentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Determine which role to assign to a new user
   */
  static determineRoleForUser(user: User): RoleAssignmentResult {
    if (!this.config.enabled) {
      return {
        success: false,
        assignedRole: '',
        reason: 'Auto role assignment is disabled',
        userId: user.userId,
      };
    }

    // Sort rules by priority (lower number = higher priority)
    const sortedRules = [...this.config.rules]
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Check each rule
    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, user)) {
        return {
          success: true,
          assignedRole: rule.roleName,
          reason: `Matched rule: ${rule.name}`,
          userId: user.userId,
        };
      }
    }

    // Fallback to default role
    return {
      success: true,
      assignedRole: this.config.defaultRoleName,
      reason: 'No rules matched, using default role',
      userId: user.userId,
    };
  }

  /**
   * Evaluate a rule against user data
   */
  private static evaluateRule(rule: RoleAssignmentRule, user: User): boolean {
    try {
      switch (rule.condition) {
        case 'email.endsWith("@company.com")':
          return user.email.endsWith('@company.com');
        
        case 'department === "IT"':
          return user.department === 'IT';
        
        case 'position === "Manager"':
          return user.position === 'Manager';
        
        case 'department === "Finance"':
          return user.department === 'Finance';
        
        case 'position === "Director"':
          return user.position === 'Director';
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating rule:', rule.name, error);
      return false;
    }
  }

  /**
   * Get assignment statistics
   */
  static getAssignmentStats(): {
    totalAssignments: number;
    successfulAssignments: number;
    failedAssignments: number;
    mostUsedRole: string;
    ruleUsage: Record<string, number>;
  } {
    // This would typically come from a database
    return {
      totalAssignments: 0,
      successfulAssignments: 0,
      failedAssignments: 0,
      mostUsedRole: 'Investor',
      ruleUsage: {},
    };
  }

  /**
   * Test rule against sample user data
   */
  static testRule(rule: RoleAssignmentRule, testUser: Partial<User>): boolean {
    const mockUser: User = {
      userId: 'test',
      email: testUser.email || '',
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      displayName: testUser.displayName,
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      department: testUser.department,
      position: testUser.position,
    };

    return this.evaluateRule(rule, mockUser);
  }

  /**
   * Add new rule
   */
  static addRule(rule: Omit<RoleAssignmentRule, 'id'>): void {
    const newRule: RoleAssignmentRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    
    this.config.rules.push(newRule);
  }

  /**
   * Update existing rule
   */
  static updateRule(ruleId: string, updates: Partial<RoleAssignmentRule>): void {
    const ruleIndex = this.config.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.config.rules[ruleIndex] = { ...this.config.rules[ruleIndex], ...updates };
    }
  }

  /**
   * Delete rule
   */
  static deleteRule(ruleId: string): void {
    this.config.rules = this.config.rules.filter(rule => rule.id !== ruleId);
  }
}
