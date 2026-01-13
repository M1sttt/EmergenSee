import { io, Socket } from 'socket.io-client';
import { WebSocketEvent, WebSocketEventType } from '@emergensee/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Set up event listeners
    Object.values(WebSocketEventType).forEach((eventType) => {
      this.socket?.on(eventType, (event: WebSocketEvent) => {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
          listeners.forEach((listener) => listener(event.payload));
        }
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventType: WebSocketEventType, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
  }

  off(eventType: WebSocketEventType, callback: (data: any) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  emit(eventType: string, data: any) {
    this.socket?.emit(eventType, data);
  }
}

export const websocketService = new WebSocketService();
