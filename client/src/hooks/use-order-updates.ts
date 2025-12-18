import { useEffect, useRef, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

type OrderEventHandler = (data: any) => void;

interface UseOrderUpdatesOptions {
  onOrderCreated?: OrderEventHandler;
  onOrderStatusChanged?: OrderEventHandler;
  onOrderAssigned?: OrderEventHandler;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useOrderUpdates(options: UseOrderUpdatesOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      const eventSource = new EventSource('/api/orders/sse');
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        reconnectAttempts.current = 0;
        optionsRef.current.onConnected?.();
      });

      eventSource.addEventListener('order_created', (event) => {
        const data = JSON.parse(event.data);
        queryClient.invalidateQueries({ predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/orders';
        }});
        optionsRef.current.onOrderCreated?.(data);
      });

      eventSource.addEventListener('order_status_changed', (event) => {
        const data = JSON.parse(event.data);
        queryClient.invalidateQueries({ predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/orders';
        }});
        optionsRef.current.onOrderStatusChanged?.(data);
      });

      eventSource.addEventListener('order_assigned', (event) => {
        const data = JSON.parse(event.data);
        queryClient.invalidateQueries({ predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === '/api/orders';
        }});
        optionsRef.current.onOrderAssigned?.(data);
      });

      eventSource.addEventListener('heartbeat', () => {
      });

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;
        optionsRef.current.onDisconnected?.();

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to connect to SSE:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
    disconnect,
  };
}
