import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiNavigation, FiMapPin, FiExternalLink, FiShield } from 'react-icons/fi';
import { MdMyLocation } from 'react-icons/md';
import { toast } from 'sonner';

import * as consts from './consts';
import * as strings from './strings';
import {
	fetchShelters,
	findNearestShelter,
	haversineDistanceKm,
	formatDistance,
	getGoogleMapsDirectionsUrl,
	reverseGeocode,
	type ShelterMarker,
} from './utils';

// ── Markers ─────────────────────────────────────────────────────────────────

const shelterIcon = L.divIcon({
	className: '',
	html: `<div style="
		width:11px;height:11px;
		background:#16a34a;
		border:2px solid #fff;
		border-radius:50%;
		box-shadow:0 1px 4px rgba(0,0,0,0.4)
	"></div>`,
	iconSize: [11, 11],
	iconAnchor: [5, 5],
	popupAnchor: [0, -7],
});

const nearestIcon = L.divIcon({
	className: '',
	html: `<div style="
		width:24px;height:24px;
		background:#f97316;
		border:3px solid #fff;
		border-radius:50%;
		box-shadow:0 0 0 3px rgba(249,115,22,0.35),0 3px 8px rgba(0,0,0,0.35)
	"></div>`,
	iconSize: [24, 24],
	iconAnchor: [12, 12],
	popupAnchor: [0, -14],
});

const userIcon = L.divIcon({
	className: '',
	html: `<div style="
		width:20px;height:20px;
		background:#2563eb;
		border:3px solid #fff;
		border-radius:50%;
		box-shadow:0 0 0 5px rgba(37,99,235,0.2),0 2px 6px rgba(0,0,0,0.3)
	"></div>`,
	iconSize: [20, 20],
	iconAnchor: [10, 10],
	popupAnchor: [0, -12],
});

// ── Map helpers ──────────────────────────────────────────────────────────────

function FlyTo({ latlng, zoom }: { latlng: [number, number]; zoom: number }) {
	const map = useMap();
	useEffect(() => {
		map.flyTo(latlng, zoom, { duration: 1.5 });
	}, [latlng, zoom, map]);
	return null;
}

// ── Popup ────────────────────────────────────────────────────────────────────

function ShelterPopup({
	shelter,
	distanceLabel,
	userLocation,
}: {
	shelter: ShelterMarker;
	distanceLabel?: string;
	userLocation?: [number, number] | null;
}) {
	// Lazy reverse-geocode only when OSM has no address for this shelter.
	// staleTime: Infinity → result is cached for the whole session, never re-fetched.
	const { data: geocodedAddress, isFetching } = useQuery({
		queryKey: ['geocode', shelter.id],
		queryFn: () => reverseGeocode(shelter.latlng),
		enabled: !shelter.address,
		staleTime: Infinity,
		retry: 1,
	});

	const address = shelter.address || geocodedAddress;
	const url = getGoogleMapsDirectionsUrl(shelter.latlng, userLocation ?? undefined);

	return (
		<div style={{ minWidth: 210, fontFamily: 'inherit' }}>
			{/* Name + badge */}
			<div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
				<div style={{
					width: 30, height: 30, borderRadius: '50%',
					background: distanceLabel ? '#fff7ed' : '#f0fdf4',
					border: `2px solid ${distanceLabel ? '#f97316' : '#16a34a'}`,
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					flexShrink: 0, marginTop: 1,
				}}>
					<span style={{ fontSize: 15 }}>{distanceLabel ? '🏆' : '🛡'}</span>
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#111827', lineHeight: 1.3 }}>
						{shelter.name}
					</p>
					{distanceLabel && (
						<span style={{
							display: 'inline-block', marginTop: 3,
							background: '#fff7ed', color: '#c2410c',
							fontWeight: 600, fontSize: 11, padding: '1px 7px',
							borderRadius: 99, border: '1px solid #fed7aa',
						}}>
							{strings.distanceAway(distanceLabel)}
						</span>
					)}
				</div>
			</div>

			{/* Address row */}
			<div style={{
				display: 'flex', alignItems: 'flex-start', gap: 6,
				marginBottom: 10, minHeight: 20,
			}}>
				<span style={{ fontSize: 13, marginTop: 1, flexShrink: 0 }}>📍</span>
				{isFetching ? (
					<span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
						{strings.fetchingAddress}
					</span>
				) : address ? (
					<p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.55 }}>
						{address}
					</p>
				) : (
					<p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>
						{strings.addressUnavailable}
					</p>
				)}
			</div>

			{/* Divider */}
			<div style={{ height: 1, background: '#e5e7eb', margin: '0 0 10px' }} />

			{/* Directions button */}
			<a
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				style={{
					display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
					padding: '8px 12px', borderRadius: 8,
					background: '#2563eb', color: '#fff',
					fontWeight: 600, fontSize: 12, textDecoration: 'none',
				}}
				onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
				onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
			>
				<span>🗺</span>
				{strings.getDirections}
			</a>
		</div>
	);
}

// ── Map legend (floating inside map container) ────────────────────────────────

function MapLegend({ hasUser, hasNearest }: { hasUser: boolean; hasNearest: boolean }) {
	return (
		<div style={{
			position: 'absolute', bottom: 32, right: 12, zIndex: 1000,
			background: 'rgba(255,255,255,0.96)',
			backdropFilter: 'blur(8px)',
			borderRadius: 12, padding: '10px 14px',
			boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
			fontSize: 12, color: '#374151',
			display: 'flex', flexDirection: 'column', gap: 6,
			border: '1px solid rgba(0,0,0,0.07)',
		}}>
			<p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
				Legend
			</p>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
				<div style={{ width: 11, height: 11, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', flexShrink: 0 }} />
				<span>Public shelter</span>
			</div>
			{hasNearest && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<div style={{ width: 14, height: 14, borderRadius: '50%', background: '#f97316', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(249,115,22,0.35)', flexShrink: 0 }} />
					<span style={{ fontWeight: 600, color: '#c2410c' }}>Nearest to you</span>
				</div>
			)}
			{hasUser && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<div style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(37,99,235,0.25)', flexShrink: 0 }} />
					<span style={{ color: '#1d4ed8' }}>Your location</span>
				</div>
			)}
		</div>
	);
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
		() => nearest && userLocation
			? formatDistance(haversineDistanceKm(userLocation, nearest.latlng))
			: null,
		[nearest, userLocation],
	);

	// Geocode the nearest shelter's address for the banner when OSM has none
	const { data: nearestGeocodedAddress, isFetching: isGeocodingNearest } = useQuery({
		queryKey: ['geocode', nearest?.id ?? 'none'],
		queryFn: () => reverseGeocode(nearest!.latlng),
		enabled: !!nearest && !nearest.address,
		staleTime: Infinity,
		retry: 1,
	});

	const nearestAddress = nearest
		? (nearest.address || nearestGeocodedAddress)
		: null;

	const requestLocation = useCallback(
		(onSuccess: (latlng: [number, number]) => void) => {
			if (!navigator.geolocation) { toast.error(strings.locationUnavailable); return; }
			setIsLocating(true);
			navigator.geolocation.getCurrentPosition(
				pos => {
					const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
					setUserLocation(latlng);
					setIsLocating(false);
					onSuccess(latlng);
				},
				err => {
					setIsLocating(false);
					toast.error(err.code === GeolocationPositionError.PERMISSION_DENIED
						? strings.locationDenied
						: strings.locationUnavailable);
				},
				{ enableHighAccuracy: true, timeout: 10000 },
			);
		},
		[],
	);

	const handleFindNearest = useCallback(() => {
		if (!shelters.length) { toast.warning(strings.noSheltersLoaded); return; }
		// location will cause nearest to recompute → useEffect flies to shelter
		if (userLocation) return; // already have it, useEffect already ran
		requestLocation(() => {}); // nearest effect handles the fly
	}, [shelters, userLocation, requestLocation]);

	// Center the map on the user's own position (not the nearest shelter)
	const handleCenterOnMe = useCallback(() => {
		if (userLocation) {
			setFlyTarget({ latlng: userLocation, zoom: 16 });
		} else {
			requestLocation(latlng => setFlyTarget({ latlng, zoom: 16 }));
		}
	}, [userLocation, requestLocation]);

	useEffect(() => {
		if (nearest) setFlyTarget({ latlng: nearest.latlng, zoom: 16 });
	}, [nearest]);

	return (
		<div className="flex h-full flex-col">

			{/* ── Header ─────────────────────────────────────────────────── */}
			<div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 px-6 py-5 shadow-lg">
				{/* Decorative background circles */}
				<div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
				<div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-white/5" />

				<div className="relative flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
							<FiShield className="text-2xl text-white" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h1 className="text-xl font-bold text-white">{strings.pageTitle}</h1>
								{!isLoading && !isError && shelters.length > 0 && (
									<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
										{shelters.length.toLocaleString()}
									</span>
								)}
							</div>
							<p className="mt-0.5 text-sm text-emerald-100">{strings.pageSubtitle}</p>
						</div>
					</div>

					<button
						onClick={handleFindNearest}
						disabled={isLocating || isLoading}
						className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-md transition-all hover:bg-emerald-50 hover:shadow-lg active:scale-95 disabled:opacity-60"
					>
						{isLocating
							? <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
							: <MdMyLocation className="text-lg" />
						}
						{isLocating ? strings.locating : strings.findNearest}
					</button>
				</div>
			</div>

			{/* ── Nearest shelter card ────────────────────────────────────── */}
			{nearest && nearestDistance && (
				<div className="border-b bg-white px-6 py-4 shadow-sm">
					<div className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
						{/* Icon */}
						<div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-orange-500 text-white shadow-md">
							<FiNavigation className="text-xl" />
						</div>

						{/* Info */}
						<div className="min-w-0 flex-1">
							<p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
								{strings.nearestShelterLabel}
							</p>
							<p className="mt-0.5 truncate text-base font-bold text-gray-900">{nearest.name}</p>
							<div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
								<FiMapPin className="shrink-0 text-gray-400" size={12} />
								{isGeocodingNearest ? (
									<span className="italic text-gray-400">{strings.fetchingAddress}</span>
								) : nearestAddress ? (
									<span className="truncate">{nearestAddress}</span>
								) : (
									<span className="italic text-gray-400">{strings.addressUnavailable}</span>
								)}
							</div>
						</div>

						{/* Distance */}
						<div className="shrink-0 text-right">
							<span className="block text-2xl font-bold text-orange-600">
								{nearestDistance.split(' ')[0]}
							</span>
							<span className="text-xs font-medium text-orange-400">
								{nearestDistance.split(' ')[1] ?? ''}
							</span>
						</div>

						{/* Directions button */}
						<a
							href={getGoogleMapsDirectionsUrl(nearest.latlng, userLocation ?? undefined)}
							target="_blank"
							rel="noopener noreferrer"
							className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
						>
							<FiExternalLink size={15} />
							<span className="hidden sm:inline">{strings.getDirections}</span>
							<span className="sm:hidden">Navigate</span>
						</a>
					</div>
				</div>
			)}

			{/* ── Map ─────────────────────────────────────────────────────── */}
			<div className="relative flex-1">

				{/* Floating "My Location" button — sits above Leaflet */}
				<button
					onClick={handleCenterOnMe}
					disabled={isLocating}
					title="Center map on my location"
					style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}
					className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-all hover:bg-blue-50 hover:ring-blue-400 active:scale-95 disabled:opacity-50"
				>
					{isLocating
						? <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
						: <MdMyLocation className={`text-xl ${userLocation ? 'text-blue-600' : 'text-gray-500'}`} />
					}
				</button>

				{/* Loading overlay */}
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
						<div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-xl">
							<div className="relative flex h-16 w-16 items-center justify-center">
								<div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20" />
								<div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
							</div>
							<div className="text-center">
								<p className="font-semibold text-gray-800">{strings.loading}</p>
								<p className="mt-1 text-sm text-gray-500">This may take a few seconds</p>
							</div>
						</div>
					</div>
				)}

				{/* Error state */}
				{isError && (
					<div className="flex h-full items-center justify-center bg-red-50">
						<div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
							<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
								<span className="text-2xl">⚠️</span>
							</div>
							<p className="font-semibold text-gray-800">{strings.error}</p>
						</div>
					</div>
				)}

				<MapContainer
					center={consts.israelCenter}
					zoom={consts.israelZoom}
					style={{ height: '100%', width: '100%' }}
					zoomControl={false}
				>
					<TileLayer attribution={strings.attribution} url={consts.tileUrl} />

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
								<Popup maxWidth={240} className="shelter-popup">
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
							<Popup maxWidth={160}>
								<div style={{ textAlign: 'center', padding: '4px 0' }}>
									<div style={{ fontSize: 24, marginBottom: 4 }}>📍</div>
									<p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#1e40af' }}>Your location</p>
									<p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>GPS position</p>
								</div>
							</Popup>
						</Marker>
					)}

					{/* Floating legend */}
					<MapLegend hasUser={!!userLocation} hasNearest={!!nearest} />
				</MapContainer>
			</div>
		</div>
	);
};

export default SheltersPage;
