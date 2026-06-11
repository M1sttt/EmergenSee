import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventStatus, ResponderStatus, User } from '@emergensee/shared';
import { FaCheck, FaShieldAlt, FaTimes, FaUserCircle, FaCamera } from 'react-icons/fa';
import { MdFaceUnlock } from 'react-icons/md';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'store/authStore';
import { recognizeWithCache } from 'services/faceRecognitionCache';
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

const CAPTURE_INTERVAL_MS = 2000;
const FRAME_INTERVAL_MS = 150;
const MIN_CONFIDENCE = 0.5;

interface SuggestionCard {
	identity: string;
	user: User;
	confidence: number;
}

type Tab = 'pending' | 'confirmed';

function UserAvatar({ user }: { user: User }) {
	const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
	return (
		<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
			{initials || <FaUserCircle className="text-xl text-blue-300" />}
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

function FaceIdOverlay({ scanning }: { scanning: boolean }) {
	return (
		<svg
			viewBox="0 0 160 90"
			preserveAspectRatio="xMidYMid slice"
			xmlns="http://www.w3.org/2000/svg"
			className="pointer-events-none absolute inset-0 h-full w-full"
		>
			<defs>
				<mask id="stationFaceIdMask">
					<rect width="160" height="90" fill="white" />
					<ellipse cx="80" cy="45" rx="28" ry="37" fill="black" />
				</mask>
				<clipPath id="stationOvalClip">
					<ellipse cx="80" cy="45" rx="28" ry="37" />
				</clipPath>
				<linearGradient id="stationScanGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="rgba(99,179,237,0)" />
					<stop offset="50%" stopColor="rgba(99,179,237,0.65)" />
					<stop offset="100%" stopColor="rgba(99,179,237,0)" />
				</linearGradient>
			</defs>
			<rect width="160" height="90" fill="rgba(0,0,0,0.52)" mask="url(#stationFaceIdMask)" />
			<ellipse cx="80" cy="45" rx="28" ry="37" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" />
			<line x1="80" y1="5"   x2="80" y2="9"   stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="80" y1="81"  x2="80" y2="85"  stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="49" y1="45"  x2="53" y2="45"  stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="107" y1="45" x2="111" y2="45" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			{scanning && (
				<rect x="52" y="0" width="56" height="7" fill="url(#stationScanGrad)" clipPath="url(#stationOvalClip)">
					<animate attributeName="y" from="8" to="75" dur="1.6s" repeatCount="indefinite" />
					<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="1.6s" repeatCount="indefinite" />
				</rect>
			)}
		</svg>
	);
}

const CameraStationPage: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const frameCanvasRef = useRef<HTMLCanvasElement>(null);
	const dismissedRef = useRef<Set<string>>(new Set());
	const isCapturingRef = useRef(false);
	const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
	const [activeTab, setActiveTab] = useState<Tab>('pending');
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);
	const [showOverlay, setShowOverlay] = useState(true);

	const queryClient = useQueryClient();
	const currentUser = useAuthStore(state => state.user);
	const { data: users = [] } = useCameraUsersQuery();
	const { data: events = [] } = useCameraEventsQuery();
	const { data: allStatuses = [] } = useCameraStatusQuery();

	const ongoingEvent = events.find(e => e.status === EventStatus.ONGOING);
	const eventId = ongoingEvent?.id ?? (ongoingEvent as { _id?: string } | undefined)?._id;

	const confirmed = useMemo<User[]>(() => {
		if (!eventId || !currentUser) return [];
		return allStatuses
			.filter(s => {
				const sEventId = typeof s.eventId === 'object' ? (s.eventId as { _id?: string })._id : s.eventId;
				return (
					(sEventId === eventId || s.eventId === eventId) &&
					s.status === ResponderStatus.SAFE &&
					s.sourceCamera === currentUser.id
				);
			})
			.map(s => users.find(u => getEntityId(u) === s.userId))
			.filter((u): u is User => u !== undefined);
	}, [allStatuses, eventId, currentUser, users]);

	const statusMutation = useCameraStatusMutation();

	// Pre-populate dismissed set from already-confirmed users
	useEffect(() => {
		confirmed.forEach(u => dismissedRef.current.add(getEntityId(u)));
	}, [confirmed]);

	// Start camera stream
	useEffect(() => {
		let stream: MediaStream | null = null;
		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: 'user' } })
			.then(s => {
				stream = s;
				if (videoRef.current) videoRef.current.srcObject = s;
			})
			.catch(() => setCameraError('Could not access camera. Please allow camera permissions and reload.'));
		return () => stream?.getTracks().forEach(t => t.stop());
	}, []);

	// Announce camera presence via WebSocket
	useEffect(() => {
		if (!currentUser) return;
		websocketService.connect();
		websocketService.emit('camera:join', { userId: currentUser.id, location: currentUser.location || '' });
		return () => {
			websocketService.emit('camera:leave', { userId: currentUser.id });
		};
	}, [currentUser]);

	// Stream frames to admin via WebSocket
	useEffect(() => {
		if (!currentUser) return;
		frameIntervalRef.current = setInterval(() => {
			const video = videoRef.current;
			const fc = frameCanvasRef.current;
			if (!video || !fc || video.readyState < video.HAVE_CURRENT_DATA) return;
			fc.width = 320;
			fc.height = 240;
			fc.getContext('2d')?.drawImage(video, 0, 0, 320, 240);
			const frame = fc.toDataURL('image/jpeg', 0.6);
			websocketService.emit('camera:frame', { cameraUserId: currentUser.id, frame });
		}, FRAME_INTERVAL_MS);
		return () => {
			if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
		};
	}, [currentUser]);

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
			const result = await recognizeWithCache(canvas);
			if (!result) return;

			if (currentUser) {
				websocketService.emit('camera:recognize', { cameraUserId: currentUser.id, results: result.results });
			}

			setSuggestions(prev => {
				const next = [...prev];
				for (const r of result.results) {
					if (!r.identity || r.confidence < MIN_CONFIDENCE) continue;
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
	}, [users, currentUser]);

	useEffect(() => {
		const interval = setInterval(captureAndRecognize, CAPTURE_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [captureAndRecognize]);

	const handleConfirm = useCallback(
		(card: SuggestionCard) => {
			if (!eventId) return;
			dismissedRef.current.add(card.identity);
			setSuggestions(prev => prev.filter(s => s.identity !== card.identity));
			setActiveTab('confirmed');
			statusMutation.mutate(
				{ status: ResponderStatus.SAFE, userId: getEntityId(card.user), eventId, sourceCamera: currentUser?.id },
				{ onSuccess: () => queryClient.invalidateQueries({ queryKey: CAMERA_QUERY_KEYS.status }) },
			);
		},
		[eventId, currentUser, statusMutation, queryClient],
	);

	const handleDismiss = useCallback((card: SuggestionCard) => {
		dismissedRef.current.add(card.identity);
		setSuggestions(prev => prev.filter(s => s.identity !== card.identity));
	}, []);

	if (cameraError) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-950 text-white">
				<div className="flex flex-col items-center gap-3 text-center">
					<FaCamera className="text-5xl text-gray-500" />
					<p className="font-medium text-red-400">{cameraError}</p>
				</div>
			</div>
		);
	}

	const tabPanel = (
		<>
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
							{tab === 'pending' ? 'Pending' : 'Confirmed'}
							{count > 0 && (
								<span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${badgeColor}`}>
									{count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			<div className="flex-1 overflow-y-auto">
				{activeTab === 'pending' && (
					suggestions.length === 0 ? (
						<div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
							<FaUserCircle className="text-3xl text-gray-300" />
							<p className="text-sm text-gray-400">No faces recognized yet. Hold a registered face in view.</p>
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
											<span className="text-xs text-gray-400">Confidence</span>
											<ConfidenceBadge value={card.confidence} />
										</div>
									</div>
									<div className="flex shrink-0 gap-1.5">
										<button
											onClick={() => handleConfirm(card)}
											disabled={!eventId || statusMutation.isPending}
											className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600 disabled:opacity-40"
										>
											<FaCheck className="text-sm" />
										</button>
										<button
											onClick={() => handleDismiss(card)}
											className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
										>
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
							<p className="text-sm text-gray-400">No one confirmed yet.</p>
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

	return (
		<div className="flex h-screen flex-col bg-gray-950">
			{/* Top bar */}
			<div className="flex shrink-0 items-center justify-between border-b border-gray-800 px-5 py-3">
				<div className="flex items-center gap-2">
					<FaCamera className="text-blue-400" />
					<span className="font-bold text-white">EmergenSee</span>
					{currentUser?.location && (
						<span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs text-gray-300">
							{currentUser.location}
						</span>
					)}
				</div>
				{ongoingEvent ? (
					<span className="rounded-full bg-green-900/60 px-3 py-1 text-xs font-semibold text-green-300">{ongoingEvent.title}</span>
				) : (
					<span className="rounded-full bg-yellow-900/60 px-3 py-1 text-xs font-semibold text-yellow-300">No Active Event</span>
				)}
			</div>

			{!ongoingEvent && (
				<div className="shrink-0 border-b border-yellow-800/40 bg-yellow-900/20 px-5 py-2 text-xs text-yellow-400">
					Camera mode requires an ongoing event. Create or activate an event first.
				</div>
			)}

			{/* Content row */}
			<div className="flex min-h-0 flex-1 gap-4 p-4">
				{/* Camera feed */}
				<div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black shadow-xl">
					<video
						ref={videoRef}
						autoPlay playsInline muted
						className="h-full w-full object-cover"
						style={{ transform: 'scaleX(-1)' }}
					/>
					{showOverlay && <FaceIdOverlay scanning={isScanning} />}
					<canvas ref={canvasRef} className="hidden" />
					<canvas ref={frameCanvasRef} className="hidden" />

					<div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
						<span className={`h-2 w-2 rounded-full ${isScanning ? 'animate-pulse bg-blue-400' : 'bg-gray-400'}`} />
						<span className="text-xs font-medium text-white">
							{isScanning ? 'Scanning…' : 'Live'}
						</span>
					</div>

					<button
						onClick={() => setShowOverlay(v => !v)}
						className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
							showOverlay ? 'bg-blue-500/70 text-white hover:bg-blue-500/90' : 'bg-black/50 text-gray-400 hover:bg-black/70'
						}`}
					>
						<MdFaceUnlock className="text-base" />
					</button>
				</div>

				{/* Side panel */}
				<div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-xl">
					{tabPanel}
				</div>
			</div>
		</div>
	);
};

export default React.memo(CameraStationPage);
