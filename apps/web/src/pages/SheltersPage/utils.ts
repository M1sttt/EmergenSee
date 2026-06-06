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
		'addr:neighbourhood'?: string;
		shelter_type?: string;
	};
}

export interface ShelterMarker {
	id: number;
	latlng: [number, number];
	name: string;
	address: string;
}

// Haversine formula — returns distance in km between two [lat, lon] points
export const haversineDistanceKm = (a: [number, number], b: [number, number]): number => {
	const R = 6371;
	const dLat = ((b[0] - a[0]) * Math.PI) / 180;
	const dLon = ((b[1] - a[1]) * Math.PI) / 180;
	const lat1 = (a[0] * Math.PI) / 180;
	const lat2 = (b[0] * Math.PI) / 180;
	const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export const findNearestShelter = (
	userLatlng: [number, number],
	shelters: ShelterMarker[],
): ShelterMarker | null => {
	if (!shelters.length) return null;
	return shelters.reduce((nearest, shelter) =>
		haversineDistanceKm(userLatlng, shelter.latlng) <
		haversineDistanceKm(userLatlng, nearest.latlng)
			? shelter
			: nearest,
	);
};

export const formatDistance = (km: number): string =>
	km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

// Nominatim reverse geocoding — called lazily when a popup opens for a
// shelter that has no address tags. Nominatim is free, no API key needed.
// Rate limit is 1 req/s; we only call on popup click so that's fine.
export const reverseGeocode = async (latlng: [number, number]): Promise<string | null> => {
	const [lat, lon] = latlng;
	try {
		const resp = await fetch(
			`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=he,en`,
			{ headers: { 'User-Agent': 'EmergenSee/1.0 (emergensee.cs.colman.ac.il)' } },
		);
		if (!resp.ok) return null;
		const data = await resp.json();
		if (data.error) return null;
		const a = data.address ?? {};
		const parts = [
			a.road ?? a.pedestrian ?? a.footway ?? a.path,
			a.house_number,
			a.neighbourhood ?? a.suburb,
			a.city ?? a.town ?? a.village ?? a.municipality,
		].filter(Boolean) as string[];
		return parts.length ? parts.join(', ') : (data.display_name ?? null);
	} catch {
		return null;
	}
};

export const getGoogleMapsDirectionsUrl = (
	destination: [number, number],
	origin?: [number, number],
): string => {
	const params = new URLSearchParams({
		api: '1',
		destination: `${destination[0]},${destination[1]}`,
		travelmode: 'walking',
	});
	if (origin) params.set('origin', `${origin[0]},${origin[1]}`);
	return `https://www.google.com/maps/dir/?${params.toString()}`;
};

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
