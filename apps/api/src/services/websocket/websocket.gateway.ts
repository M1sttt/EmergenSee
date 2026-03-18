import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketEventType } from '@emergensee/shared';

@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    client.emit(WebSocketEventType.CONNECTED, {
      type: WebSocketEventType.CONNECTED,
      payload: { message: 'Connected to EmergenSee' },
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: new Date() });
  }

  emitEventCreated(event: any) {
    this.server.emit(WebSocketEventType.EVENT_CREATED, {
      type: WebSocketEventType.EVENT_CREATED,
      payload: { event },
      timestamp: new Date(),
    });
  }

  emitEventUpdated(event: any) {
    this.server.emit(WebSocketEventType.EVENT_UPDATED, {
      type: WebSocketEventType.EVENT_UPDATED,
      payload: { event },
      timestamp: new Date(),
    });
  }

  emitEventDeleted(eventId: string) {
    this.server.emit(WebSocketEventType.EVENT_DELETED, {
      type: WebSocketEventType.EVENT_DELETED,
      payload: { eventId },
      timestamp: new Date(),
    });
  }

  emitStatusUpdated(statusUpdate: any, userId: string) {
    this.server.emit(WebSocketEventType.STATUS_UPDATED, {
      type: WebSocketEventType.STATUS_UPDATED,
      payload: { statusUpdate, userId },
      timestamp: new Date(),
    });
  }
}
