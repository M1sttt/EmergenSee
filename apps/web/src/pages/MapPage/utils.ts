import { Icon } from 'leaflet';
import { MARKER_ICON_CONFIG } from './consts';

export const createDefaultIcon = () => new Icon(MARKER_ICON_CONFIG);

export const getLatLng = (event: { location: { coordinates: number[] } }): [number, number] => {
	return [event.location.coordinates[1], event.location.coordinates[0]];
};
