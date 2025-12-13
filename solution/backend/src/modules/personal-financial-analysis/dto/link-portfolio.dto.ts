import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Link Portfolio DTO
 */
export class LinkPortfolioDto {
  @ApiProperty({
    description: 'Portfolio ID to link',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Portfolio ID must be a valid UUID' })
  portfolioId: string;
}

