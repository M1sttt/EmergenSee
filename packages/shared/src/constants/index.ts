export const JWT_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const PAGINATION_MAX_LIMIT = 100;

export const WEBSOCKET_EVENTS = {
  EVENT_CREATED: 'event:created',
  EVENT_UPDATED: 'event:updated',
  EVENT_DELETED: 'event:deleted',
  STATUS_UPDATED: 'status:updated',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

export const EVENT_TYPE_LABELS = {
  fire: 'Fire',
  medical: 'Medical',
  accident: 'Accident',
  crime: 'Crime',
  natural_disaster: 'Natural Disaster',
  hazmat: 'Hazmat',
  other: 'Other',
} as const;

export const EVENT_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
} as const;

export const EVENT_STATUS_LABELS = {
  pending: 'Pending',
  dispatched: 'Dispatched',
  en_route: 'En Route',
  on_scene: 'On Scene',
  resolved: 'Resolved',
  cancelled: 'Cancelled',
} as const;

export const USER_ROLE_LABELS = {
  admin: 'Admin',
  viewer: 'Viewer',
  member: 'Member',
} as const;

export const RESPONDER_STATUS_LABELS = {
  available: 'Available',
  busy: 'Busy',
  en_route: 'En Route',
  on_scene: 'On Scene',
  off_duty: 'Off Duty',
} as const;
