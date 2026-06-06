export const israelCenter = [31.7683, 35.2137] as [number, number];
export const israelZoom = 8;
export const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const overpassUrl = 'https://overpass-api.de/api/interpreter';
export const sheltersCacheMs = 24 * 60 * 60 * 1000; // 24 hours

// Israel bounding box: south, west, north, east
const israelBbox = '29.45,34.27,33.35,35.90';

export const overpassQuery = `[out:json][timeout:30];
(
  node["amenity"="shelter"](${israelBbox});
  way["amenity"="shelter"](${israelBbox});
  node["shelter_type"="bomb_shelter"](${israelBbox});
  way["shelter_type"="bomb_shelter"](${israelBbox});
);
out center;`;
