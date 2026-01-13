export enum EventType {
  FIRE = 'fire',
  MEDICAL = 'medical',
  ACCIDENT = 'accident',
  CRIME = 'crime',
  NATURAL_DISASTER = 'natural_disaster',
  HAZMAT = 'hazmat',
  OTHER = 'other',
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EventStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
}

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Event {
  id: string;
  type: EventType;
  priority: EventPriority;
  status: EventStatus;
  title: string;
  description: string;
  location: Location;
  address: string;
  reportedBy?: string;
  assignedTo?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface CreateEventDto {
  type: EventType;
  priority: EventPriority;
  title: string;
  description: string;
  location: Location;
  address: string;
  reportedBy?: string;
}

export interface UpdateEventDto {
  type?: EventType;
  priority?: EventPriority;
  status?: EventStatus;
  title?: string;
  description?: string;
  location?: Location;
  address?: string;
  assignedTo?: string[];
  resolvedAt?: Date;
}
