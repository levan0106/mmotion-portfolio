import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';
import { NotificationGateway } from './notification.gateway';
import { UserService } from '../modules/shared/services/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../modules/shared/entities/role.entity';

@Controller('api/v1/notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly userService: UserService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  @Post()
  async create(@Body() createNotificationDto: any): Promise<Notification> {
    return this.notificationService.create(createNotificationDto);
  }

  @Get('user/:userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.findByUserId(userId, limit, offset);
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: number,
    @Query('userId') userId: string,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id, userId);
  }

  @Put('user/:userId/read-all')
  async markAllAsRead(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: number,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.notificationService.delete(id, userId);
    return { message: 'Notification deleted' };
  }

  @Post('admin/broadcast')
  async broadcastToUsers(@Body() broadcastDto: {
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    priority?: string;
    targetUsers?: string[];
    targetRole?: string;
    sendToAll?: boolean;
  }): Promise<{ message: string; sentCount: number }> {
    // TODO: Add admin role guard here
    // For now, we'll implement basic broadcast functionality
    
    const { title, message, type = 'system', actionUrl, targetUsers, targetRole, sendToAll } = broadcastDto;
    
    let userIds: string[] = [];
    
    if (sendToAll) {
      // Get all user IDs from database
      const allUsers = await this.userService.getUsers({
        page: 1,
        limit: 1000, // Get up to 1000 users
      });
      userIds = allUsers.users.map(user => user.userId);
    } else if (targetUsers && targetUsers.length > 0) {
      userIds = targetUsers;
    } else if (targetRole) {
      // Get user IDs by role from database
      // First, we need to get the role ID by role name
      const role = await this.roleRepository.findOne({
        where: { name: targetRole }
      });
      if (role) {
        const usersByRole = await this.userService.getUsers({
          roleId: role.roleId,
          page: 1,
          limit: 1000, // Get up to 1000 users
        });
        userIds = usersByRole.users.map(user => user.userId);
      }
    }
    
    // Send notifications to all target users
    const sentCount = userIds.length;
    for (const userId of userIds) {
      await this.notificationGateway.sendNotification(
        userId,
        type as 'system',
        title,
        message,
        actionUrl,
        { priority: broadcastDto.priority || 'normal' }
      );
    }
    
    return {
      message: `Notification sent to ${sentCount} users`,
      sentCount
    };
  }
}
