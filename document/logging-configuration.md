# Logging System Configuration Guide

## Overview

The Portfolio Management System includes a comprehensive logging system that captures application events, business events, performance metrics, and HTTP requests. This guide covers all configuration options and setup procedures.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Logging Configuration](#logging-configuration)
3. [Database Configuration](#database-configuration)
4. [Performance Configuration](#performance-configuration)
5. [Security Configuration](#security-configuration)
6. [Monitoring Configuration](#monitoring-configuration)
7. [Docker Configuration](#docker-configuration)
8. [Troubleshooting](#troubleshooting)

## Environment Variables

### Core Logging Settings

```bash
# Logging Level (debug, info, warn, error, critical)
LOG_LEVEL=info

# Log Format (json, simple, combined)
LOG_FORMAT=json

# Enable/disable console logging
LOG_CONSOLE_ENABLED=true

# Enable/disable file logging
LOG_FILE_ENABLED=true

# Log file path
LOG_FILE_PATH=./logs/application.log

# Maximum log file size (in bytes)
LOG_MAX_FILE_SIZE=10485760

# Maximum number of log files to keep
LOG_MAX_FILES=5

# Enable/disable database logging
LOG_DATABASE_ENABLED=true
```

### Database Logging Configuration

```bash
# Database connection for logging
LOG_DATABASE_URL=postgresql://user:password@localhost:5432/portfolio_db

# Log retention period (in days)
LOG_RETENTION_DAYS=30

# Enable/disable log cleanup
LOG_CLEANUP_ENABLED=true

# Cleanup schedule (cron expression)
LOG_CLEANUP_SCHEDULE=0 2 * * *

# Batch size for log cleanup
LOG_CLEANUP_BATCH_SIZE=1000
```

### Performance Logging Configuration

```bash
# Enable/disable performance logging
LOG_PERFORMANCE_ENABLED=true

# Performance log threshold (in milliseconds)
LOG_PERFORMANCE_THRESHOLD=1000

# Enable/disable memory usage logging
LOG_MEMORY_USAGE_ENABLED=true

# Enable/disable CPU usage logging
LOG_CPU_USAGE_ENABLED=true

# Performance log retention (in days)
LOG_PERFORMANCE_RETENTION_DAYS=7
```

### Security Logging Configuration

```bash
# Enable/disable security logging
LOG_SECURITY_ENABLED=true

# Enable/disable authentication logging
LOG_AUTH_ENABLED=true

# Enable/disable audit logging
LOG_AUDIT_ENABLED=true

# Security log retention (in days)
LOG_SECURITY_RETENTION_DAYS=90

# Enable/disable IP address logging
LOG_IP_ADDRESS_ENABLED=true

# Enable/disable user agent logging
LOG_USER_AGENT_ENABLED=true
```

### Request Logging Configuration

```bash
# Enable/disable request logging
LOG_REQUEST_ENABLED=true

# Enable/disable response logging
LOG_RESPONSE_ENABLED=true

# Request log retention (in days)
LOG_REQUEST_RETENTION_DAYS=14

# Enable/disable request body logging
LOG_REQUEST_BODY_ENABLED=false

# Enable/disable response body logging
LOG_RESPONSE_BODY_ENABLED=false

# Maximum request/response body size (in bytes)
LOG_BODY_MAX_SIZE=1024
```

### Business Event Logging Configuration

```bash
# Enable/disable business event logging
LOG_BUSINESS_EVENTS_ENABLED=true

# Business event log retention (in days)
LOG_BUSINESS_EVENTS_RETENTION_DAYS=365

# Enable/disable entity change logging
LOG_ENTITY_CHANGES_ENABLED=true

# Enable/disable user action logging
LOG_USER_ACTIONS_ENABLED=true
```

## Logging Configuration

### Log Levels

The system supports the following log levels in order of severity:

1. **debug** - Detailed information for debugging
2. **info** - General information about application flow
3. **warn** - Warning messages for potential issues
4. **error** - Error messages for failed operations
5. **critical** - Critical errors that require immediate attention

### Log Formats

#### JSON Format (Recommended)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User logged in successfully",
  "context": {
    "userId": "user-123",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0..."
  },
  "service": "AuthService",
  "module": "Authentication",
  "requestId": "req-456"
}
```

#### Simple Format
```
2024-01-15T10:30:00.000Z [info] User logged in successfully - AuthService:Authentication - req-456
```

#### Combined Format
```
192.168.1.100 - - [15/Jan/2024:10:30:00 +0000] "POST /api/v1/auth/login" 200 1234 "Mozilla/5.0..." "req-456"
```

### Log Rotation

The system supports automatic log rotation with the following options:

- **Size-based rotation**: Rotate when file reaches maximum size
- **Time-based rotation**: Rotate daily, weekly, or monthly
- **Compression**: Compress old log files to save space
- **Retention**: Keep only specified number of old files

## Database Configuration

### Log Tables

The logging system uses the following database tables:

1. **application_logs** - Application-level logs
2. **request_logs** - HTTP request/response logs
3. **business_event_logs** - Business process logs
4. **performance_logs** - Performance metrics logs

### Indexes

The following indexes are created for optimal performance:

```sql
-- Application logs indexes
CREATE INDEX idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX idx_application_logs_level ON application_logs(level);
CREATE INDEX idx_application_logs_context ON application_logs(context);
CREATE INDEX idx_application_logs_user_id ON application_logs(user_id);

-- Request logs indexes
CREATE INDEX idx_request_logs_timestamp ON request_logs(timestamp);
CREATE INDEX idx_request_logs_method ON request_logs(method);
CREATE INDEX idx_request_logs_path ON request_logs(path);
CREATE INDEX idx_request_logs_status_code ON request_logs(status_code);

-- Business event logs indexes
CREATE INDEX idx_business_event_logs_timestamp ON business_event_logs(timestamp);
CREATE INDEX idx_business_event_logs_event_type ON business_event_logs(event_type);
CREATE INDEX idx_business_event_logs_entity_type ON business_event_logs(entity_type);
CREATE INDEX idx_business_event_logs_user_id ON business_event_logs(user_id);

-- Performance logs indexes
CREATE INDEX idx_performance_logs_timestamp ON performance_logs(timestamp);
CREATE INDEX idx_performance_logs_operation ON performance_logs(operation);
CREATE INDEX idx_performance_logs_duration ON performance_logs(duration);
```

### Partitioning

For high-volume logging, consider partitioning tables by date:

```sql
-- Partition application_logs by month
CREATE TABLE application_logs_y2024m01 PARTITION OF application_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE application_logs_y2024m02 PARTITION OF application_logs
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Performance Configuration

### Async Logging

Enable async logging to improve performance:

```typescript
// In logging configuration
const loggingConfig = {
  async: true,
  asyncOptions: {
    bufferSize: 1000,
    flushInterval: 5000, // 5 seconds
    maxRetries: 3
  }
};
```

### Caching

Enable caching for frequently accessed log data:

```typescript
// Cache configuration
const cacheConfig = {
  enabled: true,
  ttl: 300, // 5 minutes
  maxSize: 10000,
  strategy: 'lru'
};
```

### Batch Processing

Configure batch processing for log operations:

```typescript
// Batch processing configuration
const batchConfig = {
  enabled: true,
  batchSize: 100,
  flushInterval: 1000, // 1 second
  maxWaitTime: 5000 // 5 seconds
};
```

## Security Configuration

### Data Sanitization

Configure data sanitization to protect sensitive information:

```typescript
// Sanitization configuration
const sanitizationConfig = {
  enabled: true,
  patterns: [
    { pattern: /password/i, replacement: '[REDACTED]' },
    { pattern: /token/i, replacement: '[REDACTED]' },
    { pattern: /secret/i, replacement: '[REDACTED]' },
    { pattern: /key/i, replacement: '[REDACTED]' }
  ],
  fields: ['password', 'token', 'secret', 'apiKey', 'privateKey']
};
```

### Access Control

Configure access control for log data:

```typescript
// Access control configuration
const accessControlConfig = {
  enabled: true,
  roles: {
    admin: ['read', 'write', 'delete'],
    developer: ['read'],
    viewer: ['read']
  },
  ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
};
```

## Monitoring Configuration

### Health Checks

Configure health checks for logging system:

```typescript
// Health check configuration
const healthCheckConfig = {
  enabled: true,
  endpoints: {
    database: '/health/logs/database',
    file: '/health/logs/file',
    performance: '/health/logs/performance'
  },
  interval: 30000, // 30 seconds
  timeout: 5000 // 5 seconds
};
```

### Alerts

Configure alerts for logging issues:

```typescript
// Alert configuration
const alertConfig = {
  enabled: true,
  thresholds: {
    errorRate: 0.05, // 5%
    responseTime: 1000, // 1 second
    diskUsage: 0.8 // 80%
  },
  channels: ['email', 'slack', 'webhook'],
  recipients: ['admin@example.com', 'dev-team@example.com']
};
```

### Metrics

Configure metrics collection:

```typescript
// Metrics configuration
const metricsConfig = {
  enabled: true,
  providers: ['prometheus', 'grafana'],
  intervals: {
    logsPerSecond: 1000,
    errorRate: 5000,
    responseTime: 1000
  }
};
```

## Docker Configuration

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - LOG_LEVEL=info
      - LOG_FORMAT=json
      - LOG_DATABASE_ENABLED=true
      - LOG_DATABASE_URL=postgresql://user:password@postgres:5432/portfolio_db
    volumes:
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=portfolio_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

  logstash:
    image: logstash:8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
      - ./logs:/usr/share/logstash/logs
    depends_on:
      - elasticsearch

  elasticsearch:
    image: elasticsearch:8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: kibana:8.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Set logging environment variables
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json
ENV LOG_FILE_ENABLED=true
ENV LOG_FILE_PATH=/app/logs/application.log

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "start:prod"]
```

## Troubleshooting

### Common Issues

#### 1. High Memory Usage

**Problem**: Logging system consuming too much memory

**Solutions**:
- Enable async logging
- Reduce log buffer size
- Implement log rotation
- Use log levels to filter unnecessary logs

#### 2. Slow Database Queries

**Problem**: Log queries taking too long

**Solutions**:
- Add proper indexes
- Use database partitioning
- Implement query caching
- Optimize log retention policies

#### 3. Disk Space Issues

**Problem**: Log files consuming too much disk space

**Solutions**:
- Enable log rotation
- Implement log cleanup
- Use log compression
- Move old logs to external storage

#### 4. Missing Logs

**Problem**: Some logs not being captured

**Solutions**:
- Check log level configuration
- Verify logging service is running
- Check database connection
- Review log filters

### Performance Tuning

#### 1. Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM application_logs WHERE timestamp > NOW() - INTERVAL '1 day';

-- Update table statistics
ANALYZE application_logs;

-- Reindex if necessary
REINDEX TABLE application_logs;
```

#### 2. Application Optimization

```typescript
// Use connection pooling
const poolConfig = {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};
```

#### 3. Monitoring

```typescript
// Monitor logging performance
const performanceMonitor = {
  enabled: true,
  metrics: {
    logsPerSecond: true,
    averageResponseTime: true,
    errorRate: true,
    memoryUsage: true
  }
};
```

### Log Analysis

#### 1. Error Analysis

```bash
# Find most common errors
grep -i "error" logs/application.log | cut -d' ' -f4- | sort | uniq -c | sort -nr | head -10

# Find errors by service
grep -i "error" logs/application.log | grep "UserService" | wc -l
```

#### 2. Performance Analysis

```bash
# Find slow operations
grep "duration" logs/performance.log | awk '$3 > 1000' | sort -k3 -nr

# Find high memory usage
grep "memory" logs/performance.log | awk '$3 > 100' | sort -k3 -nr
```

#### 3. Business Event Analysis

```bash
# Find most common business events
grep "business-event" logs/business-event.log | cut -d' ' -f4- | sort | uniq -c | sort -nr | head -10

# Find events by user
grep "user-123" logs/business-event.log | wc -l
```

## Best Practices

### 1. Log Level Usage

- **debug**: Use for detailed debugging information
- **info**: Use for general application flow
- **warn**: Use for potential issues that don't stop execution
- **error**: Use for errors that are handled gracefully
- **critical**: Use for errors that require immediate attention

### 2. Log Message Format

```typescript
// Good log message
logger.info('User profile updated', {
  userId: 'user-123',
  changes: ['email', 'phone'],
  timestamp: new Date().toISOString()
});

// Bad log message
logger.info('Updated');
```

### 3. Context Information

Always include relevant context in log messages:

```typescript
// Include request context
logger.info('API request processed', {
  method: 'POST',
  path: '/api/v1/portfolios',
  statusCode: 201,
  duration: 150,
  userId: 'user-123',
  requestId: 'req-456'
});
```

### 4. Error Logging

Include stack traces and error details:

```typescript
// Good error logging
try {
  await processPortfolio(portfolioId);
} catch (error) {
  logger.error('Failed to process portfolio', {
    portfolioId,
    error: error.message,
    stack: error.stack,
    userId: context.userId
  });
}
```

### 5. Performance Logging

Log performance metrics for monitoring:

```typescript
// Performance logging
const startTime = Date.now();
try {
  const result = await calculatePortfolioValue(portfolioId);
  const duration = Date.now() - startTime;
  
  logger.info('Portfolio value calculated', {
    portfolioId,
    duration,
    assetCount: result.assets.length,
    totalValue: result.totalValue
  });
} catch (error) {
  const duration = Date.now() - startTime;
  logger.error('Failed to calculate portfolio value', {
    portfolioId,
    duration,
    error: error.message
  });
}
```

## Conclusion

This configuration guide provides comprehensive instructions for setting up and managing the logging system in the Portfolio Management System. Follow these guidelines to ensure optimal performance, security, and maintainability of your logging infrastructure.

For additional support or questions, please refer to the API documentation or contact the development team.
