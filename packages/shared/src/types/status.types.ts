export enum ResponderStatus {
  AWAY = 'away',
  NEED_HELP = 'need_help',
  SAFE = 'safe',
  UNKNOWN = 'unknown',
}

export interface ResponderLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface StatusUpdate {
  id: string;
  userId: string;
  status: ResponderStatus;
  location?: ResponderLocation;
  eventId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStatusUpdateDto {
  status: ResponderStatus;
  userId?: string;
  location?: ResponderLocation;
  eventId: string;
  notes?: string;
}

export interface UpdateStatusUpdateDto {
  status?: ResponderStatus;
  location?: ResponderLocation;
  eventId?: string;
  notes?: string;
}
