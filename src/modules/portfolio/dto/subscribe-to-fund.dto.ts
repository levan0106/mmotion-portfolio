import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class SubscribeToFundDto {
  @ApiProperty({
    description: 'Account ID of the investor',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: 'Amount to invest in the fund',
    example: 1000000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Optional description for the subscription',
    example: 'Initial investment in tech fund',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;
}
