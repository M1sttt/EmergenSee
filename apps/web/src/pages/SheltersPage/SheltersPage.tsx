import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiNavigation } from 'react-icons/fi';
import { toast } from 'sonner';

import * as consts from './consts';
import * as strings from './strings';
import {
	fetchShelters,
	findNearestShelter,
	haversineDistanceKm,
	formatDistance,
	getGoogleMapsDirectionsUrl,
	type ShelterMarker,
} from './utils';

// ── Icons ──────────────────────────────────────────────────────────────────

const shelterIcon = L.divIcon({
	className: '',
	html: '<div style="width:12px;height:12px;background:#22c55e;border:2px solid #15803d;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.35)"></div>',
	iconSize: [12, 12],
	iconAnchor: [6, 6],
	popupAnchor: [0, -8],
});

const nearestIcon = L.divIcon({
	className: '',
	html: `<div style="width:22px;height:22px;background:#f97316;border:3px solid #c2410c;border-radius:50%;box-shadow:0 2px 8px rgba(249,115,22,0.6)"></div>`,
	iconSize: [22, 22],
	iconAnchor: [11, 11],
	popupAnchor: [0, -14],
});

const userIcon = L.divIcon({
	className: '',
	html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 5px rgba(59,130,246,0.25),0 2px 6px rgba(0,0,0,0.3)"></div>`,
	iconSize: [18, 18],
	iconAnchor: [9, 9],
	popupAnchor: [0, -12],
});

// ── FlyTo helper (must live inside MapContainer) ────────────────────────────

function FlyTo({ latlng, zoom }: { latlng: [number, number]; zoom: number }) {
	const map = useMap();
	useEffect(() => {
		map.flyTo(latlng, zoom, { duration: 1.4 });
	}, [latlng, zoom, map]);
	return null;
}

// ── Popup content ───────────────────────────────────────────────────────────

function ShelterPopup({
	shelter,
	distanceLabel,
	userLocation,
}: {
	shelter: ShelterMarker;
	distanceLabel?: string;
	userLocation?: [number, number] | null;
}) {
	const directionsUrl = getGoogleMapsDirectionsUrl(shelter.latlng, userLocation ?? undefined);
	return (
		<div style={{ minWidth: 190 }}>
			<p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>{shelter.name}</p>
			{shelter.address ? (
				<p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>{shelter.address}</p>
			) : (
				<p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>{strings.noAddress}</p>
			)}
			{distanceLabel && (
				<p style={{ fontSize: 12, color: '#f97316', fontWeight: 600, margin: '0 0 6px' }}>
					{strings.distanceAway(distanceLabel)}
				</p>
			)}
			<a
				href={directionsUrl}
				target="_blank"
				rel="noopener noreferrer"
				style={{
					display: 'inline-block',
					marginTop: 4,
					fontSize: 12,
					color: '#1d4ed8',
					fontWeight: 600,
					textDecoration: 'none',
				}}
			>
				🗺 {strings.getDirections}
			</a>
		</div>
	);
}

// ── Main page ───────────────────────────────────────────────────────────────

const SheltersPage = () => {
	const { data: shelters = [], isLoading, isError } = useQuery({
		queryKey: ['shelters-israel'],
		queryFn: fetchShelters,
		staleTime: consts.sheltersCacheMs,
		retry: 2,
	});

	const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
	const [isLocating, setIsLocating] = useState(false);
	const [flyTarget, setFlyTarget] = useState<{ latlng: [number, number]; zoom: number } | null>(null);

	const nearest = useMemo(
		() => (userLocation ? findNearestShelter(userLocation, shelters) : null),
		[userLocation, shelters],
	);

	const nearestDistance = useMemo(
		() => (nearest && userLocation ? formatDistance(haversineDistanceKm(userLocation, nearest.latlng)) : null),
		[nearest, userLocation],
	);

	const handleFindNearest = useCallback(() => {
		if (!shelters.length) {
			toast.warning(strings.noSheltersLoaded);
			return;
		}
		if (!navigator.geolocation) {
			toast.error(strings.locationUnavailable);
			return;
		}
		setIsLocating(true);
		navigator.geolocation.getCurrentPosition(
			pos => {
				const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
				setUserLocation(latlng);
				setIsLocating(false);
				// fly-to is set after nearest is computed via useEffect below
			},
			err => {
				setIsLocating(false);
				if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
					toast.error(strings.locationDenied);
				} else {
					toast.error(strings.locationUnavailable);
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	}, [shelters]);

	// Once nearest is computed, fly the map to it
	useEffect(() => {
		if (nearest) {
			setFlyTarget({ latlng: nearest.latlng, zoom: 16 });
		}
	}, [nearest]);

	return (
		<div className="flex h-full flex-col">
			{/* ── Header ── */}
			<div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
				<div>
					<h1 className="text-xl font-bold text-gray-900">{strings.pageTitle}</h1>
					<p className="text-sm text-gray-500">{strings.pageSubtitle}</p>
				</div>

				<div className="flex items-center gap-3">
					{!isLoading && !isError && (
						<span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
							{strings.shelterCount(shelters.length)}
						</span>
					)}
					<button
						onClick={handleFindNearest}
						disabled={isLocating || isLoading}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
					>
						<FiNavigation size={15} />
						{isLocating ? strings.locating : strings.findNearest}
					</button>
				</div>
			</div>

			{/* ── Nearest shelter banner ── */}
			{nearest && nearestDistance && (
				<div className="flex items-center gap-4 border-b bg-orange-50 px-6 py-3">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
						1
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-semibold text-gray-900">{nearest.name}</p>
						{nearest.address && (
							<p className="text-xs text-gray-500">{nearest.address}</p>
						)}
					</div>
					<span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
						{strings.distanceAway(nearestDistance)}
					</span>
					<a
						href={getGoogleMapsDirectionsUrl(nearest.latlng, userLocation ?? undefined)}
						target="_blank"
						rel="noopener noreferrer"
						className="shrink-0 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
					>
						🗺 {strings.getDirections}
					</a>
				</div>
			)}

			{/* ── Map ── */}
			<div className="relative flex-1">
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
						<div className="flex flex-col items-center gap-2">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
							<span className="text-sm text-gray-500">{strings.loading}</span>
						</div>
					</div>
				)}
				{isError && (
					<div className="flex h-full items-center justify-center text-red-500">{strings.error}</div>
				)}

				<MapContainer
					center={consts.israelCenter}
					zoom={consts.israelZoom}
					style={{ height: '100%', width: '100%' }}
				>
					<TileLayer attribution={strings.attribution} url={consts.tileUrl} />

					{/* Fly to nearest when it's found */}
					{flyTarget && <FlyTo latlng={flyTarget.latlng} zoom={flyTarget.zoom} />}

					{/* All shelters */}
					{shelters.map(shelter => {
						const isNearest = nearest?.id === shelter.id;
						return (
							<Marker
								key={shelter.id}
								position={shelter.latlng}
								icon={isNearest ? nearestIcon : shelterIcon}
								zIndexOffset={isNearest ? 1000 : 0}
							>
								<Popup>
									<ShelterPopup
										shelter={shelter}
										distanceLabel={isNearest && nearestDistance ? nearestDistance : undefined}
										userLocation={userLocation}
									/>
								</Popup>
							</Marker>
						);
					})}

					{/* User location */}
					{userLocation && (
						<Marker position={userLocation} icon={userIcon}>
							<Popup>
								<p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Your location</p>
							</Popup>
						</Marker>
					)}
				</MapContainer>
			</div>
		</div>
	);
};

export default SheltersPage;
