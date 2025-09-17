import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GlobalAssetException } from '../exceptions/global-asset.exceptions';
import { AssetPriceException } from '../exceptions/asset-price.exceptions';
import { ValidationException } from '../exceptions/validation.exceptions';

/**
 * Error handling guard for Global Assets System
 */
@Injectable()
export class ErrorHandlingGuard implements CanActivate {
  private readonly logger = new Logger(ErrorHandlingGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;

    try {
      // Validate request body if present
      if (body && Object.keys(body).length > 0) {
        this.validateRequestBody(body);
      }

      // Validate request parameters
      this.validateRequestParameters(request);

      // Validate request headers
      this.validateRequestHeaders(request);

      return true;
    } catch (error) {
      this.logger.error(`Guard validation failed for ${method} ${url}:`, error);
      throw error;
    }
  }

  private validateRequestBody(body: any): void {
    // Check for required fields based on the endpoint
    if (body.symbol && !this.isValidSymbol(body.symbol)) {
      throw new ValidationException('Invalid symbol format', 'symbol');
    }

    if (body.nation && !this.isValidNation(body.nation)) {
      throw new ValidationException('Invalid nation code', 'nation');
    }

    if (body.marketCode && !this.isValidMarketCode(body.marketCode)) {
      throw new ValidationException('Invalid market code', 'marketCode');
    }

    if (body.currency && !this.isValidCurrency(body.currency)) {
      throw new ValidationException('Invalid currency code', 'currency');
    }

    if (body.timezone && !this.isValidTimezone(body.timezone)) {
      throw new ValidationException('Invalid timezone', 'timezone');
    }

    if (body.type && !this.isValidAssetType(body.type)) {
      throw new ValidationException('Invalid asset type', 'type');
    }

    if (body.currentPrice && !this.isValidPrice(body.currentPrice)) {
      throw new ValidationException('Invalid price value', 'currentPrice');
    }

    if (body.priceType && !this.isValidPriceType(body.priceType)) {
      throw new ValidationException('Invalid price type', 'priceType');
    }

    if (body.priceSource && !this.isValidPriceSource(body.priceSource)) {
      throw new ValidationException('Invalid price source', 'priceSource');
    }

    if (body.lastPriceUpdate && !this.isValidDate(body.lastPriceUpdate)) {
      throw new ValidationException('Invalid date format', 'lastPriceUpdate');
    }
  }

  private validateRequestParameters(request: any): void {
    const { params } = request;

    // Validate UUID parameters
    if (params.id && !this.isValidUuid(params.id)) {
      throw new ValidationException('Invalid UUID format', 'id');
    }

    if (params.assetId && !this.isValidUuid(params.assetId)) {
      throw new ValidationException('Invalid UUID format', 'assetId');
    }

    // Validate nation code parameter
    if (params.code && !this.isValidNation(params.code)) {
      throw new ValidationException('Invalid nation code', 'code');
    }
  }

  private validateRequestHeaders(request: any): void {
    const { headers } = request;

    // Check for required headers
    if (!headers['content-type'] && request.method !== 'GET') {
      throw new HttpException('Content-Type header is required', HttpStatus.BAD_REQUEST);
    }

    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (!headers['content-type'] || !headers['content-type'].includes('application/json')) {
        throw new HttpException('Content-Type must be application/json', HttpStatus.BAD_REQUEST);
      }
    }
  }

  private isValidSymbol(symbol: string): boolean {
    return /^[A-Z0-9-]+$/.test(symbol) && symbol.length <= 50;
  }

  private isValidNation(nation: string): boolean {
    return /^[A-Z]{2}$/.test(nation);
  }

  private isValidMarketCode(marketCode: string): boolean {
    return /^[A-Z0-9-]+$/.test(marketCode) && marketCode.length <= 20;
  }

  private isValidCurrency(currency: string): boolean {
    return /^[A-Z]{3}$/.test(currency);
  }

  private isValidTimezone(timezone: string): boolean {
    return /^[A-Za-z_/]+$/.test(timezone) && timezone.length <= 50;
  }

  private isValidAssetType(type: string): boolean {
    const validTypes = ['STOCK', 'BOND', 'GOLD', 'DEPOSIT', 'CASH'];
    return validTypes.includes(type);
  }

  private isValidPrice(price: any): boolean {
    return typeof price === 'number' && price > 0 && !isNaN(price);
  }

  private isValidPriceType(priceType: string): boolean {
    const validTypes = ['MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'];
    return validTypes.includes(priceType);
  }

  private isValidPriceSource(priceSource: string): boolean {
    const validSources = ['USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'];
    return validSources.includes(priceSource);
  }

  private isValidDate(date: string): boolean {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  }

  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
