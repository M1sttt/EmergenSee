import { useEffect } from 'react';
import { WebSocketEventType } from '@emergensee/shared';
import { websocketService } from '../services/websocketService';

export function useWebSocket(
  eventType: WebSocketEventType,
  callback: (data: any) => void,
) {
  useEffect(() => {
    websocketService.connect();
    websocketService.on(eventType, callback);

    return () => {
      websocketService.off(eventType, callback);
    };
  }, [eventType, callback]);
}
