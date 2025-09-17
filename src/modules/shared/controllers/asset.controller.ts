import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Asset } from '../../asset/entities/asset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('Assets')
@Controller('api/v1/shared/assets')
export class AssetController {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({
    status: 200,
    description: 'List of assets retrieved successfully',
    type: [Asset],
  })
  async getAssets(): Promise<any[]> {
    const assets = await this.assetRepository.find({
      where: {},
      order: { symbol: 'ASC' },
    });
    
    // Map the response to include assetId field and exclude code field
    return assets.map(asset => {
      const { code, ...assetWithoutCode } = asset;
      return {
        ...assetWithoutCode,
        assetId: asset.id,
      };
    });
  }
}
