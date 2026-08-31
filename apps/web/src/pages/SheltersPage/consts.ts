export const israelCenter = [31.7683, 35.2137] as [number, number];
export const israelZoom = 8;
export const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const overpassUrl = 'https://overpass-api.de/api/interpreter';
export const sheltersCacheMs = 24 * 60 * 60 * 1000; // 24 hours

// Israel bounding box: south, west, north, east
const bbox = '29.45,34.27,33.35,35.90';

// Expanded query that fetches every relevant shelter/refuge type in Israel
export const overpassQuery = `[out:json][timeout:30];
(
  node["amenity"="shelter"](${bbox});
  way["amenity"="shelter"](${bbox});
  node["shelter_type"="bomb_shelter"](${bbox});
  way["shelter_type"="bomb_shelter"](${bbox});
  node["emergency"="assembly_point"](${bbox});
  way["emergency"="assembly_point"](${bbox});
  node["emergency"="evacuee_assembly_point"](${bbox});
  way["emergency"="evacuee_assembly_point"](${bbox});
  node["building"="bunker"](${bbox});
  way["building"="bunker"](${bbox});
  node["man_made"="bunker"](${bbox});
  way["man_made"="bunker"](${bbox});
  node["amenity"="shelter"]["shelter_type"="flood"](${bbox});
  way["amenity"="shelter"]["shelter_type"="flood"](${bbox});
  node["flood_prone"="shelter"](${bbox});
  node["tsunami"="assembly_point"](${bbox});
);
out center;`;

// Visual config per category
export type ShelterCategory = 'missile' | 'nbc' | 'assembly' | 'flood' | 'general';

export interface CategoryConfig {
	label: string;
	threats: string;       // what it protects against
	color: string;
	borderColor: string;
	glowColor: string;
	emoji: string;
	markerSize: number;
}

export const CATEGORY_CONFIG: Record<ShelterCategory, CategoryConfig> = {
	missile: {
		label: 'Missile / Bomb',
		threats: 'Rockets, explosions, missiles',
		color: '#16a34a',
		borderColor: '#fff',
		glowColor: 'rgba(22,163,74,0.35)',
		emoji: '💣',
		markerSize: 12,
	},
	nbc: {
		label: 'NBC / Bunker',
		threats: 'Nuclear, biological, chemical',
		color: '#7c3aed',
		borderColor: '#fff',
		glowColor: 'rgba(124,58,237,0.35)',
		emoji: '☢️',
		markerSize: 14,
	},
	assembly: {
		label: 'Assembly Point',
		threats: 'Any emergency — gather here',
		color: '#2563eb',
		borderColor: '#fff',
		glowColor: 'rgba(37,99,235,0.3)',
		emoji: '🚨',
		markerSize: 13,
	},
	flood: {
		label: 'Flood / Tsunami',
		threats: 'Flooding, tsunamis, storms',
		color: '#0891b2',
		borderColor: '#fff',
		glowColor: 'rgba(8,145,178,0.3)',
		emoji: '🌊',
		markerSize: 12,
	},
	general: {
		label: 'General Shelter',
		threats: 'Public emergencies, storms',
		color: '#d97706',
		borderColor: '#fff',
		glowColor: 'rgba(217,119,6,0.3)',
		emoji: '🛡',
		markerSize: 11,
	},
};

export const ALL_CATEGORIES: ShelterCategory[] = ['missile', 'nbc', 'assembly', 'flood', 'general'];

export const minPolygonPoints = 3;
export const departmentShelterColor = '#4f46e5';
