import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateNoteDto } from './create-note.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing note.
 */
export class UpdateNoteDto extends PartialType(CreateNoteDto) {
  /**
   * Updated date and time of the note.
   */
  @ApiPropertyOptional({
    description: 'Updated date and time of the note (ISO 8601 format with time)',
    example: '2024-12-20T15:45:00',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  noteDate?: string;

  /**
   * Updated content of the note.
   */
  @ApiPropertyOptional({
    description: 'Updated content of the note',
    example: 'Updated: Portfolio showing strong performance this quarter. Rebalancing completed.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  content?: string;
}

