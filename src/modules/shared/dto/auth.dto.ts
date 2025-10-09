import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDateString, MinLength, Matches, ValidateIf } from 'class-validator';

export class LoginOrRegisterDto {
  @ApiProperty({
    description: 'Username for login or registration (letters, numbers, hyphens, and underscores only)',
    example: 'john_doe',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username must contain only letters, numbers, hyphens (-), and underscores (_)'
  })
  username: string;

  @ApiProperty({
    description: 'Password (required for users with password set)',
    example: 'password123',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'User date of birth',
    example: '1990-01-01',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.dateOfBirth && o.dateOfBirth.trim() !== '')
  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO 8601 date string' })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'User address',
    example: '123 Main St, City, Country',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}

export class SetPasswordDto {
  @ApiProperty({
    description: 'New password (min 6 chars, any characters)',
    example: 'pass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'oldpassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (min 6 chars, any characters)',
    example: 'newpass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  token: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'User information',
  })
  user: {
    userId: string;
    username: string;
    email?: string;
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    avatarText?: string;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
    isPasswordSet: boolean;
    authState: 'DEMO' | 'PARTIAL' | 'COMPLETE';
  };

  @ApiProperty({
    description: 'Main account information',
  })
  account: {
    accountId: string;
    name: string;
    email: string;
    baseCurrency: string;
    isInvestor: boolean;
    isMainAccount: boolean;
  };

  @ApiProperty({
    description: 'JWT token (if applicable)',
    required: false,
  })
  token?: string;
}
