import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class RedeemFromFundDto {
  @ApiProperty({
    description: 'Account ID of the investor',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: 'Number of units to redeem',
    example: 1000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  units: number;

  @ApiProperty({
    description: 'Optional description for the redemption',
    example: 'Partial redemption for liquidity needs',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}
