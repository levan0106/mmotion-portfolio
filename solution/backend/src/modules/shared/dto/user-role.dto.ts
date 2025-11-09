import { IsString, IsOptional, IsBoolean, IsUUID, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRoleToUserDto {
  @ApiProperty({ description: 'Role ID to assign' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ description: 'When the role assignment expires (ISO date string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the role assignment' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ description: 'Whether the role assignment is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'When the role assignment expires (ISO date string)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the role assignment' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UserRoleResponseDto {
  @ApiProperty({ description: 'User role assignment ID' })
  userRoleId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'Role name' })
  roleName: string;

  @ApiProperty({ description: 'Role display name' })
  roleDisplayName: string;

  @ApiPropertyOptional({ description: 'ID of user who assigned this role' })
  assignedBy?: string;

  @ApiProperty({ description: 'When the role was assigned' })
  assignedAt: Date;

  @ApiPropertyOptional({ description: 'When the role assignment expires' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Whether the role assignment is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Whether the role assignment is currently valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Whether the role assignment has expired' })
  isExpired: boolean;
}

export class UserPermissionsResponseDto {
  @ApiProperty({ description: 'User roles' })
  userRoles: UserRoleResponseDto[];

  @ApiProperty({ description: 'All permissions for this user' })
  permissions: any[];
}
