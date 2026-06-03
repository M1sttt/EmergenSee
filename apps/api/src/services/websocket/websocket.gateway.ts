import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Event, StatusUpdate, WebSocketEventType } from '@emergensee/shared';
import { EventDocument } from '../events/schemas/event.schema';
import { StatusUpdateDocument } from '../status/schemas/status.schema';
import { UsersService } from '../users/users.service';

type EventSocketPayload = Event | EventDocument;
type StatusSocketPayload = StatusUpdate | StatusUpdateDocument;

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

  constructor(private usersService: UsersService) {}
  // userId → { socketId, location } for active camera-role devices
  private activeCameraUsers = new Map<string, { socketId: string; location: string }>();
  // socketId → userId (reverse lookup for disconnect cleanup)
  private cameraSocketIndex = new Map<string, string>();

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

    const userId = this.cameraSocketIndex.get(client.id);
    if (userId) {
      this.activeCameraUsers.delete(userId);
      this.cameraSocketIndex.delete(client.id);
      this._broadcastCameraUsers();
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: new Date() });
  }

  @SubscribeMessage('user:identify')
  async handleUserIdentify(client: Socket, payload: { userId: string }): Promise<void> {
    try {
      const user = await this.usersService.findOne(payload.userId);
      for (const deptId of user.departments || []) {
        await client.join(`dept:${deptId.toString()}`);
      }
    } catch {
      // user not found — no rooms to join
    }
  }

  @SubscribeMessage('camera:join')
  handleCameraJoin(client: Socket, payload: { userId: string; location: string }): void {
    this.activeCameraUsers.set(payload.userId, { socketId: client.id, location: payload.location || '' });
    this.cameraSocketIndex.set(client.id, payload.userId);
    this._broadcastCameraUsers();
  }

  @SubscribeMessage('camera:leave')
  handleCameraLeave(client: Socket, payload: { userId: string }): void {
    this.activeCameraUsers.delete(payload.userId);
    this.cameraSocketIndex.delete(client.id);
    this._broadcastCameraUsers();
  }

  @SubscribeMessage('camera:frame')
  handleCameraFrame(_client: Socket, payload: { cameraUserId: string; frame: string }): void {
    this.server.to(`cam-admin:${payload.cameraUserId}`).emit('camera:frame', payload);
  }

  @SubscribeMessage('camera:recognize')
  handleCameraRecognize(_client: Socket, payload: { cameraUserId: string; results: unknown[] }): void {
    this.server.to(`cam-admin-recog:${payload.cameraUserId}`).emit('camera:recognize', payload);
  }

  @SubscribeMessage('admin:get-users')
  handleAdminGetUsers(client: Socket): void {
    client.emit('camera:users', this._getCameraUsersArray());
  }

  @SubscribeMessage('admin:watch-recog')
  handleAdminWatchRecog(client: Socket, payload: { cameraUserId: string }): void {
    client.join(`cam-admin-recog:${payload.cameraUserId}`);
  }

  @SubscribeMessage('admin:watch')
  handleAdminWatch(client: Socket, payload: { cameraUserId: string }): void {
    client.join(`cam-admin:${payload.cameraUserId}`);
    client.emit('camera:users', this._getCameraUsersArray());
  }

  @SubscribeMessage('admin:unwatch')
  handleAdminUnwatch(client: Socket, payload: { cameraUserId: string }): void {
    client.leave(`cam-admin:${payload.cameraUserId}`);
  }

  private _getCameraUsersArray() {
    return Array.from(this.activeCameraUsers.entries()).map(([userId, info]) => ({
      userId,
      location: info.location,
    }));
  }

  private _broadcastCameraUsers(): void {
    this.server.emit('camera:users', this._getCameraUsersArray());
  }

  emitEventCreated(event: EventSocketPayload) {
    this.server.emit(WebSocketEventType.EVENT_CREATED, {
      type: WebSocketEventType.EVENT_CREATED,
      payload: { event },
      timestamp: new Date(),
    });
  }

  emitEventUpdated(event: EventSocketPayload) {
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

  emitStatusUpdated(statusUpdate: StatusSocketPayload, userId: string) {
    this.server.emit(WebSocketEventType.STATUS_UPDATED, {
      type: WebSocketEventType.STATUS_UPDATED,
      payload: { statusUpdate, userId },
      timestamp: new Date(),
    });
  }

  emitDepartmentAlert(payload: { userId: string; userName: string; departmentIds: string[]; eventId: string }) {
    const message = {
      type: WebSocketEventType.DEPARTMENT_ALERT,
      payload,
      timestamp: new Date(),
    };
    for (const deptId of payload.departmentIds) {
      this.server.to(`dept:${deptId}`).emit(WebSocketEventType.DEPARTMENT_ALERT, message);
    }
  }
}
