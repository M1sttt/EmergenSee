import * as consts from './consts';

export interface ShelterElement {
	type: 'node' | 'way' | 'relation';
	id: number;
	lat?: number;
	lon?: number;
	center?: { lat: number; lon: number };
	tags?: {
		name?: string;
		'name:he'?: string;
		'addr:street'?: string;
		'addr:city'?: string;
		'addr:housenumber'?: string;
	};
}

export interface ShelterMarker {
	id: number;
	latlng: [number, number];
	name: string;
	address: string;
}

export const getShelterLatLng = (el: ShelterElement): [number, number] => {
	if (el.lat !== undefined && el.lon !== undefined) return [el.lat, el.lon];
	return [el.center!.lat, el.center!.lon];
};

export const getShelterName = (el: ShelterElement): string =>
	el.tags?.['name:he'] || el.tags?.name || `מקלט / Shelter`;

export const getShelterAddress = (el: ShelterElement): string => {
	const parts = [
		el.tags?.['addr:street'],
		el.tags?.['addr:housenumber'],
		el.tags?.['addr:city'],
	].filter(Boolean);
	return parts.join(' ');
};

export const fetchShelters = async (): Promise<ShelterMarker[]> => {
	const body = `data=${encodeURIComponent(consts.overpassQuery)}`;
	const resp = await fetch(consts.overpassUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});
	if (!resp.ok) throw new Error(`Overpass error: ${resp.status}`);
	const data: { elements: ShelterElement[] } = await resp.json();

	// Deduplicate by id and filter only elements with usable coordinates
	const seen = new Set<number>();
	const markers: ShelterMarker[] = [];
	for (const el of data.elements) {
		if (seen.has(el.id)) continue;
		if (el.lat === undefined && !el.center) continue;
		seen.add(el.id);
		markers.push({
			id: el.id,
			latlng: getShelterLatLng(el),
			name: getShelterName(el),
			address: getShelterAddress(el),
		});
	}
	return markers;
};
