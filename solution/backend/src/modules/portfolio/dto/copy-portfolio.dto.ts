import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for copying a portfolio
 */
export class CopyPortfolioDto {
  /**
   * ID of the portfolio to copy from
   */
  @ApiProperty({
    description: 'ID of the portfolio to copy from',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: 'string',
    format: 'uuid'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sourcePortfolioId: string;

  /**
   * Name for the new portfolio
   */
  @ApiProperty({
    description: 'Name for the new portfolio',
    example: 'Growth Portfolio Copy',
    type: 'string',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
