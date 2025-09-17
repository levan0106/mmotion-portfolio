import { Injectable, Logger } from '@nestjs/common';
import { AssetService } from '../services/asset.service';

/**
 * Trade Event Listener
 * Handles trade-related events to update asset computed fields
 * Note: Event emitter will be implemented later when @nestjs/event-emitter is available
 */
@Injectable()
export class TradeEventListener {
  private readonly logger = new Logger(TradeEventListener.name);

  constructor(private readonly assetService: AssetService) {}

  /**
   * Handle trade created event
   * Update computed fields for the affected asset
   */
  async handleTradeCreated(payload: { assetId: string; tradeId: string }) {
    this.logger.log(`Trade created for asset ${payload.assetId}, updating computed fields`);
    
    try {
      await this.assetService.updateAssetWithComputedFields(payload.assetId);
      this.logger.log(`Successfully updated computed fields for asset ${payload.assetId}`);
    } catch (error) {
      this.logger.error(`Failed to update computed fields for asset ${payload.assetId}:`, error);
    }
  }

  /**
   * Handle trade updated event
   * Update computed fields for the affected asset
   */
  async handleTradeUpdated(payload: { assetId: string; tradeId: string }) {
    this.logger.log(`Trade updated for asset ${payload.assetId}, updating computed fields`);
    
    try {
      await this.assetService.updateAssetWithComputedFields(payload.assetId);
      this.logger.log(`Successfully updated computed fields for asset ${payload.assetId}`);
    } catch (error) {
      this.logger.error(`Failed to update computed fields for asset ${payload.assetId}:`, error);
    }
  }

  /**
   * Handle trade deleted event
   * Update computed fields for the affected asset
   */
  async handleTradeDeleted(payload: { assetId: string; tradeId: string }) {
    this.logger.log(`Trade deleted for asset ${payload.assetId}, updating computed fields`);
    
    try {
      await this.assetService.updateAssetWithComputedFields(payload.assetId);
      this.logger.log(`Successfully updated computed fields for asset ${payload.assetId}`);
    } catch (error) {
      this.logger.error(`Failed to update computed fields for asset ${payload.assetId}:`, error);
    }
  }
}
