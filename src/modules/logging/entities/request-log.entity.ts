import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Account } from '../../shared/entities/account.entity';

/**
 * RequestLog entity for storing HTTP request/response logs.
 * Tracks all incoming HTTP requests with detailed information about
 * request parameters, response status, timing, and user context.
 */
@Entity('request_logs')
@Unique('UQ_request_logs_request_id', ['requestId'])
@Index('idx_req_logs_timestamp', ['timestamp'])
@Index('idx_req_logs_user_id', ['userId'])
@Index('idx_req_logs_response_status', ['responseStatus'])
@Index('idx_req_logs_method', ['method'])
@Index('idx_req_logs_url', ['url'])
export class RequestLog {
  /**
   * Unique identifier for the log entry.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique identifier for the HTTP request.
   * Used for correlating request/response pairs and tracing.
   */
  @Column({ type: 'uuid', unique: true, name: 'request_id' })
  requestId: string;

  /**
   * Timestamp when the request was received.
   * Uses timezone-aware timestamp for accurate time tracking.
   */
  @Column({ 
    type: 'timestamp with time zone', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  timestamp: Date;

  /**
   * HTTP method used for the request.
   * Values: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', etc.
   */
  @Column({ type: 'varchar', length: 10, name: 'method' })
  method: string;

  /**
   * Full URL of the request including path and query parameters.
   * Example: '/api/v1/portfolios?page=1&limit=10'
   */
  @Column({ type: 'text', name: 'url' })
  url: string;

  /**
   * HTTP headers sent with the request as JSON.
   * Contains authentication, content-type, user-agent, etc.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'headers' })
  headers: Record<string, any>;

  /**
   * Request body data as JSON.
   * Contains POST/PUT request payload data.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'body' })
  body: Record<string, any>;

  /**
   * Query parameters from the URL as JSON.
   * Contains pagination, filtering, and search parameters.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'query_params' })
  queryParams: Record<string, any>;

  /**
   * ID of the user who made the request.
   * References the Account entity.
   */
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  /**
   * IP address of the client making the request.
   * Supports both IPv4 and IPv6 addresses.
   */
  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress: string;

  /**
   * User-Agent string from the request headers.
   * Contains browser/client information.
   */
  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  /**
   * HTTP response status code.
   * Example: 200, 201, 400, 401, 404, 500, etc.
   */
  @Column({ type: 'integer', nullable: true, name: 'response_status' })
  responseStatus: number;

  /**
   * Response time in milliseconds.
   * Time taken to process the request and send response.
   */
  @Column({ type: 'integer', nullable: true, name: 'response_time_ms' })
  responseTimeMs: number;

  /**
   * Response body size in bytes.
   * Size of the response data sent to client.
   */
  @Column({ type: 'integer', nullable: true, name: 'response_size_bytes' })
  responseSizeBytes: number;

  /**
   * Timestamp when the log entry was created in the database.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Reference to the Account entity that made the request.
   * Optional relationship for authenticated requests.
   */
  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  account?: Account;
}
