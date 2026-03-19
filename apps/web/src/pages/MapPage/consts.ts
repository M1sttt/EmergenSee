import { IconOptions } from 'leaflet';

export const MAP_CLASSES = {
	CONTAINER: 'h-full',
	LOADING_CONTAINER: 'h-full flex items-center justify-center',
	ERROR_CONTAINER: 'h-full flex items-center justify-center text-red-500',
	POPUP_CONTAINER: 'p-2',
	POPUP_TITLE: 'font-bold text-lg mb-2',
	POPUP_DETAILS: 'space-y-1 text-sm',
	POPUP_DESCRIPTION: 'mt-2',
} as const;

export const MAP_CONFIG = {
	DEFAULT_CENTER: [40.7128, -74.006] as [number, number],
	DEFAULT_ZOOM: 13,
	TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
} as const;

export const MARKER_ICON_CONFIG: IconOptions = {
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
};
