import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TrackingAlertService, TrackingAlertData } from '../services/tracking-alert.service';
import { GlobalAssetTracking, GlobalAssetSyncStatus } from '../entities/global-asset-tracking.entity';

/**
 * Event for tracking failure
 */
export class TrackingFailureEvent {
  constructor(
    public readonly tracking: GlobalAssetTracking,
    public readonly alertData: TrackingAlertData,
  ) {}
}

/**
 * Event for critical tracking failure
 */
export class CriticalTrackingFailureEvent {
  constructor(
    public readonly tracking: GlobalAssetTracking,
    public readonly alertData: TrackingAlertData,
  ) {}
}


/**
 * Event listener for tracking alerts.
 * This approach uses event-driven architecture to decouple tracking logic from notification logic.
 */
@Injectable()
export class TrackingAlertListener {
  private readonly logger = new Logger(TrackingAlertListener.name);

  constructor(
    private readonly trackingAlertService: TrackingAlertService,
  ) {}

  /**
   * Handle tracking failure event and send alert to admin.
   * @param event - TrackingFailureEvent containing tracking and alert data
   */
  @OnEvent('tracking.failure')
  async handleTrackingFailure(event: TrackingFailureEvent): Promise<void> {
    this.logger.log(`Handling tracking failure event for execution: ${event.tracking.executionId}`);

    try {
      await this.trackingAlertService.sendTrackingFailureAlert(event.tracking, event.alertData);
      this.logger.log(`Successfully sent failure alert for execution: ${event.tracking.executionId}`);
    } catch (error) {
      this.logger.error(`Failed to send tracking failure alert for ${event.tracking.executionId}: ${error.message}`);
      // Don't throw error - event handling should not fail tracking process
    }
  }

  /**
   * Handle critical tracking failure event and send critical alert to admin.
   * @param event - CriticalTrackingFailureEvent containing tracking and alert data
   */
  @OnEvent('tracking.critical_failure')
  async handleCriticalTrackingFailure(event: CriticalTrackingFailureEvent): Promise<void> {
    this.logger.log(`Handling critical tracking failure event for execution: ${event.tracking.executionId}`);

    try {
      await this.trackingAlertService.sendCriticalTrackingAlert(event.tracking, event.alertData);
      this.logger.log(`Successfully sent critical alert for execution: ${event.tracking.executionId}`);
    } catch (error) {
      this.logger.error(`Failed to send critical tracking alert for ${event.tracking.executionId}: ${error.message}`);
      // Don't throw error - event handling should not fail tracking process
    }
  }

}
