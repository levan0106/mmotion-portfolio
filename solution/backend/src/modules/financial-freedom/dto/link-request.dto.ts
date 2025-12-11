import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class LinkGoalRequestDto {
  @ApiProperty({
    description: 'Goal ID to link to the plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  goalId: string;
}

export class LinkPortfolioRequestDto {
  @ApiProperty({
    description: 'Portfolio ID to link to the plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  portfolioId: string;
}

export class UnlinkGoalRequestDto {
  @ApiProperty({
    description: 'Goal ID to unlink from the plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  goalId: string;
}

export class UnlinkPortfolioRequestDto {
  @ApiProperty({
    description: 'Portfolio ID to unlink from the plan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  portfolioId: string;
}

