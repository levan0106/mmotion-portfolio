import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception for Asset Price System
 */
export class AssetPriceException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

/**
 * Exception thrown when an asset price is not found
 */
export class AssetPriceNotFoundException extends AssetPriceException {
  constructor(priceId: string) {
    super(`Asset price with ID ${priceId} not found`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when an asset price for a specific asset is not found
 */
export class AssetPriceForAssetNotFoundException extends AssetPriceException {
  constructor(assetId: string) {
    super(`Asset price for asset with ID ${assetId} not found`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when price value is invalid
 */
export class InvalidPriceValueException extends AssetPriceException {
  constructor(price: number) {
    super(`Invalid price value: ${price}. Must be a positive number`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when price type is invalid
 */
export class InvalidPriceTypeException extends AssetPriceException {
  constructor(priceType: string) {
    super(`Invalid price type: ${priceType}. Must be one of: MANUAL, EXTERNAL`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when price source is invalid
 */
export class InvalidPriceSourceException extends AssetPriceException {
  constructor(priceSource: string) {
    super(`Invalid price source: ${priceSource}. Must be one of: USER_INPUT, EXTERNAL_API`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when last price update timestamp is invalid
 */
export class InvalidLastPriceUpdateException extends AssetPriceException {
  constructor(lastPriceUpdate: string) {
    super(`Invalid last price update timestamp: ${lastPriceUpdate}. Must be a valid ISO 8601 date string`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when trying to create a price for an asset that already has a price
 */
export class AssetPriceAlreadyExistsException extends AssetPriceException {
  constructor(assetId: string) {
    super(`Asset price for asset with ID ${assetId} already exists`, HttpStatus.CONFLICT);
  }
}

/**
 * Exception thrown when price change reason is too long
 */
export class PriceChangeReasonTooLongException extends AssetPriceException {
  constructor(reason: string, maxLength: number) {
    super(`Price change reason is too long: ${reason.length} characters. Maximum allowed: ${maxLength}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when metadata is invalid
 */
export class InvalidMetadataException extends AssetPriceException {
  constructor(metadata: any) {
    super(`Invalid metadata: ${JSON.stringify(metadata)}. Must be a valid JSON object`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when bulk update fails
 */
export class BulkUpdateFailedException extends AssetPriceException {
  constructor(failedCount: number, totalCount: number) {
    super(`Bulk update failed: ${failedCount} out of ${totalCount} updates failed`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when price history is not found
 */
export class PriceHistoryNotFoundException extends AssetPriceException {
  constructor(assetId: string, startDate?: string, endDate?: string) {
    const dateRange = startDate && endDate ? ` between ${startDate} and ${endDate}` : '';
    super(`Price history for asset with ID ${assetId}${dateRange} not found`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when price statistics cannot be calculated
 */
export class PriceStatisticsCalculationException extends AssetPriceException {
  constructor(reason: string) {
    super(`Cannot calculate price statistics: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}
