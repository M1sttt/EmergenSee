export type ShelterCategory = 'missile' | 'nbc' | 'assembly' | 'flood' | 'general';

/** Polygon ring as [latitude, longitude] pairs — matches Leaflet's LatLng tuple order. */
export type ShelterPolygon = [number, number][];

export interface DepartmentShelter {
  id: string;
  name: string;
  description?: string;
  category: ShelterCategory;
  capacity?: number;
  departmentId: string;
  polygon: ShelterPolygon;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentShelterDto {
  name: string;
  description?: string;
  category: ShelterCategory;
  capacity?: number;
  departmentId: string;
  polygon: ShelterPolygon;
}

export interface UpdateDepartmentShelterDto {
  name?: string;
  description?: string;
  category?: ShelterCategory;
  capacity?: number;
  polygon?: ShelterPolygon;
}
