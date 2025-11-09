import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base exception for Global Assets System
 */
export class GlobalAssetException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(message, status);
  }
}

/**
 * Exception thrown when a global asset is not found
 */
export class GlobalAssetNotFoundException extends GlobalAssetException {
  constructor(assetId: string) {
    super(`Global asset with ID ${assetId} not found`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when a global asset with the same symbol and nation already exists
 */
export class GlobalAssetAlreadyExistsException extends GlobalAssetException {
  constructor(symbol: string, nation: string) {
    super(`Asset with symbol ${symbol} and nation ${nation} already exists`, HttpStatus.CONFLICT);
  }
}

/**
 * Exception thrown when trying to modify an asset that has associated trades
 */
export class GlobalAssetCannotBeModifiedException extends GlobalAssetException {
  constructor(assetId: string) {
    super(`Asset with ID ${assetId} cannot be modified as it has associated trades`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when symbol format is invalid
 */
export class InvalidSymbolFormatException extends GlobalAssetException {
  constructor(symbol: string, nation: string, assetType: string) {
    super(`Invalid symbol format for ${assetType} in ${nation}: ${symbol}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when nation code is invalid
 */
export class InvalidNationCodeException extends GlobalAssetException {
  constructor(nation: string) {
    super(`Invalid nation code: ${nation}. Must be 2-letter ISO country code`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when market code is invalid
 */
export class InvalidMarketCodeException extends GlobalAssetException {
  constructor(marketCode: string) {
    super(`Invalid market code: ${marketCode}. Must be uppercase alphanumeric with dashes`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when currency code is invalid
 */
export class InvalidCurrencyCodeException extends GlobalAssetException {
  constructor(currency: string) {
    super(`Invalid currency code: ${currency}. Must be 3-letter ISO currency code`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when timezone is invalid
 */
export class InvalidTimezoneException extends GlobalAssetException {
  constructor(timezone: string) {
    super(`Invalid timezone: ${timezone}. Must follow IANA timezone format`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when asset type is invalid
 */
export class InvalidAssetTypeException extends GlobalAssetException {
  constructor(assetType: string) {
    super(`Invalid asset type: ${assetType}. Must be one of: STOCK, BOND, GOLD, DEPOSIT, CASH`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Exception thrown when nation configuration is not found
 */
export class NationConfigNotFoundException extends GlobalAssetException {
  constructor(nation: string) {
    super(`Nation configuration not found for code: ${nation}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Exception thrown when asset type is not enabled for a nation
 */
export class AssetTypeNotEnabledException extends GlobalAssetException {
  constructor(assetType: string, nation: string) {
    super(`Asset type ${assetType} is not enabled for nation ${nation}`, HttpStatus.BAD_REQUEST);
  }
}
