import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
	FiNavigation, FiMapPin, FiExternalLink, FiShield,
	FiPlus, FiRotateCcw, FiTrash2, FiCheck, FiX,
} from 'react-icons/fi';
import { MdMyLocation } from 'react-icons/md';
import { toast } from 'sonner';
import { SHELTER_CATEGORY_LABELS } from '@emergensee/shared';
import type { DepartmentShelter, ShelterPolygon } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import { getEntityId } from '@/types/entities';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import DepartmentShelterForm from '@/components/DepartmentShelterForm';
import {
	useDeleteDepartmentShelterMutation,
	useDepartmentSheltersDepartmentsQuery,
	useDepartmentSheltersQuery,
} from 'hooks/data/useDepartmentSheltersData';

import {
	israelCenter, israelZoom, tileUrl, sheltersCacheMs,
	ALL_CATEGORIES, CATEGORY_CONFIG, minPolygonPoints, departmentShelterColor,
	type ShelterCategory,
} from './consts';
import * as strings from './strings';
import {
	fetchShelters,
	findNearestShelter,
	haversineDistanceKm,
	formatDistance,
	getGoogleMapsDirectionsUrl,
	getManageableDepartments,
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

// ── Drawing helpers ──────────────────────────────────────────────────────────

function DrawCapture({ onAddPoint }: { onAddPoint: (latlng: [number, number]) => void }) {
	useMapEvents({
		click: mapEvent => onAddPoint([mapEvent.latlng.lat, mapEvent.latlng.lng]),
	});
	return null;
}

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

// ── Department shelter popup ─────────────────────────────────────────────────

function DepartmentShelterPopup({
	shelter, departmentName, canManage, onDelete,
}: {
	shelter: DepartmentShelter;
	departmentName: string;
	canManage: boolean;
	onDelete: () => void;
}) {
	const cfg = CATEGORY_CONFIG[shelter.category];

	return (
		<div style={{ minWidth: 200, fontFamily: 'inherit' }}>
			<div style={{
				display: 'inline-flex', alignItems: 'center', gap: 5,
				background: departmentShelterColor + '18', border: `1px solid ${departmentShelterColor}55`,
				borderRadius: 99, padding: '2px 8px', marginBottom: 8,
			}}>
				<span style={{ fontSize: 11 }}>🏢</span>
				<span style={{ fontSize: 11, fontWeight: 700, color: departmentShelterColor }}>
					{departmentName || strings.departmentShelterBadge}
				</span>
			</div>

			<p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 2px', color: '#111827', lineHeight: 1.3 }}>
				{shelter.name}
			</p>

			<p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px' }}>
				{cfg.emoji} {SHELTER_CATEGORY_LABELS[shelter.category]} · {cfg.threats}
			</p>

			{shelter.capacity !== undefined && (
				<div style={{
					display: 'inline-block', marginBottom: 8,
					background: '#eef2ff', color: '#4338ca',
					fontWeight: 600, fontSize: 11, padding: '2px 8px',
					borderRadius: 99, border: '1px solid #c7d2fe',
				}}>
					{strings.capacityLabel(shelter.capacity)}
				</div>
			)}

			{shelter.description && (
				<p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 10px', lineHeight: 1.55 }}>
					{shelter.description}
				</p>
			)}

			{canManage && (
				<>
					<div style={{ height: 1, background: '#e5e7eb', margin: '0 0 10px' }} />
					<button
						onClick={onDelete}
						style={{
							display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
							width: '100%', padding: '8px 12px', borderRadius: 8,
							background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
							fontWeight: 600, fontSize: 12, cursor: 'pointer',
						}}
					>
						<FiTrash2 size={13} />{strings.deleteShelter}
					</button>
				</>
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
		gcTime: Infinity,  // keep in-memory for the whole session — no re-fetch on re-mount
		retry: 1,
	});

	// Which categories are currently visible
	const [activeCategories, setActiveCategories] = useState<Set<ShelterCategory>>(
		new Set(ALL_CATEGORIES),
	);

	const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
	const [isLocating, setIsLocating] = useState(false);
	const [flyTarget, setFlyTarget] = useState<{ latlng: [number, number]; zoom: number } | null>(null);

	const currentUser = useAuthStore(state => state.user);
	const { data: departments = [] } = useDepartmentSheltersDepartmentsQuery();
	const { data: departmentShelters = [] } = useDepartmentSheltersQuery();
	const deleteShelterMutation = useDeleteDepartmentShelterMutation();

	const [hiddenDepartmentIds, setHiddenDepartmentIds] = useState<Set<string>>(new Set());
	const [isDrawing, setIsDrawing] = useState(false);
	const [draftPolygon, setDraftPolygon] = useState<ShelterPolygon>([]);
	const [isShelterFormOpen, setIsShelterFormOpen] = useState(false);
	const [shelterToDelete, setShelterToDelete] = useState<DepartmentShelter | null>(null);

	const manageableDepartments = useMemo(
		() => getManageableDepartments(departments, currentUser),
		[departments, currentUser],
	);

	const departmentNameById = useMemo(
		() => new Map(departments.map(department => [getEntityId(department), department.name])),
		[departments],
	);

	const shelterDepartmentIds = useMemo(
		() => Array.from(new Set(departmentShelters.map(shelter => shelter.departmentId))),
		[departmentShelters],
	);

	const visibleDepartmentShelters = useMemo(
		() => departmentShelters.filter(shelter => !hiddenDepartmentIds.has(shelter.departmentId)),
		[departmentShelters, hiddenDepartmentIds],
	);

	const canManageShelter = useCallback(
		(shelter: DepartmentShelter) =>
			manageableDepartments.some(department => getEntityId(department) === shelter.departmentId),
		[manageableDepartments],
	);

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
				// Silently ignore on auto-request; user can still click the button
				if (err.code !== GeolocationPositionError.PERMISSION_DENIED) {
					toast.error(strings.locationUnavailable);
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	}, []);

	// Auto-request location on mount — emergency app should know where you are immediately
	const hasAutoLocated = useRef(false);
	useEffect(() => {
		if (!hasAutoLocated.current) {
			hasAutoLocated.current = true;
			setTimeout(() => requestLocation(() => {}), 0);
		}
	}, [requestLocation]);

	const handleFindNearest = useCallback(() => {
		if (!allShelters.length) { toast.warning(strings.noSheltersLoaded); return; }
		if (userLocation) {
			if (nearest) setFlyTarget({ latlng: nearest.latlng, zoom: 16 });
			return;
		}
		requestLocation(latlng => {
			const found = findNearestShelter(latlng, shelters);
			if (found) setFlyTarget({ latlng: found.latlng, zoom: 16 });
		});
	}, [allShelters, userLocation, nearest, shelters, requestLocation]);

	const handleCenterOnMe = useCallback(() => {
		if (userLocation) setFlyTarget({ latlng: userLocation, zoom: 16 });
		else requestLocation(latlng => setFlyTarget({ latlng, zoom: 16 }));
	}, [userLocation, requestLocation]);

	const toggleDepartment = useCallback((departmentId: string) => {
		setHiddenDepartmentIds(previous => {
			const next = new Set(previous);
			if (next.has(departmentId)) next.delete(departmentId);
			else next.add(departmentId);
			return next;
		});
	}, []);

	const handleStartDrawing = useCallback(() => {
		setDraftPolygon([]);
		setIsDrawing(true);
	}, []);

	const handleAddPoint = useCallback((latlng: [number, number]) => {
		setDraftPolygon(previous => [...previous, latlng]);
	}, []);

	const handleUndoPoint = useCallback(() => {
		setDraftPolygon(previous => previous.slice(0, -1));
	}, []);

	const handleClearPoints = useCallback(() => setDraftPolygon([]), []);

	const handleCancelDrawing = useCallback(() => {
		setIsDrawing(false);
		setDraftPolygon([]);
	}, []);

	const handleOpenShelterForm = useCallback(() => setIsShelterFormOpen(true), []);

	const handleCloseShelterForm = useCallback(() => setIsShelterFormOpen(false), []);

	const handleShelterSaved = useCallback(() => {
		setIsShelterFormOpen(false);
		setIsDrawing(false);
		setDraftPolygon([]);
	}, []);

	const handleConfirmDeleteShelter = useCallback(() => {
		if (!shelterToDelete) return;
		deleteShelterMutation.mutate(getEntityId(shelterToDelete));
		setShelterToDelete(null);
	}, [deleteShelterMutation, shelterToDelete]);

	const handleCancelDeleteShelter = useCallback(() => setShelterToDelete(null), []);

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
			<div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 px-4 py-4 shadow-lg sm:px-6 sm:py-5">
				<div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
				<div className="pointer-events-none absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-white/5" />
				<div className="relative flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm sm:h-12 sm:w-12">
							<FiShield className="text-xl text-white sm:text-2xl" />
						</div>
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<h1 className="text-lg font-bold text-white sm:text-xl">{strings.pageTitle}</h1>
								{!isLoading && !isError && allShelters.length > 0 && (
									<span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
										{shelters.length.toLocaleString()} / {allShelters.length.toLocaleString()}
									</span>
								)}
							</div>
							<p className="mt-0.5 text-xs text-emerald-100 sm:text-sm">{strings.pageSubtitle}</p>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						{manageableDepartments.length > 0 && !isDrawing && (
							<button
								onClick={handleStartDrawing}
								className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
							>
								<FiPlus className="text-base" />
								<span className="hidden sm:inline">{strings.addShelter}</span>
							</button>
						)}
						<button
							onClick={handleFindNearest}
							disabled={isLocating || isLoading}
							className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-md transition-all hover:bg-emerald-50 hover:shadow-lg active:scale-95 disabled:opacity-60 sm:px-5"
						>
							{isLocating
								? <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
								: <FiNavigation className="text-base" />
							}
							<span className="hidden sm:inline">{isLocating ? strings.locating : strings.findNearest}</span>
							<span className="sm:hidden">{isLocating ? 'Locating…' : 'Find Nearest'}</span>
						</button>
					</div>
				</div>
			</div>

			{/* ── Category filter chips ───────────────────────────────────── */}
			<div className="flex items-center gap-2 overflow-x-auto border-b bg-white px-4 py-3 shadow-sm sm:px-6">
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

				{shelterDepartmentIds.length > 0 && (
					<>
						<span className="mx-1 h-5 w-px shrink-0 bg-gray-200" />
						<span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
							{strings.departmentFilterLabel}
						</span>
						{shelterDepartmentIds.map(departmentId => {
							const active = !hiddenDepartmentIds.has(departmentId);
							const count = departmentShelters.filter(
								shelter => shelter.departmentId === departmentId,
							).length;
							return (
								<button
									key={departmentId}
									onClick={() => toggleDepartment(departmentId)}
									className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm active:scale-95"
									style={{
										background: active ? departmentShelterColor + '18' : '#f9fafb',
										borderColor: active ? departmentShelterColor : '#e5e7eb',
										color: active ? departmentShelterColor : '#6b7280',
									}}
								>
									<span>🏢</span>
									<span>{departmentNameById.get(departmentId) ?? departmentId}</span>
									<span style={{
										background: active ? departmentShelterColor : '#e5e7eb',
										color: active ? '#fff' : '#6b7280',
										borderRadius: 99, padding: '0 5px', fontSize: 10,
									}}>
										{count}
									</span>
								</button>
							);
						})}
					</>
				)}
			</div>

			{/* ── Nearest shelter card ────────────────────────────────────── */}
			{nearest && nearestDistance && (
				<div className="border-b bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
					<div
						className="rounded-2xl border p-3 sm:p-4"
						style={{
							background: CATEGORY_CONFIG[nearest.category].color + '10',
							borderColor: CATEGORY_CONFIG[nearest.category].color + '40',
						}}
					>
						{/* Top row: icon + text + distance + directions */}
						<div className="flex items-center gap-3">
							<div
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md text-lg sm:h-12 sm:w-12 sm:text-xl"
								style={{ background: CATEGORY_CONFIG[nearest.category].color }}
							>
								{CATEGORY_CONFIG[nearest.category].emoji}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-semibold uppercase tracking-wider"
									style={{ color: CATEGORY_CONFIG[nearest.category].color }}>
									{strings.nearestShelterLabel} · {CATEGORY_CONFIG[nearest.category].label}
								</p>
								<p className="mt-0.5 truncate text-sm font-bold text-gray-900 sm:text-base">
									{nearest.name || CATEGORY_CONFIG[nearest.category].label}
								</p>
							</div>
							<div className="shrink-0 text-right">
								<span className="block text-xl font-bold sm:text-2xl" style={{ color: CATEGORY_CONFIG[nearest.category].color }}>
									{nearestDistance.split(' ')[0]}
								</span>
								<span className="text-xs font-medium text-gray-400">
									{nearestDistance.split(' ')[1] ?? ''}
								</span>
							</div>
						</div>
						{/* Bottom row: address + directions button */}
						<div className="mt-2 flex items-center gap-2">
							<FiMapPin className="shrink-0 text-gray-400" size={12} />
							<div className="min-w-0 flex-1 text-sm text-gray-500">
								{isGeocodingNearest
									? <span className="italic text-gray-400">{strings.fetchingAddress}</span>
									: nearestAddress
										? <span className="truncate block">{nearestAddress}</span>
										: <span className="italic text-gray-400">{strings.addressUnavailable}</span>
								}
							</div>
							<a
								href={getGoogleMapsDirectionsUrl(nearest.latlng, userLocation ?? undefined)}
								target="_blank" rel="noopener noreferrer"
								className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 sm:px-4 sm:py-3"
							>
								<FiExternalLink size={14} />
								<span className="hidden sm:inline">{strings.getDirections}</span>
								<span className="sm:hidden">Go</span>
							</a>
						</div>
					</div>
				</div>
			)}

			{/* ── Map ─────────────────────────────────────────────────────── */}
			<div className={`relative flex-1 isolate${isDrawing ? ' ui-map-drawing' : ''}`}>

				{/* Drawing toolbar */}
				{isDrawing && (
					<div
						style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
						className="flex max-w-[95vw] items-center gap-2 rounded-2xl bg-white/96 px-3 py-2.5 shadow-xl ring-1 ring-black/10 backdrop-blur"
					>
						<div className="mr-1 hidden min-w-0 sm:block">
							<p className="text-xs font-bold text-gray-900">{strings.drawingTitle}</p>
							<p className="truncate text-[11px] text-gray-500">{strings.drawingHint}</p>
						</div>
						<span
							className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
							style={{
								background: departmentShelterColor + '18',
								color: departmentShelterColor,
							}}
						>
							{draftPolygon.length < minPolygonPoints
								? strings.drawingPoints(draftPolygon.length)
								: strings.drawingReady(draftPolygon.length)}
						</span>
						<button
							onClick={handleUndoPoint}
							disabled={draftPolygon.length === 0}
							title={strings.undoPoint}
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
						>
							<FiRotateCcw size={15} />
						</button>
						<button
							onClick={handleClearPoints}
							disabled={draftPolygon.length === 0}
							title={strings.clearPoints}
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-40"
						>
							<FiTrash2 size={15} />
						</button>
						<button
							onClick={handleCancelDrawing}
							title={strings.cancelDrawing}
							className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all hover:bg-red-100 active:scale-95"
						>
							<FiX size={16} />
						</button>
						<button
							onClick={handleOpenShelterForm}
							disabled={draftPolygon.length < minPolygonPoints}
							className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
						>
							<FiCheck size={15} />
							<span className="hidden sm:inline">{strings.finishDrawing}</span>
						</button>
					</div>
				)}

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
								<p className="mt-1 text-sm text-gray-500">Loading shelter database…</p>
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
					{isDrawing && <DrawCapture onAddPoint={handleAddPoint} />}

					{visibleDepartmentShelters.map(shelter => {
						const cfg = CATEGORY_CONFIG[shelter.category];
						return (
							<Polygon
								key={getEntityId(shelter)}
								positions={shelter.polygon}
								pathOptions={{ color: cfg.color, weight: 2, fillColor: cfg.color, fillOpacity: 0.25 }}
							>
								<Popup maxWidth={240}>
									<DepartmentShelterPopup
										shelter={shelter}
										departmentName={departmentNameById.get(shelter.departmentId) ?? ''}
										canManage={canManageShelter(shelter)}
										onDelete={() => setShelterToDelete(shelter)}
									/>
								</Popup>
							</Polygon>
						);
					})}

					{draftPolygon.length > 1 && (
						<Polygon
							positions={draftPolygon}
							interactive={false}
							pathOptions={{
								color: departmentShelterColor,
								weight: 2,
								dashArray: '6 6',
								fillColor: departmentShelterColor,
								fillOpacity: 0.15,
							}}
						/>
					)}
					{draftPolygon.map((point, index) => (
						<CircleMarker
							key={`${point[0]}-${point[1]}-${index}`}
							center={point}
							radius={5}
							interactive={false}
							pathOptions={{ color: '#fff', weight: 2, fillColor: departmentShelterColor, fillOpacity: 1 }}
						/>
					))}

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

			{isShelterFormOpen && (
				<DepartmentShelterForm
					polygon={draftPolygon}
					departments={manageableDepartments}
					onSaved={handleShelterSaved}
					onClose={handleCloseShelterForm}
				/>
			)}

			{shelterToDelete && (
				<ConfirmModal
					title={strings.deleteShelterConfirm}
					message={strings.deleteShelterMessage(shelterToDelete.name)}
					confirmText={strings.deleteShelter}
					onConfirm={handleConfirmDeleteShelter}
					onCancel={handleCancelDeleteShelter}
				/>
			)}
		</div>
	);
};

export default SheltersPage;
