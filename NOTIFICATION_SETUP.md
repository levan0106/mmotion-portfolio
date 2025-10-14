# Notification System Setup Guide

## 🚀 Quick Start

### 1. Backend Setup

#### Run Database Migration
```bash
cd backend
npm run typeorm:migration:run
```

#### Start Backend Server
```bash
npm run start:dev
```

### 2. Frontend Setup

#### Install Dependencies (if needed)
```bash
cd frontend
npm install
```

#### Start Frontend Server
```bash
npm start
```

### 3. Environment Variables

The system now uses the existing `api.ts` service configuration. The API base URL is configured in `frontend/src/services/api.ts`:

```typescript
this.api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // ... other config
});
```

If you need to change the API URL, update the `VITE_API_URL` environment variable or modify the default fallback in `api.ts`.

## 📋 Features

### ✅ Implemented Features

1. **Real-time Notifications**
   - WebSocket connection for instant updates
   - Toast notifications with auto-dismiss
   - Notification bell with unread count

2. **Notification Types**
   - **Trade Notifications**: When trades are created
   - **Portfolio Notifications**: Portfolio value changes
   - **System Notifications**: System alerts
   - **Market Notifications**: Market data updates

3. **User Interface**
   - NotificationBell component in header
   - Dropdown list with notifications
   - Mark as read/unread functionality
   - Delete notifications
   - Mark all as read

4. **Backend API**
   - REST API endpoints for CRUD operations
   - WebSocket gateway for real-time updates
   - Database storage with proper indexing

## 🔧 API Endpoints

### REST API
- `POST /notifications` - Create notification
- `GET /notifications/user/:userId` - Get user notifications
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/user/:userId/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### WebSocket Events
- `join-user-room` - Join user-specific room
- `leave-user-room` - Leave user-specific room
- `new-notification` - Receive new notification

## 🎯 Usage Examples

### Creating Notifications Programmatically

```typescript
// In your service
import { NotificationGateway } from '../notification/notification.gateway';

// Send trade notification
await this.notificationGateway.sendTradeNotification(
  userId,
  'Trade Successful',
  'Successfully bought 100 shares at $50',
  '/portfolios/123/trading',
  { tradeId: '123', assetId: '456' }
);
```

### Frontend Integration

```typescript
// Using notification context
import { useNotifications } from '../contexts/NotificationContext';

const { notifications, unreadCount, markAsRead } = useNotifications();
```

## 🐛 Troubleshooting

### Common Issues

1. **"process is not defined" Error**
   - Solution: The system now uses the existing `apiService` from `src/services/api.ts`
   - All API calls go through the centralized API service with proper configuration

2. **WebSocket Connection Failed**
   - Check if backend is running on correct port
   - Verify WebSocket gateway is properly configured

3. **Notifications Not Showing**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check database migration was run

### Debug Steps

1. Check browser console for errors
2. Verify backend logs for WebSocket connections
3. Test API endpoints with Postman/curl
4. Check database for notification records

## 📊 Database Schema

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'trade', 'portfolio', 'system', 'market'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Integration Points

### Trading System Integration
- Notifications are automatically sent when trades are created
- Integration is in `TradingService.createTrade()` method
- Uses `NotificationGateway` for real-time delivery

### Frontend Integration
- `NotificationProvider` wraps the entire app
- `NotificationManager` handles real-time updates
- `NotificationBell` displays in header

## 🚀 Next Steps

1. **Add More Notification Types**
   - Portfolio performance alerts
   - Market data updates
   - System maintenance notifications

2. **Enhanced Features**
   - Email notifications
   - Push notifications
   - Notification preferences

3. **Testing**
   - Unit tests for notification service
   - Integration tests for WebSocket
   - E2E tests for user flows

## 📝 Notes

- The system uses hardcoded `userId: 1` for testing
- WebSocket connection is established automatically
- Notifications are stored in PostgreSQL database
- Real-time updates work across browser tabs
