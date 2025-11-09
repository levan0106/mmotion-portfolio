import { IsString, IsOptional, IsNumber, IsObject, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsIn(['trade', 'portfolio', 'system', 'market'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
