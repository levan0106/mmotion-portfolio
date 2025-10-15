import { 
  IsUUID, 
  IsString, 
  IsNumber, 
  IsDateString, 
  IsOptional, 
  IsEnum,
  Min, 
  Max, 
  Length,
  IsPositive,
  ValidateIf
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDepositDto {
  @IsUUID()
  @ApiProperty({ 
    description: 'Portfolio ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  portfolioId: string;

  @IsString()
  @Length(1, 100)
  @ApiProperty({ 
    description: 'Bank name',
    example: 'Vietcombank',
    maxLength: 100
  })
  bankName: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  @ApiProperty({ 
    description: 'Account number (optional)',
    example: '1234567890',
    maxLength: 50,
    required: false
  })
  accountNumber?: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ 
    description: 'Principal amount in VND',
    example: 10000000,
    minimum: 0
  })
  principal: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({ 
    description: 'Interest rate (%/year)',
    example: 6.5,
    minimum: 0,
    maximum: 100
  })
  interestRate: number;

  @IsDateString()
  @ApiProperty({ 
    description: 'Start date',
    example: '2024-01-01'
  })
  startDate: string;

  @IsDateString()
  @ApiProperty({ 
    description: 'End date',
    example: '2024-12-31'
  })
  endDate: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Notes',
    example: 'Fixed deposit for 1 year',
    required: false
  })
  notes?: string;
}

export class UpdateDepositDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @ApiPropertyOptional({ 
    description: 'Bank name',
    example: 'Vietcombank',
    maxLength: 100,
    required: false
  })
  bankName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  @ApiPropertyOptional({ 
    description: 'Account number',
    example: '1234567890',
    maxLength: 50,
    required: false
  })
  accountNumber?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({ 
    description: 'Principal amount in VND',
    example: 10000000,
    minimum: 0,
    required: false
  })
  principal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ 
    description: 'Interest rate (%/year)',
    example: 6.5,
    minimum: 0,
    maximum: 100,
    required: false
  })
  interestRate?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ 
    description: 'Start date',
    example: '2024-01-01',
    required: false
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ 
    description: 'End date',
    example: '2024-12-31',
    required: false
  })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Notes',
    example: 'Fixed deposit for 1 year',
    required: false
  })
  notes?: string;
}

export class SettleDepositDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({ 
    description: 'Actual interest received',
    example: 650000,
    minimum: 0
  })
  actualInterest: number;

  @IsString()
  @IsDateString()
  @ApiProperty({ 
    description: 'Settlement date',
    example: '2025-10-01',
    type: 'string',
    format: 'date'
  })
  settlementDate: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Settlement notes',
    example: 'Early settlement due to emergency',
    required: false
  })
  notes?: string;
}

export class DepositResponseDto {
  @ApiProperty({ description: 'Deposit ID' })
  depositId: string;

  @ApiProperty({ description: 'Portfolio ID' })
  portfolioId: string;

  @ApiProperty({ description: 'Bank name' })
  bankName: string;

  @ApiProperty({ description: 'Account number (optional)' })
  accountNumber?: string;

  @ApiProperty({ description: 'Principal amount' })
  principal: number;

  @ApiProperty({ description: 'Interest rate (%/year)' })
  interestRate: number;

  @ApiProperty({ description: 'Start date' })
  startDate: string;

  @ApiProperty({ description: 'End date' })
  endDate: string;

  @ApiProperty({ description: 'Deposit status', enum: ['ACTIVE', 'SETTLED'] })
  status: 'ACTIVE' | 'SETTLED';

  @ApiPropertyOptional({ description: 'Actual interest received' })
  actualInterest?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Accrued interest' })
  accruedInterest: number;

  @ApiProperty({ description: 'Total value (principal + interest)' })
  totalValue: number;

  @ApiProperty({ description: 'Is deposit matured' })
  isMatured: boolean;

  @ApiProperty({ description: 'Can deposit be edited' })
  canBeEdited: boolean;

  @ApiProperty({ description: 'Can deposit be settled' })
  canBeSettled: boolean;

  @ApiProperty({ description: 'Days until maturity' })
  daysUntilMaturity: number;

  @ApiProperty({ description: 'Term description' })
  termDescription: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Settled at' })
  settledAt?: string;
}

export class DepositAnalyticsDto {
  @ApiProperty({ description: 'Total number of deposits' })
  totalDeposits: number;

  @ApiProperty({ description: 'Total principal amount' })
  totalPrincipal: number;

  @ApiProperty({ description: 'Total accrued interest' })
  totalAccruedInterest: number;

  @ApiProperty({ description: 'Total value (principal + interest)' })
  totalValue: number;

  @ApiProperty({ description: 'Average interest rate' })
  averageInterestRate: number;

  @ApiProperty({ description: 'Number of active deposits' })
  activeDeposits: number;

  @ApiProperty({ description: 'Number of settled deposits' })
  settledDeposits: number;

  @ApiProperty({ description: 'Total settled interest' })
  totalSettledInterest: number;

  @ApiProperty({ description: 'Average deposit amount' })
  averageDepositAmount: number;

  @ApiProperty({ description: 'Largest deposit amount' })
  largestDepositAmount: number;

  @ApiProperty({ description: 'Smallest deposit amount' })
  smallestDepositAmount: number;
}

export class DepositFiltersDto {
  @IsUUID()
  @ApiProperty({ 
    description: 'Filter by account ID',
    required: true
  })
  accountId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ 
    description: 'Filter by portfolio ID',
    required: false
  })
  portfolioId?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'SETTLED'])
  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ['ACTIVE', 'SETTLED'],
    required: false
  })
  status?: 'ACTIVE' | 'SETTLED';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Filter by bank name (partial match)',
    required: false
  })
  bankName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'Page number',
    example: 1,
    minimum: 1,
    required: false
  })
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ 
    description: 'Items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Sort by field',
    example: 'createdAt',
    required: false
  })
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    required: false
  })
  sortOrder?: 'ASC' | 'DESC';
}

export class PaginatedDepositResponseDto {
  @ApiProperty({ 
    description: 'Array of deposits',
    type: [DepositResponseDto]
  })
  data: DepositResponseDto[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class DepositStatisticsDto {
  @ApiProperty({ description: 'Total deposits count' })
  totalDeposits: number;

  @ApiProperty({ description: 'Active deposits count' })
  activeDeposits: number;

  @ApiProperty({ description: 'Settled deposits count' })
  settledDeposits: number;

  @ApiProperty({ description: 'Total principal amount' })
  totalPrincipal: number;

  @ApiProperty({ description: 'Total accrued interest' })
  totalAccruedInterest: number;

  @ApiProperty({ description: 'Total settled interest' })
  totalSettledInterest: number;

  @ApiProperty({ description: 'Total value' })
  totalValue: number;

  @ApiProperty({ description: 'Average interest rate' })
  averageInterestRate: number;
}
