import { useEffect } from 'react';
import { WebSocketEventType } from '@emergensee/shared';
import { WebSocketPayload, websocketService } from 'services/websocketService';

export function useWebSocket<TEventType extends WebSocketEventType>(
	eventType: TEventType,
	callback: (data: WebSocketPayload<TEventType>) => void,
) {
	useEffect(() => {
		websocketService.connect();
		websocketService.on(eventType, callback);

		return () => {
			websocketService.off(eventType, callback);
		};
	}, [eventType, callback]);
}
