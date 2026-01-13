export enum ResponderStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  OFF_DUTY = 'off_duty',
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
  eventId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStatusUpdateDto {
  status: ResponderStatus;
  location?: ResponderLocation;
  eventId?: string;
  notes?: string;
}

export interface UpdateStatusUpdateDto {
  status?: ResponderStatus;
  location?: ResponderLocation;
  eventId?: string;
  notes?: string;
}
