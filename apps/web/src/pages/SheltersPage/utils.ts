import * as consts from './consts';
import type { ShelterCategory } from './consts';

export type { ShelterCategory };

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
		emergency?: string;
		building?: string;
		man_made?: string;
		amenity?: string;
		flood_prone?: string;
		tsunami?: string;
		natural?: string;
	};
}

export interface ShelterMarker {
	id: number;
	latlng: [number, number];
	name: string;
	address: string;
	category: ShelterCategory;
}

// ── Categorisation ───────────────────────────────────────────────────────────

export const categorize = (el: ShelterElement): ShelterCategory => {
	const t = el.tags ?? {};

	// Hardened bunkers → NBC threat category
	if (
		t.building === 'bunker' ||
		t.man_made === 'bunker' ||
		t.shelter_type === 'nuclear' ||
		t.shelter_type === 'fallout'
	) return 'nbc';

	// Emergency assembly / muster points
	if (
		t.emergency === 'assembly_point' ||
		t.emergency === 'evacuee_assembly_point' ||
		t.emergency === 'muster_point'
	) return 'assembly';

	// Flood / tsunami refuges
	if (
		t.shelter_type === 'flood' ||
		t.flood_prone === 'shelter' ||
		t.tsunami === 'assembly_point'
	) return 'flood';

	// Explicit bomb / missile shelters
	if (t.shelter_type === 'bomb_shelter') return 'missile';

	// Plain amenity=shelter — general public shelter
	return 'general';
};

// ── Coordinate helpers ───────────────────────────────────────────────────────

export const getShelterLatLng = (el: ShelterElement): [number, number] => {
	if (el.lat !== undefined && el.lon !== undefined) return [el.lat, el.lon];
	return [el.center!.lat, el.center!.lon];
};

export const getShelterName = (el: ShelterElement): string =>
	el.tags?.['name:he'] || el.tags?.name || '';

export const getShelterAddress = (el: ShelterElement): string => {
	const parts = [
		el.tags?.['addr:street'],
		el.tags?.['addr:housenumber'],
		el.tags?.['addr:neighbourhood'],
		el.tags?.['addr:city'],
	].filter(Boolean) as string[];
	return parts.join(' ');
};

// ── Fetch ────────────────────────────────────────────────────────────────────

export const fetchShelters = async (): Promise<ShelterMarker[]> => {
	const body = `data=${encodeURIComponent(consts.overpassQuery)}`;
	const resp = await fetch(consts.overpassUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});
	if (!resp.ok) throw new Error(`Overpass error: ${resp.status}`);
	const data: { elements: ShelterElement[] } = await resp.json();

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
			category: categorize(el),
		});
	}
	return markers;
};

// ── Distance ─────────────────────────────────────────────────────────────────

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

// ── Geocoding ────────────────────────────────────────────────────────────────

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

// ── Google Maps ───────────────────────────────────────────────────────────────

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
