import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsBoolean, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'User password', example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'User active status', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: 'User active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
  displayName?: string;

  @ApiProperty({ description: 'User active status', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Email verification status', example: true })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'User creation date', example: '2023-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'User last update date', example: '2023-01-01T00:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'User last login date', example: '2023-01-01T00:00:00.000Z' })
  lastLoginAt?: string;
}

export class UserSearchParamsDto {
  @ApiPropertyOptional({ description: 'Search query', example: 'john' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by email verification status', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class UserStatsResponseDto {
  @ApiProperty({ description: 'Total number of users', example: 150 })
  totalUsers: number;

  @ApiProperty({ description: 'Number of active users', example: 120 })
  activeUsers: number;

  @ApiProperty({ description: 'Number of inactive users', example: 30 })
  inactiveUsers: number;

  @ApiProperty({ description: 'Number of verified users', example: 140 })
  verifiedUsers: number;

  @ApiProperty({ description: 'Number of unverified users', example: 10 })
  unverifiedUsers: number;
}
