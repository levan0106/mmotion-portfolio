import { IsUUID, IsNumber, IsOptional, IsPositive, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for setting risk targets.
 * Contains validation rules and API documentation for risk target creation.
 */
export class SetRiskTargetsDto {
  @ApiProperty({
    description: 'Asset ID',
    example: 'b1c9a597-9cd4-476d-8f4c-a33191e8abe4',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Asset ID must be a valid UUID' })
  assetId: string;

  @ApiPropertyOptional({
    description: 'Stop loss price',
    example: 24000,
    minimum: 0,
  })
  @ValidateIf((o) => o.stopLoss !== undefined || o.takeProfit === undefined)
  @IsNumber({}, { message: 'Stop loss must be a number' })
  @IsPositive({ message: 'Stop loss must be positive' })
  stopLoss?: number;

  @ApiPropertyOptional({
    description: 'Take profit price',
    example: 28000,
    minimum: 0,
  })
  @ValidateIf((o) => o.takeProfit !== undefined || o.stopLoss === undefined)
  @IsNumber({}, { message: 'Take profit must be a number' })
  @IsPositive({ message: 'Take profit must be positive' })
  takeProfit?: number;

  @ApiProperty({
    description: 'Current market price',
    example: 26000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Current price must be a number' })
  @IsPositive({ message: 'Current price must be positive' })
  currentPrice: number;
}

/**
 * Data Transfer Object for updating risk targets.
 * Contains validation rules and API documentation for risk target updates.
 */
export class UpdateRiskTargetsDto {
  @ApiPropertyOptional({
    description: 'Stop loss price',
    example: 24000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Stop loss must be a number' })
  @IsPositive({ message: 'Stop loss must be positive' })
  stopLoss?: number;

  @ApiPropertyOptional({
    description: 'Take profit price',
    example: 28000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Take profit must be a number' })
  @IsPositive({ message: 'Take profit must be positive' })
  takeProfit?: number;

  @ApiPropertyOptional({
    description: 'Current market price',
    example: 26000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Current price must be a number' })
  @IsPositive({ message: 'Current price must be positive' })
  currentPrice?: number;
}