import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class SystemSettingsDto {
  @ApiProperty({ description: 'Enable role hierarchy', example: true })
  @IsBoolean()
  roleHierarchyEnabled: boolean;

  @ApiProperty({ description: 'Enable permission inheritance', example: true })
  @IsBoolean()
  permissionInheritance: boolean;

  @ApiProperty({ description: 'Enable auto role assignment for new users', example: true })
  @IsBoolean()
  autoRoleAssignment: boolean;

  @ApiProperty({ description: 'Default role for new users', example: 'investor' })
  @IsString()
  defaultRoleForNewUsers: string;

  @ApiProperty({ description: 'Session timeout in minutes', example: 30 })
  @IsNumber()
  @Min(5)
  @Max(1440)
  sessionTimeout: number;

  @ApiProperty({ description: 'Maximum login attempts before lockout', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(10)
  maxLoginAttempts: number;

  @ApiProperty({ description: 'Password expiry in days', example: 90 })
  @IsNumber()
  @Min(1)
  @Max(365)
  passwordExpiry: number;
}

export class UpdateSystemSettingsDto extends SystemSettingsDto {}

export class SystemSettingsResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Settings retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'System settings data', type: SystemSettingsDto })
  data: SystemSettingsDto;
}
