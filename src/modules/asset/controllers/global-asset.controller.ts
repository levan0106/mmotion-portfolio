import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GlobalAssetService } from '../services/global-asset.service';
import { NationConfigService } from '../services/nation-config.service';
import { CreateGlobalAssetDto } from '../dto/create-global-asset.dto';
import { UpdateGlobalAssetDto } from '../dto/update-global-asset.dto';
import { GlobalAssetQueryDto } from '../dto/global-asset-query.dto';
import { GlobalAssetResponseDto } from '../dto/global-asset-response.dto';
import { GlobalAsset } from '../entities/global-asset.entity';

/**
 * Controller for managing global assets with multi-national support.
 * Provides CRUD operations for global assets and nation configuration.
 * 
 * CR-005 Global Assets System:
 * - Multi-national asset management
 * - Symbol + nation combination for global uniqueness
 * - Nation-specific market codes, currencies, and timezones
 * - Separated pricing data management
 * - System resilience with core functionality always available
 */
@ApiTags('Global Assets')
@Controller('api/v1/global-assets')
export class GlobalAssetController {
  constructor(
    private readonly globalAssetService: GlobalAssetService,
    private readonly nationConfigService: NationConfigService,
  ) {}

  /**
   * Get all global assets with filtering, pagination, and sorting.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all global assets',
    description: 'Retrieve all global assets with optional filtering, pagination, and sorting. Supports filtering by nation, type, and search terms.',
  })
  @ApiQuery({
    name: 'nation',
    required: false,
    description: 'Filter by nation code (e.g., VN, US, UK)',
    example: 'VN',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by asset type',
    enum: ['STOCK', 'BOND', 'GOLD', 'COMMODITY', 'DEPOSIT', 'CASH'],
    example: 'STOCK',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    type: 'boolean',
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in symbol and name fields',
    example: 'HPG',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: 'number',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of items to skip',
    type: 'number',
    example: 0,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by',
    enum: ['createdAt', 'updatedAt', 'symbol', 'name', 'nation'],
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Global assets retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/GlobalAssetResponseDto' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findAllGlobalAssets(
    @Query(ValidationPipe) queryDto: GlobalAssetQueryDto,
  ): Promise<{
    data: GlobalAssetResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.globalAssetService.findAll(queryDto);
    return result;
  }

  /**
   * Get a single global asset by symbol.
   */
  @Get('symbol/:symbol')
  @ApiOperation({
    summary: 'Get global asset by symbol',
    description: 'Retrieve a specific global asset by its symbol. Returns the first match found.',
  })
  @ApiParam({
    name: 'symbol',
    description: 'Asset symbol',
    type: 'string',
    example: 'BDS',
  })
  @ApiResponse({
    status: 200,
    description: 'Global asset retrieved successfully',
    type: GlobalAssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Global asset not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid symbol format',
  })
  async findGlobalAssetBySymbol(
    @Param('symbol') symbol: string,
  ): Promise<GlobalAssetResponseDto> {
    const asset = await this.globalAssetService.findBySymbol(symbol.toUpperCase());
    if (!asset) {
      throw new NotFoundException(`Global asset with symbol '${symbol}' not found.`);
    }
    return asset;
  }

  /**
   * Get a single global asset by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get global asset by ID',
    description: 'Retrieve a specific global asset by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Global asset ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Global asset retrieved successfully',
    type: GlobalAssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Global asset not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset ID format',
  })
  async findGlobalAssetById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GlobalAssetResponseDto> {
    const asset = await this.globalAssetService.findOne(id);
    if (!asset) {
      throw new NotFoundException(`Global asset with ID '${id}' not found.`);
    }
    return asset;
  }

  /**
   * Create a new global asset.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new global asset',
    description: 'Create a new global asset with nation-specific validation and default values.',
  })
  @ApiBody({
    type: CreateGlobalAssetDto,
    description: 'Global asset creation data',
    examples: {
      vietnamStock: {
        summary: 'Vietnamese Stock Example',
        value: {
          symbol: 'HPG',
          name: 'Hoa Phat Group',
          type: 'STOCK',
          nation: 'VN',
          marketCode: 'HOSE',
          currency: 'VND',
          timezone: 'Asia/Ho_Chi_Minh',
          description: 'Leading steel manufacturer in Vietnam',
        },
      },
      usStock: {
        summary: 'US Stock Example',
        value: {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          type: 'STOCK',
          nation: 'US',
          marketCode: 'NASDAQ',
          currency: 'USD',
          timezone: 'America/New_York',
          description: 'Technology company',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Global asset created successfully',
    type: GlobalAssetResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 409,
    description: 'Global asset with same symbol and nation already exists',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createGlobalAsset(
    @Body(ValidationPipe) createGlobalAssetDto: CreateGlobalAssetDto,
  ): Promise<GlobalAssetResponseDto> {
    const asset = await this.globalAssetService.create(createGlobalAssetDto);
    return asset;
  }

  /**
   * Update an existing global asset.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update global asset',
    description: 'Update an existing global asset. Symbol and nation cannot be changed after creation.',
  })
  @ApiParam({
    name: 'id',
    description: 'Global asset ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateGlobalAssetDto,
    description: 'Global asset update data',
    examples: {
      updateName: {
        summary: 'Update Asset Name',
        value: {
          name: 'Updated Asset Name',
          description: 'Updated description',
        },
      },
      updateStatus: {
        summary: 'Update Asset Status',
        value: {
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Global asset updated successfully',
    type: GlobalAssetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Global asset not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateGlobalAsset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateGlobalAssetDto: UpdateGlobalAssetDto,
  ): Promise<GlobalAssetResponseDto> {
    const asset = await this.globalAssetService.update(id, updateGlobalAssetDto);
    return asset;
  }

  /**
   * Delete a global asset.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete global asset',
    description: 'Delete a global asset. This will also delete associated price data and price history.',
  })
  @ApiParam({
    name: 'id',
    description: 'Global asset ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Global asset deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Global asset not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid asset ID format',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async deleteGlobalAsset(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.globalAssetService.remove(id);
  }

  /**
   * Get all supported nations configuration.
   */
  @Get('nations/list')
  @ApiOperation({
    summary: 'Get supported nations',
    description: 'Retrieve all supported nations with their configuration (currency, timezone, market codes).',
  })
  @ApiResponse({
    status: 200,
    description: 'Supported nations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        nations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VN' },
              name: { type: 'string', example: 'Vietnam' },
              currency: { type: 'string', example: 'VND' },
              timezone: { type: 'string', example: 'Asia/Ho_Chi_Minh' },
              marketCodes: {
                type: 'array',
                items: { type: 'string' },
                example: ['HOSE', 'HNX', 'UPCOM'],
              },
              defaultPriceSource: { type: 'string', example: 'MARKET_DATA_SERVICE' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getSupportedNations(): Promise<{
    nations: Array<{
      code: string;
      name: string;
      currency: string;
      timezone: string;
      marketCodes: string[];
      defaultPriceSource: string;
    }>;
  }> {
    const nationCodes = this.nationConfigService.getAvailableNations();
    const nations = nationCodes.map(code => {
      const config = this.nationConfigService.getNationConfig(code);
      return {
        code,
        name: config.name,
        currency: config.currency,
        timezone: config.timezone,
        marketCodes: config.marketCodes.map(mc => mc.code),
        defaultPriceSource: config.defaultPriceSource,
      };
    });

    return { nations };
  }

  /**
   * Get nation configuration by code.
   */
  @Get('nations/:code')
  @ApiOperation({
    summary: 'Get nation configuration',
    description: 'Retrieve configuration for a specific nation including currency, timezone, and market codes.',
  })
  @ApiParam({
    name: 'code',
    description: 'Nation code (2-letter ISO country code)',
    type: 'string',
    example: 'VN',
  })
  @ApiResponse({
    status: 200,
    description: 'Nation configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VN' },
        name: { type: 'string', example: 'Vietnam' },
        currency: { type: 'string', example: 'VND' },
        timezone: { type: 'string', example: 'Asia/Ho_Chi_Minh' },
        marketCodes: {
          type: 'array',
          items: { type: 'string' },
          example: ['HOSE', 'HNX', 'UPCOM'],
        },
        defaultPriceSource: { type: 'string', example: 'MARKET_DATA_SERVICE' },
        assetTypes: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              symbolPattern: { type: 'string', example: '^[A-Z0-9]{3}$' },
              description: { type: 'string', example: 'Vietnamese Stock' },
            },
          },
        },
        tradingHours: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dayOfWeek: { type: 'string', example: 'MONDAY' },
              open: { type: 'string', example: '09:00' },
              close: { type: 'string', example: '15:00' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Nation not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid nation code format',
  })
  async getNationConfig(
    @Param('code') code: string,
  ): Promise<any> {
    const config = this.nationConfigService.getNationConfig(code.toUpperCase() as any);
    return {
      code: code.toUpperCase(),
      ...config,
    };
  }

  /**
   * Validate asset symbol format for a specific nation and type.
   */
  @Get('nations/:code/validate-symbol')
  @ApiOperation({
    summary: 'Validate asset symbol format',
    description: 'Validate if an asset symbol matches the expected format for a specific nation and asset type.',
  })
  @ApiParam({
    name: 'code',
    description: 'Nation code (2-letter ISO country code)',
    type: 'string',
    example: 'VN',
  })
  @ApiQuery({
    name: 'symbol',
    required: true,
    description: 'Asset symbol to validate',
    type: 'string',
    example: 'HPG',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'Asset type',
    enum: ['STOCK', 'BOND', 'GOLD', 'COMMODITY', 'DEPOSIT', 'CASH'],
    example: 'STOCK',
  })
  @ApiResponse({
    status: 200,
    description: 'Symbol validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        symbol: { type: 'string', example: 'HPG' },
        nation: { type: 'string', example: 'VN' },
        type: { type: 'string', example: 'STOCK' },
        message: { type: 'string', example: 'Symbol format is valid' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid nation code or missing parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Nation not found',
  })
  async validateSymbolFormat(
    @Param('code') code: string,
    @Query('symbol') symbol: string,
    @Query('type') type: string,
  ): Promise<{
    valid: boolean;
    symbol: string;
    nation: string;
    type: string;
    message: string;
  }> {
    if (!symbol || !type) {
      return {
        valid: false,
        symbol: symbol || '',
        nation: code.toUpperCase(),
        type: type || '',
        message: 'Symbol and type parameters are required',
      };
    }

    try {
      const isValid = this.nationConfigService.validateSymbolFormat(
        code.toUpperCase() as any,
        type as any,
        symbol.toUpperCase(),
      );

      return {
        valid: isValid,
        symbol: symbol.toUpperCase(),
        nation: code.toUpperCase(),
        type: type.toUpperCase(),
        message: isValid ? 'Symbol format is valid' : 'Symbol format is invalid for this nation and type',
      };
    } catch (error) {
      return {
        valid: false,
        symbol: symbol.toUpperCase(),
        nation: code.toUpperCase(),
        type: type.toUpperCase(),
        message: error.message,
      };
    }
  }

}
