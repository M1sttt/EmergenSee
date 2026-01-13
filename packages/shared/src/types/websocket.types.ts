import { Event } from './event.types';
import { StatusUpdate } from './status.types';

export enum WebSocketEventType {
  // Event updates
  EVENT_CREATED = 'event:created',
  EVENT_UPDATED = 'event:updated',
  EVENT_DELETED = 'event:deleted',

  // Status updates
  STATUS_UPDATED = 'status:updated',

  // User updates
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',

  // System
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: Date;
}

export interface EventCreatedPayload {
  event: Event;
}

export interface EventUpdatedPayload {
  event: Event;
}

export interface EventDeletedPayload {
  eventId: string;
}

export interface StatusUpdatedPayload {
  statusUpdate: StatusUpdate;
  userId: string;
}

export interface UserJoinedPayload {
  userId: string;
  userName: string;
}

export interface UserLeftPayload {
  userId: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
