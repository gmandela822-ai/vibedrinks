import { useState, useCallback, useEffect } from 'react';
import { useNotificationSound } from './use-notification-sound';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface UsePushNotificationsOptions {
  playSound?: boolean;
  soundRepeat?: number;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { playSound = true, soundRepeat = 3 } = options;
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { playMultiple, stopAll } = useNotificationSound({ volume: 0.8 });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, body?: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      return null;
    }

    if (Notification.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options,
      });

      if (playSound) {
        playMultiple(soundRepeat, 600);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
        stopAll();
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }, [playSound, soundRepeat, playMultiple, stopAll]);

  const notifyNewOrder = useCallback((orderId: string, customerName?: string) => {
    const title = 'Novo Pedido!';
    const body = customerName 
      ? `Pedido #${orderId.slice(-6)} de ${customerName}` 
      : `Novo pedido #${orderId.slice(-6)} recebido`;
    
    return showNotification(title, body, {
      tag: `order-${orderId}`,
    });
  }, [showNotification]);

  const notifyOrderStatusChange = useCallback((orderId: string, status: string) => {
    const title = 'Status do Pedido Atualizado';
    const body = `Pedido #${orderId.slice(-6)} - ${status}`;
    
    return showNotification(title, body, {
      tag: `order-status-${orderId}`,
    });
  }, [showNotification]);

  return {
    permission,
    isSupported: 'Notification' in window,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    showNotification,
    notifyNewOrder,
    notifyOrderStatusChange,
    stopSound: stopAll,
  };
}
