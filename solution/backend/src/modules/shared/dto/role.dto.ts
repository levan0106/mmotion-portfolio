import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name (unique)', example: 'portfolio_manager' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Display name for the role', example: 'Portfolio Manager' })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this is a system role', default: false })
  @IsOptional()
  @IsBoolean()
  isSystemRole?: boolean;

  @ApiPropertyOptional({ description: 'Role priority (higher number = higher priority)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Permission IDs to assign to this role' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Display name for the role' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Role priority (higher number = higher priority)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class AssignPermissionsToRoleDto {
  @ApiProperty({ description: 'Permission IDs to assign to the role' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class RoleResponseDto {
  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'Role name' })
  name: string;

  @ApiProperty({ description: 'Display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Role description' })
  description?: string;

  @ApiProperty({ description: 'Whether this is a system role' })
  isSystemRole: boolean;

  @ApiProperty({ description: 'Role priority' })
  priority: number;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Permissions assigned to this role' })
  permissions?: PermissionResponseDto[];
}

export class PermissionResponseDto {
  @ApiProperty({ description: 'Permission ID' })
  permissionId: string;

  @ApiProperty({ description: 'Permission name' })
  name: string;

  @ApiProperty({ description: 'Display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  description?: string;

  @ApiProperty({ description: 'Permission category' })
  category: string;

  @ApiProperty({ description: 'Whether this is a system permission' })
  isSystemPermission: boolean;

  @ApiProperty({ description: 'Permission priority' })
  priority: number;
}
