import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for business event logging
 */
export const LOG_BUSINESS_EVENT_KEY = 'log_business_event';

/**
 * Interface for business event metadata
 */
export interface BusinessEventMetadata {
  eventName: string;
  description?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  includeRequestData?: boolean;
  includeResponseData?: boolean;
  includeUserContext?: boolean;
  customFields?: Record<string, any>;
}

/**
 * Decorator to automatically log business events when a method is called.
 * 
 * Usage:
 * ```typescript
 * @LogBusinessEvent({
 *   eventName: 'user_registration',
 *   description: 'User registered successfully',
 *   category: 'authentication',
 *   severity: 'medium',
 *   includeRequestData: true,
 *   includeUserContext: true
 * })
 * async registerUser(userData: CreateUserDto): Promise<User> {
 *   // Business logic here
 * }
 * ```
 * 
 * @param metadata - Business event configuration
 */
export function LogBusinessEvent(metadata: BusinessEventMetadata) {
  return SetMetadata(LOG_BUSINESS_EVENT_KEY, metadata);
}
