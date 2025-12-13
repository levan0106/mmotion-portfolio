import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Link Financial Freedom Plan DTO
 */
export class LinkPlanDto {
  @ApiProperty({
    description: 'Financial Freedom Plan ID to link',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Plan ID must be a valid UUID' })
  planId: string;
}

