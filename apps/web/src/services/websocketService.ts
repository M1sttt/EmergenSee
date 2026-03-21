import { io, Socket } from 'socket.io-client';
import {
	ErrorPayload,
	EventCreatedPayload,
	EventDeletedPayload,
	EventUpdatedPayload,
	StatusUpdatedPayload,
	UserJoinedPayload,
	UserLeftPayload,
	WebSocketEvent,
	WebSocketEventType,
} from '@emergensee/shared';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

interface WebSocketPayloadMap {
	[WebSocketEventType.EVENT_CREATED]: EventCreatedPayload;
	[WebSocketEventType.EVENT_UPDATED]: EventUpdatedPayload;
	[WebSocketEventType.EVENT_DELETED]: EventDeletedPayload;
	[WebSocketEventType.STATUS_UPDATED]: StatusUpdatedPayload;
	[WebSocketEventType.USER_JOINED]: UserJoinedPayload;
	[WebSocketEventType.USER_LEFT]: UserLeftPayload;
	[WebSocketEventType.CONNECTED]: Record<string, never>;
	[WebSocketEventType.DISCONNECTED]: Record<string, never>;
	[WebSocketEventType.ERROR]: ErrorPayload;
}

export type WebSocketPayload<TEventType extends WebSocketEventType> =
	WebSocketPayloadMap[TEventType];

class WebSocketService {
	private socket: Socket | null = null;
	private listeners: Map<WebSocketEventType, Set<(data: unknown) => void>> = new Map();

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

		Object.values(WebSocketEventType).forEach(eventType => {
			this.socket?.on(eventType, (event: WebSocketEvent<unknown>) => {
				const listeners = this.listeners.get(eventType);
				if (listeners) {
					listeners.forEach(listener => listener(event.payload));
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

	on<TEventType extends WebSocketEventType>(
		eventType: TEventType,
		callback: (data: WebSocketPayload<TEventType>) => void,
	) {
		if (!this.listeners.has(eventType)) {
			this.listeners.set(eventType, new Set());
		}
		this.listeners.get(eventType)?.add(callback as (data: unknown) => void);
	}

	off<TEventType extends WebSocketEventType>(
		eventType: TEventType,
		callback: (data: WebSocketPayload<TEventType>) => void,
	) {
		this.listeners.get(eventType)?.delete(callback as (data: unknown) => void);
	}

	emit<TPayload>(eventType: string, data: TPayload) {
		this.socket?.emit(eventType, data);
	}
}

export const websocketService = new WebSocketService();
