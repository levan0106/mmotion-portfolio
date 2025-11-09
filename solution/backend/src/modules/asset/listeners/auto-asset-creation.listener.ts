import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../shared/events/user-created.event';
import { GlobalAssetService } from '../services/global-asset.service';
import { AssetService } from '../services/asset.service';

/**
 * Event listener for automatic asset creation when new users are created.
 * This approach uses event-driven architecture to decouple user creation from asset creation.
 */
@Injectable()
export class AutoAssetCreationListener {
  private readonly logger = new Logger(AutoAssetCreationListener.name);

  constructor(
    private readonly globalAssetService: GlobalAssetService,
    private readonly assetService: AssetService,
  ) {}

  /**
   * Handle user created event and automatically create assets for new users.
   * @param event - UserCreatedEvent containing user and account information
   */
  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`Handling user created event for: ${event.username} (${event.accountId})`);

    // Check if auto asset creation is enabled
    const enabled = process.env.AUTO_CREATE_ASSETS_FOR_NEW_USERS === 'true';
    if (!enabled) {
      this.logger.log('Auto asset creation is disabled');
      return;
    }

    try {
      // Get top 100 global assets
      const top100Assets = await this.globalAssetService.getTop100GlobalAssets();
      
      if (!top100Assets || top100Assets.length === 0) {
        this.logger.warn('No global assets found for new user setup');
        return;
      }

      // Extract global asset IDs
      const globalAssetIds = top100Assets.map(asset => asset.id);

      // Create assets using bulk create method
      const result = await this.assetService.bulkCreateAssetsFromGlobal(globalAssetIds, event.accountId);

      this.logger.log(
        `Auto asset creation completed for user ${event.username} (${event.accountId}): ` +
        `${result.summary.created} created, ${result.summary.failed} failed`
      );

      // Log any failures for debugging
      if (result.failed && result.failed.length > 0) {
        this.logger.warn(`Some assets failed to create for user ${event.username}:`, result.failed);
      }

    } catch (error) {
      this.logger.error(`Failed to create assets for new user ${event.username}: ${error.message}`);
      // Don't throw error - event handling should not fail user creation
    }
  }
}
