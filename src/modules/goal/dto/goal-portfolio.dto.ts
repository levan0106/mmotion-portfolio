import { IsUUID, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalPortfolioDto {
  @ApiProperty({ description: 'Portfolio ID' })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({ description: 'Weight of this portfolio in the goal (0-1)', default: 1.0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @ApiProperty({ description: 'Whether this is the primary portfolio for the goal', default: false })
  @IsBoolean()
  isPrimary: boolean;
}

export class UpdateGoalPortfolioDto {
  @ApiProperty({ description: 'Weight of this portfolio in the goal (0-1)', required: false })
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;

  @ApiProperty({ description: 'Whether this is the primary portfolio for the goal', required: false })
  @IsBoolean()
  isPrimary?: boolean;
}

export class GoalPortfolioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  goalId: string;

  @ApiProperty()
  portfolioId: string;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
