import { PartialType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';

/**
 * DTO for updating an account.
 */
export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

