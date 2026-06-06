import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiNavigation, FiMapPin, FiExternalLink, FiShield } from 'react-icons/fi';
import { MdMyLocation } from 'react-icons/md';
import { toast } from 'sonner';

import {
	israelCenter, israelZoom, tileUrl, sheltersCacheMs,
	ALL_CATEGORIES, CATEGORY_CONFIG,
	type ShelterCategory,
} from './consts';
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

// ── Per-category Leaflet icons ───────────────────────────────────────────────

function makeCategoryIcon(cat: ShelterCategory, size = 12, glow = false) {
	const { color, borderColor, glowColor, markerSize } = CATEGORY_CONFIG[cat];
	const s = size || markerSize;
	const glowStyle = glow
		? `box-shadow:0 0 0 4px ${glowColor},0 3px 8px rgba(0,0,0,0.35)`
		: `box-shadow:0 1px 4px rgba(0,0,0,0.35)`;
	return L.divIcon({
		className: '',
		html: `<div style="
			width:${s}px;height:${s}px;
			background:${color};
			border:2.5px solid ${borderColor};
			border-radius:50%;
			${glowStyle}
		"></div>`,
		iconSize: [s, s],
		iconAnchor: [s / 2, s / 2],
		popupAnchor: [0, -(s / 2 + 4)],
	});
}

// Pre-build icons for every category (normal + nearest-highlight sizes)
const ICONS: Record<ShelterCategory, L.DivIcon> = {
	missile: makeCategoryIcon('missile', 12),
	nbc:     makeCategoryIcon('nbc',     12),
	assembly:makeCategoryIcon('assembly',12),
	flood:   makeCategoryIcon('flood',   12),
	general: makeCategoryIcon('general', 11),
};

const NEAREST_ICONS: Record<ShelterCategory, L.DivIcon> = {
	missile: makeCategoryIcon('missile', 22, true),
	nbc:     makeCategoryIcon('nbc',     22, true),
	assembly:makeCategoryIcon('assembly',22, true),
	flood:   makeCategoryIcon('flood',   22, true),
	general: makeCategoryIcon('general', 22, true),
};

const userIcon = L.divIcon({
	className: '',
	html: `<div style="
		width:18px;height:18px;
		background:#2563eb;border:3px solid #fff;border-radius:50%;
		box-shadow:0 0 0 5px rgba(37,99,235,0.2),0 2px 6px rgba(0,0,0,0.3)
	"></div>`,
	iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12],
});

// ── FlyTo helper ─────────────────────────────────────────────────────────────

function FlyTo({ latlng, zoom }: { latlng: [number, number]; zoom: number }) {
	const map = useMap();
	useEffect(() => { map.flyTo(latlng, zoom, { duration: 1.5 }); }, [latlng, zoom, map]);
	return null;
}

// ── Popup ────────────────────────────────────────────────────────────────────

function ShelterPopup({
	shelter, distanceLabel, userLocation,
}: {
	shelter: ShelterMarker;
	distanceLabel?: string;
	userLocation?: [number, number] | null;
}) {
	const { data: geocodedAddress, isFetching } = useQuery({
		queryKey: ['geocode', shelter.id],
		queryFn: () => reverseGeocode(shelter.latlng),
		enabled: !shelter.address,
		staleTime: Infinity,
		retry: 1,
	});

	const address = shelter.address || geocodedAddress;
	const url = getGoogleMapsDirectionsUrl(shelter.latlng, userLocation ?? undefined);
	const cfg = CATEGORY_CONFIG[shelter.category];

	return (
		<div style={{ minWidth: 210, fontFamily: 'inherit' }}>
			{/* Category badge */}
			<div style={{
				display: 'inline-flex', alignItems: 'center', gap: 5,
				background: cfg.color + '18', border: `1px solid ${cfg.color}55`,
				borderRadius: 99, padding: '2px 8px', marginBottom: 8,
			}}>
				<span style={{ fontSize: 11 }}>{cfg.emoji}</span>
				<span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
			</div>

			{/* Name */}
			<p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: '#111827', lineHeight: 1.3 }}>
				{shelter.name || cfg.label}
			</p>

			{/* Threat types */}
			<p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>
				Protects against: {cfg.threats}
			</p>

			{/* Distance */}
			{distanceLabel && (
				<div style={{
					display: 'inline-block', marginBottom: 8,
					background: '#fff7ed', color: '#c2410c',
					fontWeight: 600, fontSize: 11, padding: '2px 8px',
					borderRadius: 99, border: '1px solid #fed7aa',
				}}>
					{strings.distanceAway(distanceLabel)}
				</div>
			)}

			{/* Address */}
			<div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 10 }}>
				<span style={{ fontSize: 12, marginTop: 1, flexShrink: 0 }}>📍</span>
				{isFetching
					? <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>{strings.fetchingAddress}</span>
					: address
						? <p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.55 }}>{address}</p>
						: <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>{strings.addressUnavailable}</p>
				}
			</div>

			<div style={{ height: 1, background: '#e5e7eb', margin: '0 0 10px' }} />

			<a
				href={url} target="_blank" rel="noopener noreferrer"
				style={{
					display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
					padding: '8px 12px', borderRadius: 8,
					background: '#2563eb', color: '#fff',
					fontWeight: 600, fontSize: 12, textDecoration: 'none',
				}}
				onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
				onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
			>
				<span>🗺</span>{strings.getDirections}
			</a>
		</div>
	);
}

// ── Floating legend ───────────────────────────────────────────────────────────

function MapLegend({
	hasUser, nearest, activeCategories,
}: {
	hasUser: boolean;
	nearest: ShelterMarker | null;
	activeCategories: Set<ShelterCategory>;
}) {
	return (
		<div style={{
			position: 'absolute', bottom: 32, right: 12, zIndex: 1000,
			background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)',
			borderRadius: 12, padding: '10px 14px',
			boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
			border: '1px solid rgba(0,0,0,0.07)',
			fontSize: 12, color: '#374151',
			display: 'flex', flexDirection: 'column', gap: 5, minWidth: 170,
		}}>
			<p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
				Legend
			</p>
			{ALL_CATEGORIES.filter(c => activeCategories.has(c)).map(cat => {
				const cfg = CATEGORY_CONFIG[cat];
				return (
					<div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<div style={{
							width: 11, height: 11, borderRadius: '50%',
							background: cfg.color, border: '2px solid #fff',
							boxShadow: '0 1px 3px rgba(0,0,0,0.3)', flexShrink: 0,
						}} />
						<span style={{ fontSize: 11 }}>{cfg.emoji} {cfg.label}</span>
					</div>
				);
			})}
			{nearest && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 5, marginTop: 2 }}>
					<div style={{
						width: 14, height: 14, borderRadius: '50%',
						background: CATEGORY_CONFIG[nearest.category].color,
						border: '2px solid #fff',
						boxShadow: `0 0 0 3px ${CATEGORY_CONFIG[nearest.category].glowColor}`,
						flexShrink: 0,
					}} />
					<span style={{ fontWeight: 600, color: '#374151', fontSize: 11 }}>Nearest to you</span>
				</div>
			)}
			{hasUser && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<div style={{
						width: 12, height: 12, borderRadius: '50%',
						background: '#2563eb', border: '2px solid #fff',
						boxShadow: '0 0 0 2px rgba(37,99,235,0.25)', flexShrink: 0,
					}} />
					<span style={{ color: '#1d4ed8', fontSize: 11 }}>Your location</span>
				</div>
			)}
		</div>
	);
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SheltersPage = () => {
	const { data: allShelters = [], isLoading, isError } = useQuery({
		queryKey: ['shelters-israel'],
		queryFn: fetchShelters,
		staleTime: sheltersCacheMs,
		retry: 2,
	});

	// Which categories are currently visible
	const [activeCategories, setActiveCategories] = useState<Set<ShelterCategory>>(
		new Set(ALL_CATEGORIES),
	);

	const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
	const [isLocating, setIsLocating] = useState(false);
	const [flyTarget, setFlyTarget] = useState<{ latlng: [number, number]; zoom: number } | null>(null);

	// Only show shelters whose category is active
	const shelters = useMemo(
		() => allShelters.filter(s => activeCategories.has(s.category)),
		[allShelters, activeCategories],
	);

	// Count per category for the filter chips
	const countByCategory = useMemo(() => {
		const counts: Partial<Record<ShelterCategory, number>> = {};
		for (const s of allShelters) {
			counts[s.category] = (counts[s.category] ?? 0) + 1;
		}
		return counts;
	}, [allShelters]);

	const nearest = useMemo(
		() => userLocation ? findNearestShelter(userLocation, shelters) : null,
		[userLocation, shelters],
	);
	const nearestDistance = useMemo(
		() => nearest && userLocation
			? formatDistance(haversineDistanceKm(userLocation, nearest.latlng))
			: null,
		[nearest, userLocation],
	);
	const { data: nearestGeocodedAddress, isFetching: isGeocodingNearest } = useQuery({
		queryKey: ['geocode', nearest?.id ?? 'none'],
		queryFn: () => reverseGeocode(nearest!.latlng),
		enabled: !!nearest && !nearest.address,
		staleTime: Infinity,
		retry: 1,
	});
	const nearestAddress = nearest ? (nearest.address || nearestGeocodedAddress) : null;

	const requestLocation = useCallback((onSuccess: (latlng: [number, number]) => void) => {
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
					? strings.locationDenied : strings.locationUnavailable);
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	}, []);

	const handleFindNearest = useCallback(() => {
		if (!allShelters.length) { toast.warning(strings.noSheltersLoaded); return; }
		if (userLocation) return;
		requestLocation(() => {});
	}, [allShelters, userLocation, requestLocation]);

	const handleCenterOnMe = useCallback(() => {
		if (userLocation) setFlyTarget({ latlng: userLocation, zoom: 16 });
		else requestLocation(latlng => setFlyTarget({ latlng, zoom: 16 }));
	}, [userLocation, requestLocation]);

	useEffect(() => {
		if (nearest) setFlyTarget({ latlng: nearest.latlng, zoom: 16 });
	}, [nearest]);

	const toggleCategory = useCallback((cat: ShelterCategory) => {
		setActiveCategories(prev => {
			const next = new Set(prev);
			if (next.has(cat)) {
				if (next.size === 1) return prev; // keep at least one active
				next.delete(cat);
			} else {
				next.add(cat);
			}
			return next;
		});
	}, []);

	return (
		<div className="flex h-full flex-col">

			{/* ── Header ─────────────────────────────────────────────────── */}
			<div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 px-6 py-5 shadow-lg">
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
								{!isLoading && !isError && allShelters.length > 0 && (
									<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
										{shelters.length.toLocaleString()} / {allShelters.length.toLocaleString()}
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
							: <FiNavigation className="text-base" />
						}
						{isLocating ? strings.locating : strings.findNearest}
					</button>
				</div>
			</div>

			{/* ── Category filter chips ───────────────────────────────────── */}
			<div className="flex items-center gap-2 overflow-x-auto border-b bg-white px-6 py-3 shadow-sm">
				<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
					Filter:
				</span>
				{ALL_CATEGORIES.map(cat => {
					const cfg = CATEGORY_CONFIG[cat];
					const count = countByCategory[cat] ?? 0;
					const active = activeCategories.has(cat);
					return (
						<button
							key={cat}
							onClick={() => toggleCategory(cat)}
							disabled={isLoading || count === 0}
							title={`Protects against: ${cfg.threats}`}
							className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm active:scale-95 disabled:opacity-40"
							style={{
								background: active ? cfg.color + '18' : '#f9fafb',
								borderColor: active ? cfg.color : '#e5e7eb',
								color: active ? cfg.color : '#6b7280',
							}}
						>
							<span>{cfg.emoji}</span>
							<span>{cfg.label}</span>
							{count > 0 && (
								<span style={{
									background: active ? cfg.color : '#e5e7eb',
									color: active ? '#fff' : '#6b7280',
									borderRadius: 99, padding: '0 5px', fontSize: 10,
								}}>
									{count.toLocaleString()}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* ── Nearest shelter card ────────────────────────────────────── */}
			{nearest && nearestDistance && (
				<div className="border-b bg-white px-6 py-4 shadow-sm">
					<div
						className="flex items-center gap-4 rounded-2xl border p-4"
						style={{
							background: CATEGORY_CONFIG[nearest.category].color + '10',
							borderColor: CATEGORY_CONFIG[nearest.category].color + '40',
						}}
					>
						<div
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md text-xl"
							style={{ background: CATEGORY_CONFIG[nearest.category].color }}
						>
							{CATEGORY_CONFIG[nearest.category].emoji}
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-semibold uppercase tracking-wider"
								style={{ color: CATEGORY_CONFIG[nearest.category].color }}>
								{strings.nearestShelterLabel} · {CATEGORY_CONFIG[nearest.category].label}
							</p>
							<p className="mt-0.5 truncate text-base font-bold text-gray-900">
								{nearest.name || CATEGORY_CONFIG[nearest.category].label}
							</p>
							<div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
								<FiMapPin className="shrink-0 text-gray-400" size={12} />
								{isGeocodingNearest
									? <span className="italic text-gray-400">{strings.fetchingAddress}</span>
									: nearestAddress
										? <span className="truncate">{nearestAddress}</span>
										: <span className="italic text-gray-400">{strings.addressUnavailable}</span>
								}
							</div>
						</div>
						<div className="shrink-0 text-right">
							<span className="block text-2xl font-bold" style={{ color: CATEGORY_CONFIG[nearest.category].color }}>
								{nearestDistance.split(' ')[0]}
							</span>
							<span className="text-xs font-medium text-gray-400">
								{nearestDistance.split(' ')[1] ?? ''}
							</span>
						</div>
						<a
							href={getGoogleMapsDirectionsUrl(nearest.latlng, userLocation ?? undefined)}
							target="_blank" rel="noopener noreferrer"
							className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
						>
							<FiExternalLink size={15} />
							<span className="hidden sm:inline">{strings.getDirections}</span>
							<span className="sm:hidden">Go</span>
						</a>
					</div>
				</div>
			)}

			{/* ── Map ─────────────────────────────────────────────────────── */}
			<div className="relative flex-1">

				{/* My Location button */}
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
								<p className="mt-1 text-sm text-gray-500">Fetching all shelter types…</p>
							</div>
						</div>
					</div>
				)}

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
					center={israelCenter}
					zoom={israelZoom}
					style={{ height: '100%', width: '100%' }}
					zoomControl={false}
				>
					<TileLayer attribution={strings.attribution} url={tileUrl} />
					{flyTarget && <FlyTo latlng={flyTarget.latlng} zoom={flyTarget.zoom} />}

					{shelters.map(shelter => {
						const isNearest = nearest?.id === shelter.id;
						return (
							<Marker
								key={shelter.id}
								position={shelter.latlng}
								icon={isNearest ? NEAREST_ICONS[shelter.category] : ICONS[shelter.category]}
								zIndexOffset={isNearest ? 1000 : 0}
							>
								<Popup maxWidth={240}>
									<ShelterPopup
										shelter={shelter}
										distanceLabel={isNearest && nearestDistance ? nearestDistance : undefined}
										userLocation={userLocation}
									/>
								</Popup>
							</Marker>
						);
					})}

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

					<MapLegend
						hasUser={!!userLocation}
						nearest={nearest}
						activeCategories={activeCategories}
					/>
				</MapContainer>
			</div>
		</div>
	);
};

export default SheltersPage;
