import { IsString, IsEmail, IsOptional, IsBoolean, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new account.
 */
export class CreateAccountDto {
  /**
   * Account holder's name.
   */
  @ApiProperty({
    description: 'Account holder\'s name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  /**
   * Account holder's email address.
   */
  @ApiProperty({
    description: 'Account holder\'s email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  /**
   * Base currency for the account.
   */
  @ApiProperty({
    description: 'Base currency for the account',
    example: 'VND',
    enum: ['VND', 'USD', 'EUR', 'GBP', 'JPY'],
    required: false,
    default: 'VND',
  })
  @IsOptional()
  @IsString()
  @IsIn(['VND', 'USD', 'EUR', 'GBP', 'JPY'])
  baseCurrency?: string;

  /**
   * Whether this account can invest in funds.
   */
  @ApiProperty({
    description: 'Whether this account can invest in funds',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isInvestor?: boolean;
}

