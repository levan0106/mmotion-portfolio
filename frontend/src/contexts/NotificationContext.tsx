import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiService } from '../services/api';

export interface Notification {
  id: number;
  userId: number;
  type: 'trade' | 'portfolio' | 'system' | 'market';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  socket: Socket | null;
  isConnected: boolean;
  currentUserId: string | null;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  fetchNotifications: (userId?: string) => Promise<void>;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const connectSocket = (userId: string) => {
    if (socket) {
      socket.disconnect();
    }

    // Set current user ID
    setCurrentUserId(userId);

    const baseURL = apiService.api.defaults.baseURL || 'http://localhost:3000';
    const newSocket = io(`${baseURL}/notifications`, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-user-room', { userId });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('notification', (notification: Notification) => {
      addNotification(notification);
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const fetchNotifications = async (userId?: string) => {
    try {
      const targetUserId = userId || currentUserId;
      if (!targetUserId) {
        console.warn('No user ID available for fetching notifications');
        return;
      }
      const data = await apiService.get(`/api/v1/notifications/user/${targetUserId}?limit=50&offset=0`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id: number, userId?: string) => {
    try {
      const targetUserId = userId || currentUserId;
      if (!targetUserId) {
        console.warn('No user ID available for marking notification as read');
        return;
      }
      await apiService.put(`/api/v1/notifications/${id}/read?userId=${targetUserId}`);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (userId?: string) => {
    try {
      const targetUserId = userId || currentUserId;
      if (!targetUserId) {
        console.warn('No user ID available for marking all notifications as read');
        return;
      }
      await apiService.put(`/api/v1/notifications/user/${targetUserId}/read-all`);
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: number, userId?: string) => {
    try {
      const targetUserId = userId || currentUserId;
      if (!targetUserId) {
        console.warn('No user ID available for deleting notification');
        return;
      }
      await apiService.delete(`/api/v1/notifications/${id}?userId=${targetUserId}`);
      setNotifications(prev => {
        const notification = prev.find(n => n.id === id);
        const newNotifications = prev.filter(n => n.id !== id);
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return newNotifications;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Remove automatic fetch - let components control when to fetch
  // useEffect(() => {
  //   fetchNotifications();
  // }, []);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    socket,
    isConnected,
    currentUserId,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    connectSocket,
    disconnectSocket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
