import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new note.
 */
export class CreateNoteDto {
  /**
   * ID of the portfolio this note belongs to.
   */
  @ApiProperty({
    description: 'ID of the portfolio this note belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  portfolioId: string;

  /**
   * ID of the asset this note is associated with (optional).
   * If not provided, the note is for the portfolio in general.
   */
  @ApiPropertyOptional({
    description: 'ID of the asset this note is associated with (optional)',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  /**
   * Date and time of the note (when the note was created or refers to).
   */
  @ApiProperty({
    description: 'Date and time of the note (ISO 8601 format with time)',
    example: '2024-12-19T14:30:00',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  noteDate: string;

  /**
   * Content of the note.
   */
  @ApiProperty({
    description: 'Content of the note',
    example: 'Portfolio showing strong performance this quarter. Consider rebalancing next month.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  content: string;
}

