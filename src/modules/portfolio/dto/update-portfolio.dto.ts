import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreatePortfolioDto } from './create-portfolio.dto';

/**
 * DTO for updating an existing portfolio.
 */
export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {
  /**
   * Updated name of the portfolio.
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name?: string;

  /**
   * Updated base currency for the portfolio.
   */
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  baseCurrency?: string;

  /**
   * Updated funding source for the portfolio.
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  fundingSource?: string;
}
