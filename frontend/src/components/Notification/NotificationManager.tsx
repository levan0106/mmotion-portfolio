import React, { useEffect, useState, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationToast } from './NotificationToast';
import { Notification } from '../../contexts/NotificationContext';

interface NotificationManagerProps {
  userId: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ userId }) => {
  const { connectSocket, disconnectSocket, notifications, fetchNotifications } = useNotifications();
  const [currentToast, setCurrentToast] = useState<Notification | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const hasInitialized = useRef(false);
  const shownNotifications = useRef<Set<number>>(new Set()); // Track shown notifications
  const notificationQueue = useRef<Notification[]>([]); // Queue for pending notifications
  const lastNotificationTime = useRef<number>(0); // Prevent spam

  useEffect(() => {
    // Only initialize once per userId
    if (!hasInitialized.current) {
      console.log(`Initializing notifications for user ${userId}`);
      // Clear previous user's shown notifications
      shownNotifications.current.clear();
      notificationQueue.current = [];
      // Connect to notification socket when component mounts
      connectSocket(userId);
      // Fetch existing notifications
      fetchNotifications(userId);
      hasInitialized.current = true;
    }

    return () => {
      // Disconnect when component unmounts
      disconnectSocket();
      hasInitialized.current = false;
    };
  }, [userId]); // Only depend on userId

  useEffect(() => {
    // Only show toast for real-time notifications (not existing ones when page loads)
    // We'll track this by checking if the notification was added recently
    const now = Date.now();
    const RECENT_THRESHOLD = 5000; // 5 seconds - only show toast for notifications created in last 5 seconds
    
    const newRealTimeNotifications = notifications.filter(n => {
      const notificationTime = new Date(n.createdAt).getTime();
      const isRecent = (now - notificationTime) < RECENT_THRESHOLD;
      const isUnread = !n.isRead;
      const notShown = !shownNotifications.current.has(n.id);
      
      return isRecent && isUnread && notShown;
    });
    
    newRealTimeNotifications.forEach(notification => {
      if (!notificationQueue.current.find(n => n.id === notification.id)) {
        notificationQueue.current.push(notification);
        shownNotifications.current.add(notification.id);
      }
    });
    
    // Show next notification in queue if none is currently showing
    if (notificationQueue.current.length > 0 && !toastOpen) {
      // Prevent showing notifications too frequently (min 2 seconds apart)
      if (now - lastNotificationTime.current > 2000) {
        const nextNotification = notificationQueue.current.shift()!;
        setCurrentToast(nextNotification);
        setToastOpen(true);
        lastNotificationTime.current = now;
        console.log(`Showing toast for notification: ${nextNotification.title}`);
      }
    }
  }, [notifications, toastOpen]);

  const handleToastClose = () => {
    setToastOpen(false);
    // Don't clear currentToast immediately to prevent flickering
    setTimeout(() => {
      setCurrentToast(null);
      // Show next notification in queue if any
      if (notificationQueue.current.length > 0) {
        const nextNotification = notificationQueue.current.shift()!;
        setTimeout(() => {
          setCurrentToast(nextNotification);
          setToastOpen(true);
          console.log(`Showing next toast for notification: ${nextNotification.title}`);
        }, 100); // Small delay between toasts
      }
    }, 300); // Wait for animation to complete
  };

  const handleToastAction = () => {
    if (currentToast?.actionUrl) {
      // Navigate to action URL
      window.location.href = currentToast.actionUrl;
    }
    handleToastClose();
  };

  return (
    <>
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          open={toastOpen}
          onClose={handleToastClose}
          onAction={handleToastAction}
        />
      )}
    </>
  );
};
