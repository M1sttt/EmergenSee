import { Icon } from 'leaflet';
import * as consts from './consts';

export const createDefaultIcon = () =>
	new Icon({
		iconUrl: consts.markerIconUrl,
		iconRetinaUrl: consts.markerIconRetinaUrl,
		shadowUrl: consts.markerShadowUrl,
		iconSize: consts.markerIconSize,
		iconAnchor: consts.markerIconAnchor,
	});

export const getLatLng = (event: { location: { coordinates: number[] } }): [number, number] => {
	return [event.location.coordinates[1], event.location.coordinates[0]];
};
