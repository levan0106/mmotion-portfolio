import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';

@Injectable()
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly notificationService: NotificationService) {}

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    
    this.userSockets.get(userId).add(client.id);
    client.join(`user-${userId}`);
    
    return { success: true, message: `Joined room for user ${userId}` };
  }

  @SubscribeMessage('leave-user-room')
  handleLeaveUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);
    }
    
    client.leave(`user-${userId}`);
    return { success: true, message: `Left room for user ${userId}` };
  }

  async sendNotification(
    userId: string,
    type: 'trade' | 'portfolio' | 'system' | 'market',
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any,
  ) {
    try {
      // Save notification to database
      const notification = await this.notificationService.create({
        userId,
        type,
        title,
        message,
        actionUrl,
        metadata,
      });
      
      console.log(`Saved ${type} notification to database for user ${userId}: ${title}`);
      
      // Emit real-time notification
      this.server.to(`user-${userId}`).emit('notification', {
        id: notification.id,
        type,
        title,
        message,
        actionUrl,
        metadata,
        isRead: false,
        createdAt: notification.createdAt,
        timestamp: new Date(),
      });
      
      console.log(`Sent real-time ${type} notification to user ${userId}: ${title}`);
    } catch (error) {
      console.error(`Error sending ${type} notification to user ${userId}:`, error);
    }
  }

  // Convenience methods for backward compatibility
  async sendTradeNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any,
  ) {
    return this.sendNotification(userId, 'trade', title, message, actionUrl, metadata);
  }

  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any,
  ) {
    return this.sendNotification(userId, 'system', title, message, actionUrl, metadata);
  }

  async sendPortfolioNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any,
  ) {
    return this.sendNotification(userId, 'portfolio', title, message, actionUrl, metadata);
  }

  async sendMarketNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any,
  ) {
    return this.sendNotification(userId, 'market', title, message, actionUrl, metadata);
  }
}
