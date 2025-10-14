import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { SharedModule } from '../modules/shared/shared.module';
import { Role } from '../modules/shared/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Role]),
    forwardRef(() => SharedModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
