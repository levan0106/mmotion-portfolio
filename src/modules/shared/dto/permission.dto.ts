import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Permission name (unique)', example: 'users.create' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Display name for the permission', example: 'Create Users' })
  @IsString()
  @MaxLength(150)
  displayName: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permission category', example: 'user_management' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiPropertyOptional({ description: 'Whether this is a system permission', default: false })
  @IsOptional()
  @IsBoolean()
  isSystemPermission?: boolean;

  @ApiPropertyOptional({ description: 'Permission priority (higher number = higher priority)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: 'Display name for the permission' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission category' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Permission priority' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
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

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class PermissionCategoryDto {
  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category display name' })
  displayName: string;

  @ApiProperty({ description: 'Number of permissions in this category' })
  permissionCount: number;

  @ApiProperty({ description: 'Permissions in this category' })
  permissions: PermissionResponseDto[];
}
