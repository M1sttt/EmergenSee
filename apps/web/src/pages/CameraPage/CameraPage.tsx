import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventStatus, ResponderStatus, User } from '@emergensee/shared';
import {
	FaCamera,
	FaCheck,
	FaCompress,
	FaExpand,
	FaShieldAlt,
	FaTimes,
	FaUserCircle,
} from 'react-icons/fa';
import { MdFaceUnlock } from 'react-icons/md';
import { useQueryClient } from '@tanstack/react-query';
import { useCameraEventsQuery, useCameraStatusMutation, useCameraStatusQuery, useCameraUsersQuery, CAMERA_QUERY_KEYS } from 'hooks/data/useCameraPageData';
import { faceRecognitionService } from 'services/faceRecognitionService';
import { getEntityId } from '@/types/entities';
import * as consts from './consts';
import * as strings from './strings';
import { findUserByIdentity } from './utils';

interface SuggestionCard {
	identity: string;
	user: User;
	confidence: number;
}

type Tab = 'pending' | 'confirmed';

// ─────────────────────────────────────────────────────────────────────────────
// Utility sub-components
// ─────────────────────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: User }) {
	const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
	return (
		<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
			{initials || <FaUserCircle className="text-2xl text-blue-300" />}
		</div>
	);
}

function ConfidenceBadge({ value }: { value: number }) {
	const pct = Math.round(value * 100);
	const color =
		pct >= 80 ? 'bg-green-100 text-green-700' :
		pct >= 60 ? 'bg-yellow-100 text-yellow-700' :
		'bg-orange-100 text-orange-700';
	return (
		<span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
			{pct}%
		</span>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Face ID overlay
// ─────────────────────────────────────────────────────────────────────────────

function FaceIdOverlay({ scanning }: { scanning: boolean }) {
	return (
		<svg
			viewBox="0 0 160 90"
			preserveAspectRatio="xMidYMid slice"
			xmlns="http://www.w3.org/2000/svg"
			className="pointer-events-none absolute inset-0 h-full w-full"
		>
			<defs>
				<mask id="faceIdMask">
					<rect width="160" height="90" fill="white" />
					<ellipse cx="80" cy="45" rx="28" ry="37" fill="black" />
				</mask>
				<clipPath id="ovalClip">
					<ellipse cx="80" cy="45" rx="28" ry="37" />
				</clipPath>
				<linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="rgba(99,179,237,0)" />
					<stop offset="50%" stopColor="rgba(99,179,237,0.65)" />
					<stop offset="100%" stopColor="rgba(99,179,237,0)" />
				</linearGradient>
			</defs>

			{/* Dark vignette with oval hole */}
			<rect width="160" height="90" fill="rgba(0,0,0,0.52)" mask="url(#faceIdMask)" />

			{/* Oval border */}
			<ellipse cx="80" cy="45" rx="28" ry="37" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />

			{/* Cardinal tick marks */}
			<line x1="80" y1="5"   x2="80" y2="9"   stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="80" y1="81"  x2="80" y2="85"  stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="49" y1="45"  x2="53" y2="45"  stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="107" y1="45" x2="111" y2="45" stroke="white" strokeWidth="1.4" strokeLinecap="round" />

			{/* Scan line — only while capturing */}
			{scanning && (
				<rect x="52" y="0" width="56" height="7" fill="url(#scanGrad)" clipPath="url(#ovalClip)">
					<animate attributeName="y" from="8" to="75" dur="1.6s" repeatCount="indefinite" />
					<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="1.6s" repeatCount="indefinite" />
				</rect>
			)}
		</svg>
	);
}


// ─────────────────────────────────────────────────────────────────────────────
// Camera controls bar — shown in top-right corner of the camera feed
// ─────────────────────────────────────────────────────────────────────────────

interface CameraControlsProps {
	isFullscreen: boolean;
	showOverlay: boolean;
	onToggleFullscreen: () => void;
	onToggleOverlay: () => void;
}

function CameraControls({ isFullscreen, showOverlay, onToggleFullscreen, onToggleOverlay }: CameraControlsProps) {
	return (
		<div className="absolute right-3 top-3 flex items-center gap-2">
			{/* Face ID overlay toggle */}
			<button
				onClick={onToggleOverlay}
				className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
					showOverlay
						? 'bg-blue-500/70 text-white hover:bg-blue-500/90'
						: 'bg-black/50 text-gray-400 hover:bg-black/70'
				}`}
				title={showOverlay ? 'Hide Face ID overlay' : 'Show Face ID overlay'}
			>
				<MdFaceUnlock className="text-base" />
			</button>

			{/* Fullscreen toggle */}
			<button
				onClick={onToggleFullscreen}
				className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
				title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
			>
				{isFullscreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
			</button>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const CameraPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dismissedRef = useRef<Set<string>>(new Set());
	const isCapturingRef = useRef(false);

	const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
	const [activeTab, setActiveTab] = useState<Tab>('pending');
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showOverlay, setShowOverlay] = useState(true);

	const queryClient = useQueryClient();
	const { data: users = [], isLoading: usersLoading } = useCameraUsersQuery();
	const { data: events = [] } = useCameraEventsQuery();
	const { data: allStatuses = [] } = useCameraStatusQuery();

	const ongoingEvent = events.find(e => e.status === EventStatus.ONGOING);
	const eventId = ongoingEvent?.id ?? (ongoingEvent as { _id?: string } | undefined)?._id;

	const confirmed = useMemo<User[]>(() => {
		if (!eventId) return [];
		return allStatuses
			.filter(s => {
				const sEventId = typeof s.eventId === 'object' ? (s.eventId as { _id?: string })._id : s.eventId;
				return (sEventId === eventId || s.eventId === eventId) && s.status === ResponderStatus.SAFE;
			})
			.map(s => users.find(u => getEntityId(u) === s.userId))
			.filter((u): u is User => u !== undefined);
	}, [allStatuses, eventId, users]);

	const statusMutation = useCameraStatusMutation();

	// Keep dismissed set in sync with server-confirmed users so they don't re-appear as suggestions
	useEffect(() => {
		confirmed.forEach(u => dismissedRef.current.add(getEntityId(u)));
	}, [confirmed]);

	// Start camera stream once — kept alive for the component lifetime
	useEffect(() => {
		let stream: MediaStream | null = null;
		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: 'user' } })
			.then(s => {
				stream = s;
				if (videoRef.current) videoRef.current.srcObject = s;
			})
			.catch(() => setCameraError(strings.cameraError));
		return () => stream?.getTracks().forEach(t => t.stop());
	}, []);

	const captureAndRecognize = useCallback(async () => {
		if (isCapturingRef.current) return;
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || video.readyState < video.HAVE_CURRENT_DATA) return;

		isCapturingRef.current = true;
		setIsScanning(true);
		try {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			canvas.getContext('2d')?.drawImage(video, 0, 0);
			const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
			if (!blob) return;

			const result = await faceRecognitionService.recognize(blob);
			setSuggestions(prev => {
				const next = [...prev];
				for (const r of result.results) {
					if (!r.identity || r.confidence < consts.MIN_CONFIDENCE) continue;
					if (dismissedRef.current.has(r.identity)) continue;
					const user = findUserByIdentity(users, r.identity);
					if (!user) continue;
					const userId = getEntityId(user);
					if (dismissedRef.current.has(userId)) continue;
					if (next.some(s => s.identity === r.identity)) continue;
					next.push({ identity: r.identity, user, confidence: r.confidence });
				}
				return next;
			});
		} catch {
			// silently skip — next interval retries
		} finally {
			isCapturingRef.current = false;
			setIsScanning(false);
		}
	}, [users]);

	useEffect(() => {
		const interval = setInterval(captureAndRecognize, consts.CAPTURE_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [captureAndRecognize]);

	const handleConfirm = useCallback(
		(card: SuggestionCard) => {
			if (!eventId) return;
			dismissedRef.current.add(card.identity);
			setSuggestions(prev => prev.filter(s => s.identity !== card.identity));
			setActiveTab('confirmed');
			statusMutation.mutate(
				{ status: ResponderStatus.SAFE, userId: getEntityId(card.user), eventId },
				{ onSuccess: () => queryClient.invalidateQueries({ queryKey: CAMERA_QUERY_KEYS.status }) },
			);
		},
		[eventId, statusMutation, queryClient],
	);

	const handleDismiss = useCallback((card: SuggestionCard) => {
		dismissedRef.current.add(card.identity);
		setSuggestions(prev => prev.filter(s => s.identity !== card.identity));
	}, []);

	if (usersLoading) return <div className="ui-page">{strings.loadingUsers}</div>;

	if (cameraError) {
		return (
			<div className="ui-page flex flex-col items-center justify-center gap-3 text-center">
				<FaCamera className="text-5xl text-gray-300" />
				<p className="font-medium text-red-600">{cameraError}</p>
			</div>
		);
	}

	// ── Tab panel content (shared between normal / fullscreen) ──────────────────
	const tabPanel = (
		<>
			{/* Tab switcher */}
			<div className="mb-3 flex rounded-xl bg-gray-100 p-1">
				{(['pending', 'confirmed'] as Tab[]).map(tab => {
					const count = tab === 'pending' ? suggestions.length : confirmed.length;
					const badgeColor = tab === 'pending' ? 'bg-blue-600' : 'bg-green-600';
					return (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
								activeTab === tab
									? 'bg-white text-gray-800 shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							}`}
						>
							{tab === 'pending' ? strings.tabPending : strings.tabConfirmed}
							{count > 0 && (
								<span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${badgeColor}`}>
									{count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Tab body */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === 'pending' && (
					suggestions.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
							<FaUserCircle className="text-3xl text-gray-300" />
							<p className="text-sm text-gray-400">{strings.noRecognized}</p>
						</div>
					) : (
						<ul className="flex flex-col gap-2">
							{suggestions.map(card => (
								<li key={card.identity} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
									<UserAvatar user={card.user} />
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-gray-800">
											{card.user.firstName} {card.user.lastName}
										</p>
										<div className="mt-0.5 flex items-center gap-1.5">
											<span className="text-xs text-gray-400">{strings.confidenceLabel}</span>
											<ConfidenceBadge value={card.confidence} />
										</div>
									</div>
									<div className="flex shrink-0 gap-1.5">
										<button onClick={() => handleConfirm(card)} disabled={!eventId || statusMutation.isPending}
											title={strings.confirmButton}
											className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-40">
											<FaCheck className="text-sm" />
										</button>
										<button onClick={() => handleDismiss(card)} title={strings.dismissButton}
											className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200">
											<FaTimes className="text-sm" />
										</button>
									</div>
								</li>
							))}
						</ul>
					)
				)}

				{activeTab === 'confirmed' && (
					confirmed.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
							<FaShieldAlt className="text-3xl text-gray-300" />
							<p className="text-sm text-gray-400">{strings.noConfirmed}</p>
						</div>
					) : (
						<ul className="flex flex-col gap-2">
							{confirmed.map((user, i) => (
								<li key={`${getEntityId(user)}-${i}`} className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-3">
									<UserAvatar user={user} />
									<div className="min-w-0 flex-1">
										<p className="truncate font-semibold text-gray-800">
											{user.firstName} {user.lastName}
										</p>
										<p className="text-xs text-green-600">Marked safe</p>
									</div>
									<FaShieldAlt className="shrink-0 text-green-500" />
								</li>
							))}
						</ul>
					)
				)}
			</div>
		</>
	);

	/*
	 * IMPORTANT: The video element is NEVER conditionally rendered — removing it
	 * from the DOM detaches the MediaStream. Only the wrapper classes change.
	 *
	 * Normal mode: the outer div fills the full layout height (h-full) so the
	 * camera+panel row can use flex-1 to occupy every remaining pixel.
	 * Fullscreen mode: fixed inset-0 overlay — same video node, just different wrapper.
	 */
	return (
		<div className="flex h-full flex-col gap-3 p-6">
			{/* Page header — covered (not removed) by the fullscreen overlay */}
			<div className="flex shrink-0 items-center justify-between">
				<h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
					<FaCamera className="text-blue-600" /> {strings.title}
				</h1>
				{ongoingEvent ? (
					<span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">{ongoingEvent.title}</span>
				) : (
					<span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">{strings.noEventTitle}</span>
				)}
			</div>

			{!ongoingEvent && (
				<div className="shrink-0 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
					{strings.noEventDesc}
				</div>
			)}

			{/* ── Content: single tree, class-switching only ── */}
			<div className={
				isFullscreen
					? 'fixed inset-0 z-50 flex gap-4 bg-gray-950 p-4'
					: 'flex min-h-0 flex-1 gap-4'
			}>
				{/* ── Camera ── */}
				<div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black shadow-xl">
					<video
						ref={videoRef}
						autoPlay playsInline muted
						className="h-full w-full object-cover"
						style={{ transform: 'scaleX(-1)' }}
					/>

					{/* Face ID overlay — conditionally shown */}
					{showOverlay && <FaceIdOverlay scanning={isScanning} />}

					{/* Hidden capture canvas */}
					<canvas ref={canvasRef} className="hidden" />

					{/* Scanning badge */}
					<div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
						<span className={`h-2 w-2 rounded-full ${isScanning ? 'animate-pulse bg-blue-400' : 'bg-gray-400'}`} />
						<span className="text-xs font-medium text-white">
							{isScanning ? strings.scanning : 'Live'}
						</span>
					</div>

					{/* Control buttons */}
					<CameraControls
						isFullscreen={isFullscreen}
						showOverlay={showOverlay}
						onToggleFullscreen={() => setIsFullscreen(v => !v)}
						onToggleOverlay={() => setShowOverlay(v => !v)}
					/>
				</div>

				{/* ── Side panel ── */}
				<div className={
					isFullscreen
						? 'flex w-80 shrink-0 flex-col overflow-y-auto rounded-2xl bg-white p-4'
						: 'flex w-80 shrink-0 flex-col overflow-hidden'
				}>
					{/* Compact header inside fullscreen panel */}
					{isFullscreen && (
						<div className="mb-3 flex shrink-0 items-center justify-between border-b border-gray-100 pb-3">
							<span className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
								<FaCamera className="text-blue-600" /> {strings.title}
							</span>
							{ongoingEvent ? (
								<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{ongoingEvent.title}</span>
							) : (
								<span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">{strings.noEventTitle}</span>
							)}
						</div>
					)}
					{tabPanel}
				</div>
			</div>

		</div>
	);
};

export default React.memo(CameraPage);
