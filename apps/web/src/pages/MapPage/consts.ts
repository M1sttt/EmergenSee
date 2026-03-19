import { IconOptions } from 'leaflet';

export const containerClass = 'h-full';
export const loadingContainerClass = 'h-full flex items-center justify-center';
export const errorContainerClass = 'h-full flex items-center justify-center text-red-500';
export const popupContainerClass = 'p-2';
export const popupTitleClass = 'font-bold text-lg mb-2';
export const popupDetailsClass = 'space-y-1 text-sm';
export const popupDescriptionClass = 'mt-2';

export const defaultCenter = [40.7128, -74.006] as [number, number];
export const defaultZoom = 13;
export const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export const markerIconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
export const markerIconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
export const markerShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
export const markerIconSize: IconOptions['iconSize'] = [25, 41];
export const markerIconAnchor: IconOptions['iconAnchor'] = [12, 41];
