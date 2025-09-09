'use client';

import { useState, useEffect } from 'react';
import { X, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationSystemProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

export function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  useEffect(() => {
    notifications.forEach(notification => {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" role="region" aria-live="polite" aria-label="Notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "max-w-sm w-full bg-card border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out transform",
            notification.type === 'success' && 'border-green-500',
            notification.type === 'error' && 'border-red-500',
            notification.type === 'warning' && 'border-yellow-500',
            notification.type === 'info' && 'border-blue-500'
          )}
          role="alert"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(notification.id)}
              className="w-6 h-6 p-0 ml-2"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook to manage notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Check initial permission state
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserNotificationsEnabled(permission === 'granted');
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  };

  const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
    if (browserNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(title, options);
      } catch (error) {
        console.error('Error sending browser notification:', error);
      }
    }
  };

  return {
    notifications,
    browserNotificationsEnabled,
    addNotification,
    removeNotification,
    clearAll,
    requestBrowserPermission,
    sendBrowserNotification,
  };
}
