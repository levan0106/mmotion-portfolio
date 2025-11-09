export class NotificationResponseDto {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
