import { Notification } from '../contexts/NotificationContext';
import { apiService } from './api';

export interface CreateNotificationRequest {
  userId: number;
  type: 'trade' | 'portfolio' | 'system' | 'market';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export class NotificationService {
  static async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    return apiService.post('/api/v1/notifications', data);
  }

  static async getUserNotifications(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationResponse> {
    return apiService.get(`/api/v1/notifications/user/${userId}?limit=${limit}&offset=${offset}`);
  }

  static async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    return apiService.put(`/api/v1/notifications/${notificationId}/read?userId=${userId}`);
  }

  static async markAllAsRead(userId: number): Promise<void> {
    return apiService.put(`/api/v1/notifications/user/${userId}/read-all`);
  }

  static async deleteNotification(notificationId: number, userId: number): Promise<void> {
    return apiService.delete(`/api/v1/notifications/${notificationId}?userId=${userId}`);
  }

  // Helper methods for creating specific notification types
  static async createTradeNotification(
    userId: number,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return apiService.post('/api/v1/notifications/trade', {
      userId,
      title,
      message,
      actionUrl,
      metadata,
    });
  }

  static async createPortfolioNotification(
    userId: number,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return apiService.post('/api/v1/notifications/portfolio', {
      userId,
      title,
      message,
      actionUrl,
      metadata,
    });
  }

  static async createSystemNotification(
    userId: number,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return apiService.post('/api/v1/notifications/system', {
      userId,
      title,
      message,
      actionUrl,
      metadata,
    });
  }

  static async createMarketNotification(
    userId: number,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return apiService.post('/api/v1/notifications/market', {
      userId,
      title,
      message,
      actionUrl,
      metadata,
    });
  }
}
