export const pageTitle = 'Shelters Map';
export const pageSubtitle = 'מקלטים בישראל · Public shelters in Israel';
export const loading = 'Loading shelters from OpenStreetMap...';
export const error = 'Failed to load shelter data. Please try again later.';
export const shelterCount = (n: number) => `${n.toLocaleString()} shelters found`;
export const attribution =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const noAddress = 'No address on record';
export const findNearest = 'Find Nearest Shelter';
export const locating = 'Locating…';
export const nearestShelterLabel = 'Nearest Shelter';
export const distanceAway = (d: string) => `${d} away`;
export const locationDenied = 'Location access was denied. Please allow it in your browser settings.';
export const locationUnavailable = 'Could not determine your location. Try again.';
export const noSheltersLoaded = 'Shelters are still loading — try again in a moment.';
export const getDirections = 'Open Route in Google Maps';
export const fetchingAddress = 'Looking up address…';
export const addressUnavailable = 'No address on record';
