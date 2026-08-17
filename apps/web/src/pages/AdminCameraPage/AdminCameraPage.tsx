import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { EventStatus, ResponderStatus, User, UserRole } from '@emergensee/shared';
import { FaCheck, FaShieldAlt, FaTimes, FaUserCircle, FaVideo } from 'react-icons/fa';
import { MdVideocam, MdVideocamOff } from 'react-icons/md';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from 'services/websocketService';
import { getEntityId } from '@/types/entities';
import {
	useCameraEventsQuery,
	useCameraStatusMutation,
	useCameraStatusQuery,
	useCameraUsersQuery,
	CAMERA_QUERY_KEYS,
} from 'hooks/data/useCameraPageData';
import { findUserByIdentity } from 'pages/CameraPage/utils';
import * as strings from './strings';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SuggestionCard {
	identity: string;
	user: User;
	confidence: number;
}

interface CameraUserInfo {
	userId: string;
	location: string;
}

interface RecognitionResult {
	identity: string | null;
	confidence: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' }) {
	const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
	const cls =
		size === 'sm'
			? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700'
			: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700';
	return (
		<div className={cls}>
			{initials || <FaUserCircle className="text-blue-300" />}
		</div>
	);
}

function ConfidenceBadge({ value }: { value: number }) {
	const pct = Math.round(value * 100);
	const color =
		pct >= 80
			? 'bg-emerald-100 text-emerald-700'
			: pct >= 60
			? 'bg-amber-100 text-amber-700'
			: 'bg-orange-100 text-orange-700';
	return (
		<span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
			{pct}%
		</span>
	);
}

// ─── CameraCard ───────────────────────────────────────────────────────────────

interface CameraCardProps {
	camera: User;
	isOnline: boolean;
	pending: SuggestionCard[];
	confirmedCount: number;
	onConfirm: (card: SuggestionCard) => void;
	onDismiss: (card: SuggestionCard) => void;
	onOpenLive: () => void;
	eventId: string | undefined;
	isMutating: boolean;
}

function CameraCard({
	camera,
	isOnline,
	pending,
	confirmedCount,
	onConfirm,
	onDismiss,
	onOpenLive,
	eventId,
	isMutating,
}: CameraCardProps) {
	const name = camera.location || camera.cameraCode || camera.firstName || 'Camera';

	return (
		<div
			className={`flex flex-col rounded-2xl border shadow-sm ${
				isOnline ? 'border-green-200 bg-white' : 'border-gray-200 bg-gray-50'
			}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between rounded-t-2xl border-b border-inherit px-4 py-3">
				<div className="flex items-center gap-2">
					<span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
					<span className="font-semibold text-gray-800">{name}</span>
					{!isOnline && <span className="text-xs text-gray-400">Offline</span>}
				</div>
				<button
					onClick={onOpenLive}
					disabled={!isOnline}
					className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<FaVideo size={10} />
					Live
				</button>
			</div>

			{/* Pending list */}
			<div className="flex min-h-[80px] flex-1 flex-col gap-2 p-3">
				{pending.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center">
						<FaUserCircle className="text-2xl text-gray-200" />
						<p className="text-xs text-gray-400">
							{isOnline ? 'No faces recognized yet' : strings.noActiveFeed}
						</p>
					</div>
				) : (
					pending.map(card => (
						<div
							key={card.identity}
							className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm"
						>
							<UserAvatar user={card.user} size="sm" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold text-gray-900">
									{card.user.firstName} {card.user.lastName}
								</p>
								<div className="flex items-center gap-1">
									<span className="text-[11px] text-gray-400">Match</span>
									<ConfidenceBadge value={card.confidence} />
								</div>
							</div>
							<div className="flex shrink-0 gap-1">
								<button
									onClick={() => onConfirm(card)}
									disabled={!eventId || isMutating}
									title="Confirm safe"
									className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-40"
								>
									<FaCheck size={11} />
								</button>
								<button
									onClick={() => onDismiss(card)}
									title="Dismiss"
									className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
								>
									<FaTimes size={11} />
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{/* Footer — confirmed count */}
			{confirmedCount > 0 && (
				<div className="flex items-center gap-1.5 rounded-b-2xl border-t border-inherit px-4 py-2">
					<FaShieldAlt className="text-green-500" size={11} />
					<span className="text-xs font-medium text-green-700">
						{confirmedCount} confirmed safe
					</span>
				</div>
			)}
		</div>
	);
}

// ─── LiveModal ────────────────────────────────────────────────────────────────

interface LiveModalProps {
	camera: User | undefined;
	isLive: boolean;
	hasFrame: boolean;
	frameImgRef: React.RefObject<HTMLImageElement>;
	onClose: () => void;
}

function LiveModal({ camera, isLive, hasFrame, frameImgRef, onClose }: LiveModalProps) {
	const name = camera?.location || camera?.cameraCode || camera?.firstName || 'Camera';

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
			onClick={e => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
				{/* Modal header */}
				<div className="flex items-center justify-between px-5 py-3">
					<div className="flex items-center gap-2">
						<span className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-green-400' : 'bg-gray-500'}`} />
						<span className="font-semibold text-white">{name} — Live Feed</span>
					</div>
					<button
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
					>
						<FaTimes size={14} />
					</button>
				</div>

				{/* Video area */}
				<div className="relative aspect-video bg-black">
					<img
						ref={frameImgRef}
						className="h-full w-full object-contain"
						style={{ transform: 'scaleX(-1)' }}
						alt=""
					/>

					{!isLive && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
							<MdVideocamOff className="text-5xl text-gray-600" />
							<p className="text-sm text-gray-500">{strings.noActiveFeed}</p>
						</div>
					)}

					{isLive && !hasFrame && (
						<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
							<div className="h-9 w-9 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500" />
							<p className="text-sm text-gray-400">Connecting…</p>
						</div>
					)}

					<div
						className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 backdrop-blur-sm"
						style={{ background: isLive ? 'rgba(220,38,38,0.75)' : 'rgba(75,85,99,0.75)' }}
					>
						{isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
						<span className="text-xs font-bold uppercase tracking-widest text-white">
							{isLive ? 'Live' : 'Offline'}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Main page ────────────────────────────────────────────────────────────────

const AdminCameraPage: React.FC = () => {
	// All refs declared up front — closures below can safely reference them
	const frameImgRef = useRef<HTMLImageElement>(null);
	const liveViewCameraIdRef = useRef<string | null>(null);
	const frameRecvSeqRef = useRef(0);
	const confirmedUserIdsRef = useRef<Set<string>>(new Set());
	const dismissedByCameraId = useRef<Map<string, Set<string>>>(new Map());

	const [activeCameraMap, setActiveCameraMap] = useState<Map<string, string>>(new Map());
	const [pendingByCameraId, setPendingByCameraId] = useState<Map<string, SuggestionCard[]>>(new Map());
	const [liveViewCameraId, setLiveViewCameraId] = useState<string | null>(null);
	const [hasFrame, setHasFrame] = useState(false);

	const queryClient = useQueryClient();
	const { data: allUsers = [] } = useCameraUsersQuery();
	const { data: events = [] } = useCameraEventsQuery();
	const { data: allStatuses = [] } = useCameraStatusQuery();

	const cameraUsers = useMemo(() => allUsers.filter(u => u.role === UserRole.CAMERA), [allUsers]);

	const ongoingEvent = events.find(e => e.status === EventStatus.ONGOING);
	const eventId = ongoingEvent?.id ?? (ongoingEvent as { _id?: string } | undefined)?._id;

	// Per-camera confirmed count for footer badge
	const confirmedCountByCameraId = useMemo<Map<string, number>>(() => {
		if (!eventId) return new Map();
		const counts = new Map<string, number>();
		for (const s of allStatuses) {
			const sEventId = typeof s.eventId === 'object' ? (s.eventId as { _id?: string })._id : s.eventId;
			if ((sEventId === eventId || s.eventId === eventId) && s.status === ResponderStatus.SAFE && s.sourceCamera) {
				counts.set(s.sourceCamera, (counts.get(s.sourceCamera) ?? 0) + 1);
			}
		}
		return counts;
	}, [allStatuses, eventId]);

	const statusMutation = useCameraStatusMutation();

	// Set of user IDs already confirmed safe in this event — globally suppressed from suggestions
	const confirmedUserIds = useMemo<Set<string>>(() => {
		if (!eventId) return new Set();
		const set = new Set<string>();
		for (const s of allStatuses) {
			const sEventId = typeof s.eventId === 'object' ? (s.eventId as { _id?: string })._id : s.eventId;
			if ((sEventId === eventId || s.eventId === eventId) && s.status === ResponderStatus.SAFE) {
				set.add(String(s.userId));
			}
		}
		return set;
	}, [allStatuses, eventId]);

	// Keep ref in sync and remove any already-confirmed cards from pending
	useEffect(() => {
		confirmedUserIdsRef.current = confirmedUserIds;
		setPendingByCameraId(prev => {
			let changed = false;
			const next = new Map(prev);
			for (const [camId, cards] of next) {
				const filtered = cards.filter(c => !confirmedUserIds.has(getEntityId(c.user)));
				if (filtered.length !== cards.length) {
					next.set(camId, filtered);
					changed = true;
				}
			}
			return changed ? next : prev;
		});
	}, [confirmedUserIds]);

	// Main WebSocket effect — re-runs when user list changes so closures stay fresh
	useEffect(() => {
		const handleCameraUsers = (data: unknown) => {
			const users = data as CameraUserInfo[];
			setActiveCameraMap(new Map(users.map(u => [u.userId, u.location])));
		};

		const handleFrame = (data: unknown) => {
			const payload = data as { cameraUserId: string; frame: string };
			// liveViewCameraIdRef is updated synchronously in openLive/closeLive
			if (payload.cameraUserId !== liveViewCameraIdRef.current) return;
			if (frameImgRef.current) {
				frameImgRef.current.src = payload.frame;
				setHasFrame(true);
			}
			frameRecvSeqRef.current += 1;
			if (frameRecvSeqRef.current % 20 === 0) {
				console.log(`[camera:frame] received #${frameRecvSeqRef.current} for camera ${payload.cameraUserId}`);
			}
		};

		const handleRecognize = (data: unknown) => {
			const payload = data as { cameraUserId: string; results: RecognitionResult[] };
			const camId = payload.cameraUserId;
			setPendingByCameraId(prev => {
				const next = new Map(prev);
				const existing = next.get(camId) ?? [];
				const dismissed = dismissedByCameraId.current.get(camId) ?? new Set<string>();
				const updated = [...existing];
				for (const r of payload.results) {
					if (!r.identity || r.confidence < 0.5) continue;
					if (dismissed.has(r.identity)) continue;
					const user = findUserByIdentity(allUsers, r.identity);
					if (!user) continue;
					const uid = getEntityId(user);
					if (dismissed.has(uid)) continue;
					// Skip users already confirmed safe in this event
					if (confirmedUserIdsRef.current.has(uid)) continue;
					if (updated.some(s => s.identity === r.identity)) continue;
					updated.push({ identity: r.identity, user, confidence: r.confidence });
				}
				next.set(camId, updated);
				return next;
			});
		};

		websocketService.connect();
		websocketService.onRaw('camera:users', handleCameraUsers);
		websocketService.onRaw('camera:frame', handleFrame);
		websocketService.onRaw('camera:recognize', handleRecognize);
		websocketService.emit('admin:get-users', {});

		// Subscribe to recognition events for all known cameras
		const camUsers = allUsers.filter(u => u.role === UserRole.CAMERA);
		camUsers.forEach(cu => {
			websocketService.emit('admin:watch-recog', { cameraUserId: getEntityId(cu) });
		});

		return () => {
			websocketService.offRaw('camera:users', handleCameraUsers);
			websocketService.offRaw('camera:frame', handleFrame);
			websocketService.offRaw('camera:recognize', handleRecognize);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [allUsers]);

	// Open live modal — update ref immediately so the first frame isn't dropped
	const openLive = useCallback((camId: string) => {
		liveViewCameraIdRef.current = camId;
		setLiveViewCameraId(camId);
		setHasFrame(false);
		frameRecvSeqRef.current = 0;
		if (frameImgRef.current) frameImgRef.current.src = '';
		console.log(`[admin:watch] requesting live feed for camera ${camId}, socket connected=${websocketService.isConnected()}`);
		websocketService.emit('admin:watch', { cameraUserId: camId });
	}, []);

	// Close live modal — clear ref immediately to stop processing incoming frames
	const closeLive = useCallback(() => {
		const camId = liveViewCameraIdRef.current;
		liveViewCameraIdRef.current = null;
		if (camId) websocketService.emit('admin:unwatch', { cameraUserId: camId });
		setLiveViewCameraId(null);
		setHasFrame(false);
		if (frameImgRef.current) frameImgRef.current.src = '';
	}, []);

	const handleConfirm = useCallback(
		(camId: string, card: SuggestionCard) => {
			if (!eventId) return;
			const dismissed = dismissedByCameraId.current.get(camId) ?? new Set<string>();
			dismissed.add(card.identity);
			dismissed.add(getEntityId(card.user));
			dismissedByCameraId.current.set(camId, dismissed);
			setPendingByCameraId(prev => {
				const next = new Map(prev);
				next.set(camId, (next.get(camId) ?? []).filter(s => s.identity !== card.identity));
				return next;
			});
			statusMutation.mutate(
				{ status: ResponderStatus.SAFE, userId: getEntityId(card.user), eventId, sourceCamera: camId },
				{ onSuccess: () => queryClient.invalidateQueries({ queryKey: CAMERA_QUERY_KEYS.status }) },
			);
		},
		[eventId, statusMutation, queryClient],
	);

	const handleDismiss = useCallback((camId: string, card: SuggestionCard) => {
		const dismissed = dismissedByCameraId.current.get(camId) ?? new Set<string>();
		dismissed.add(card.identity);
		dismissedByCameraId.current.set(camId, dismissed);
		setPendingByCameraId(prev => {
			const next = new Map(prev);
			next.set(camId, (next.get(camId) ?? []).filter(s => s.identity !== card.identity));
			return next;
		});
	}, []);

	const liveCamera = cameraUsers.find(u => getEntityId(u) === liveViewCameraId);
	const liveIsOnline = liveViewCameraId ? activeCameraMap.has(liveViewCameraId) : false;

	return (
		<div className="flex h-full flex-col bg-gray-50">
			{/* Top bar */}
			<div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
				<MdVideocam className="text-xl text-blue-600" />
				<span className="text-lg font-bold text-gray-900">{strings.title}</span>
				{ongoingEvent ? (
					<span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
						● {ongoingEvent.title}
					</span>
				) : (
					<span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
						{strings.noEventTitle}
					</span>
				)}
			</div>

			{/* Camera card grid */}
			<div className="flex-1 overflow-y-auto p-4 md:p-6">
				{cameraUsers.length === 0 ? (
					<div className="flex flex-col items-center gap-3 py-20 text-center">
						<MdVideocam className="text-5xl text-gray-200" />
						<p className="max-w-sm text-sm text-gray-400">{strings.noCameraUsers}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{cameraUsers.map(cu => {
							const cuId = getEntityId(cu);
							return (
								<CameraCard
									key={cuId}
									camera={cu}
									isOnline={activeCameraMap.has(cuId)}
									pending={pendingByCameraId.get(cuId) ?? []}
									confirmedCount={confirmedCountByCameraId.get(cuId) ?? 0}
									onConfirm={card => handleConfirm(cuId, card)}
									onDismiss={card => handleDismiss(cuId, card)}
									onOpenLive={() => openLive(cuId)}
									eventId={eventId}
									isMutating={statusMutation.isPending}
								/>
							);
						})}
					</div>
				)}
			</div>

			{/* Live video modal */}
			{liveViewCameraId && (
				<LiveModal
					camera={liveCamera}
					isLive={liveIsOnline}
					hasFrame={hasFrame}
					frameImgRef={frameImgRef}
					onClose={closeLive}
				/>
			)}
		</div>
	);
};

export default React.memo(AdminCameraPage);
