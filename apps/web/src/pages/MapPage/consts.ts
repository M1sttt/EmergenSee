import { IconOptions } from 'leaflet';

export const defaultCenter = [40.7128, -74.006] as [number, number];
export const defaultZoom = 13;
export const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const markerIconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
export const markerIconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
export const markerShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
export const markerIconSize: IconOptions['iconSize'] = [25, 41];
export const markerIconAnchor: IconOptions['iconAnchor'] = [12, 41];
