import { ApiProperty } from '@nestjs/swagger';

export class ReportSummaryDto {
  @ApiProperty({ description: 'Total value' })
  total: number;

  @ApiProperty({ description: 'Total count' })
  count: number;

  @ApiProperty({ description: 'Percentage of total' })
  percentage: number;

  @ApiProperty({ description: 'Capital value (cost basis)', required: false })
  capitalValue?: number;

  @ApiProperty({ description: 'Exchange/platform name', required: false })
  exchange?: string;

  @ApiProperty({ description: 'Funding source name', required: false })
  source?: string;

  @ApiProperty({ description: 'Asset group name', required: false })
  group?: string;
}

export class CashBalanceReportDto {
  @ApiProperty({ description: 'Total cash balance' })
  total: number;

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by exchange/platform' })
  byExchange: ReportSummaryDto[];

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by funding source' })
  byFundingSource: ReportSummaryDto[];

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by asset group' })
  byAssetGroup: ReportSummaryDto[];
}

export class DepositsReportDto {
  @ApiProperty({ description: 'Total deposits count' })
  total: number;

  @ApiProperty({ description: 'Total deposits value' })
  totalValue: number;

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by exchange/platform' })
  byExchange: ReportSummaryDto[];

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by funding source' })
  byFundingSource: ReportSummaryDto[];

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by asset group' })
  byAssetGroup: ReportSummaryDto[];
}

export class AssetsReportDto {
  @ApiProperty({ description: 'Total assets count' })
  total: number;

  @ApiProperty({ description: 'Total assets value' })
  totalValue: number;

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by exchange/platform' })
  byExchange: ReportSummaryDto[];

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by funding source' })
  byFundingSource: ReportSummaryDto[];

  @ApiProperty({ type: [ReportSummaryDto], description: 'Summary by asset group' })
  byAssetGroup: ReportSummaryDto[];
}

export class ReportDataDto {
  @ApiProperty({ type: CashBalanceReportDto, description: 'Cash balance report data' })
  cashBalance: CashBalanceReportDto;

  @ApiProperty({ type: DepositsReportDto, description: 'Deposits report data' })
  deposits: DepositsReportDto;

  @ApiProperty({ type: AssetsReportDto, description: 'Assets report data' })
  assets: AssetsReportDto;
}
