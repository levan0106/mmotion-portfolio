import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'action_url', nullable: true })
  actionUrl?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
