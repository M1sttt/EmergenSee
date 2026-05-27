import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useAuthStore } from 'store/authStore';
import { faceRecognitionService } from 'services/faceRecognitionService';
import { Button } from '@/components/ui';
import { FaArrowLeft, FaCamera, FaCheck, FaRedo } from 'react-icons/fa';
import { MdFaceUnlock } from 'react-icons/md';
import * as consts from './consts';
import type { FaceStatus, RegistrationPhase } from './consts';
import * as strings from './strings';
import { estimateHeadTurn, getPhaseNumber, isCapturingPhase, isPoseValidForPhase } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// SVG overlay — oval border colour reflects face detection state
// ─────────────────────────────────────────────────────────────────────────────

interface RegistrationOverlayProps {
	phase: RegistrationPhase;
	faceStatus: FaceStatus;
	progress: number; // 0–1
}

function RegistrationOverlay({ phase, faceStatus, progress }: RegistrationOverlayProps) {
	const isSuccess = phase === 'success';
	const scanning = faceStatus === 'capturing';

	const ovalColor =
		isSuccess
			? 'rgba(52,211,153,0.9)'
			: faceStatus === 'capturing'
			? 'rgba(99,179,237,0.85)'
			: faceStatus === 'detected'
			? 'rgba(255,255,255,0.65)'
			: 'rgba(251,146,60,0.7)'; // no face → amber

	const ringColor = isSuccess ? 'rgba(52,211,153,0.9)' : 'rgba(99,179,237,0.9)';
	const dashOffset = consts.RING_CIRCUMFERENCE * (1 - Math.min(1, progress));

	return (
		<svg
			viewBox="0 0 160 90"
			preserveAspectRatio="xMidYMid slice"
			xmlns="http://www.w3.org/2000/svg"
			className="pointer-events-none absolute inset-0 h-full w-full"
		>
			<defs>
				<mask id="regMask">
					<rect width="160" height="90" fill="white" />
					<ellipse cx="80" cy="45" rx="28" ry="37" fill="black" />
				</mask>
				<clipPath id="regOvalClip">
					<ellipse cx="80" cy="45" rx="28" ry="37" />
				</clipPath>
				<linearGradient id="regScanGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="rgba(99,179,237,0)" />
					<stop offset="50%" stopColor="rgba(99,179,237,0.65)" />
					<stop offset="100%" stopColor="rgba(99,179,237,0)" />
				</linearGradient>
			</defs>

			<rect width="160" height="90" fill="rgba(0,0,0,0.52)" mask="url(#regMask)" />

			<ellipse
				cx="80" cy="45" rx="28" ry="37"
				fill="none"
				stroke={ovalColor}
				strokeWidth="1.2"
				style={{ transition: 'stroke 0.3s ease' }}
			/>

			<line x1="80"  y1="5"  x2="80"  y2="9"  stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="80"  y1="81" x2="80"  y2="85" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="49"  y1="45" x2="53"  y2="45" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
			<line x1="107" y1="45" x2="111" y2="45" stroke="white" strokeWidth="1.4" strokeLinecap="round" />

			{progress > 0 && (
				<circle
					cx="80" cy="45" r={consts.RING_RADIUS}
					fill="none"
					stroke={ringColor}
					strokeWidth="2.5"
					strokeDasharray={consts.RING_CIRCUMFERENCE}
					strokeDashoffset={dashOffset}
					strokeLinecap="round"
					transform="rotate(-90 80 45)"
					style={{ transition: 'stroke-dashoffset 0.2s ease-out' }}
				/>
			)}

			{scanning && (
				<rect x="52" y="0" width="56" height="7" fill="url(#regScanGrad)" clipPath="url(#regOvalClip)">
					<animate attributeName="y" from="8" to="75" dur="1.6s" repeatCount="indefinite" />
					<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="1.6s" repeatCount="indefinite" />
				</rect>
			)}
		</svg>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase progress dots
// ─────────────────────────────────────────────────────────────────────────────

function PhaseDots({ phase }: { phase: RegistrationPhase }) {
	const phaseNum = getPhaseNumber(phase);
	const allDone = phase === 'submitting' || phase === 'success' || phase === 'error';
	return (
		<div className="flex items-center gap-3">
			{[1, 2, 3].map(n => {
				const completed = allDone || (phaseNum !== null && n < phaseNum);
				const active = phaseNum === n;
				return (
					<div
						key={n}
						className={`rounded-full transition-all duration-300 ${
							completed
								? 'h-2.5 w-2.5 bg-green-500'
								: active
								? 'h-3 w-3 animate-pulse bg-blue-500'
								: 'h-2.5 w-2.5 bg-gray-300'
						}`}
					/>
				);
			})}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

const FaceRegistrationPage: React.FC = () => {
	const navigate = useNavigate();
	const user = useAuthStore(state => state.user);

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const landmarkerRef = useRef<FaceLandmarker | null>(null);
	const framesRef = useRef<Blob[]>([]);
	const phaseFrameCountRef = useRef(0);
	const isDetectingRef = useRef(false);
	const isCapturingRef = useRef(false);
	const isMountedRef = useRef(true);
	// Ref copy of phase so the setInterval closure never goes stale
	const phaseRef = useRef<RegistrationPhase>('loading');

	const [phase, setPhase] = useState<RegistrationPhase>('loading');
	const [faceStatus, setFaceStatus] = useState<FaceStatus>('none');
	const [totalFrameCount, setTotalFrameCount] = useState(0);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		isMountedRef.current = true;
		return () => { isMountedRef.current = false; };
	}, []);

	// Keep phaseRef in sync so setInterval callbacks always read the latest phase
	useEffect(() => { phaseRef.current = phase; }, [phase]);

	// Camera
	useEffect(() => {
		let stream: MediaStream | null = null;
		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
			.then(s => {
				stream = s;
				if (videoRef.current) videoRef.current.srcObject = s;
			})
			.catch(() => setCameraError(strings.cameraErrorMessage));
		return () => stream?.getTracks().forEach(t => t.stop());
	}, []);

	// Load MediaPipe FaceLandmarker
	useEffect(() => {
		const load = async () => {
			const vision = await FilesetResolver.forVisionTasks(consts.MEDIAPIPE_WASM_URL);
			const lm = await FaceLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: consts.FACE_LANDMARKER_MODEL_URL,
					delegate: 'GPU',
				},
				runningMode: 'VIDEO',
				numFaces: 1,
				minFaceDetectionConfidence: consts.MIN_FACE_CONFIDENCE,
				minFacePresenceConfidence: consts.MIN_FACE_CONFIDENCE,
				minTrackingConfidence: 0.5,
			});
			landmarkerRef.current = lm;
			if (isMountedRef.current) setPhase('phase1');
		};

		load().catch(() => {
			if (isMountedRef.current) {
				setErrorMessage(strings.modelLoadError);
				setPhase('error');
			}
		});

		return () => { landmarkerRef.current?.close(); };
	}, []);

	const advancePhase = useCallback(() => {
		if (!isMountedRef.current) return;
		setFaceStatus('none');
		setPhase(prev => {
			if (prev === 'phase1') return 'phase2';
			if (prev === 'phase2') return 'phase3';
			if (prev === 'phase3') return 'submitting';
			return prev;
		});
	}, []);

	// Core detect-and-capture tick — called by setInterval, reads phase from ref
	const detectAndCapture = useCallback(async () => {
		const currentPhase = phaseRef.current;
		if (!isCapturingPhase(currentPhase)) return;
		if (phaseFrameCountRef.current >= consts.FRAMES_PER_PHASE) return;
		if (isDetectingRef.current || isCapturingRef.current) return;

		const video = videoRef.current;
		const lm = landmarkerRef.current;
		if (!video || !lm || video.readyState < video.HAVE_CURRENT_DATA) {
			setFaceStatus('none');
			return;
		}

		isDetectingRef.current = true;
		let faceFound = false;
		let poseOk = false;

		try {
			const result = lm.detectForVideo(video, performance.now());
			faceFound = result.faceLandmarks.length > 0;
			if (faceFound) {
				const turn = estimateHeadTurn(result.faceLandmarks[0]);
				poseOk = isPoseValidForPhase(turn, currentPhase);
			}
		} catch {
			// skip frame on detection error
		}

		isDetectingRef.current = false;

		if (!faceFound) { setFaceStatus('none'); return; }
		if (!poseOk)    { setFaceStatus('detected'); return; }

		// Correct pose — capture
		setFaceStatus('capturing');
		isCapturingRef.current = true;

		const canvas = canvasRef.current;
		if (canvas) {
			canvas.width = video.videoWidth || 640;
			canvas.height = video.videoHeight || 480;
			canvas.getContext('2d')?.drawImage(video, 0, 0);
			const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85));
			if (blob && isMountedRef.current) {
				framesRef.current.push(blob);
				phaseFrameCountRef.current += 1;
				setTotalFrameCount(c => c + 1);
				if (phaseFrameCountRef.current >= consts.FRAMES_PER_PHASE) {
					isCapturingRef.current = false;
					setTimeout(advancePhase, consts.PHASE_COMPLETE_DELAY_MS);
					return;
				}
			}
		}

		isCapturingRef.current = false;
	}, [advancePhase]);

	// Detection loop — restarts on each phase transition
	useEffect(() => {
		if (!isCapturingPhase(phase)) return;
		phaseFrameCountRef.current = 0;
		const interval = setInterval(detectAndCapture, consts.DETECTION_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [phase, detectAndCapture]);

	// Submit batch once all phases complete
	useEffect(() => {
		if (phase !== 'submitting') return;
		const submit = async () => {
			if (!user) return;
			try {
				await faceRecognitionService.registerBatch(user.id, framesRef.current);
				if (isMountedRef.current) setPhase('success');
			} catch (err) {
				if (isMountedRef.current) {
					setErrorMessage(err instanceof Error ? err.message : strings.defaultError);
					setPhase('error');
				}
			}
		};
		submit();
	}, [phase, user]);

	const handleRetry = useCallback(() => {
		framesRef.current = [];
		phaseFrameCountRef.current = 0;
		setTotalFrameCount(0);
		setFaceStatus('none');
		setErrorMessage(null);
		setPhase('phase1');
	}, []);

	if (cameraError) {
		return (
			<div className="ui-page flex flex-col items-center justify-center gap-4 text-center">
				<FaCamera className="text-5xl text-gray-300" />
				<p className="font-medium text-red-600">{cameraError}</p>
				<Button variant="secondary" onClick={() => navigate(-1)}>
					<FaArrowLeft /> Back
				</Button>
			</div>
		);
	}

	const progress = totalFrameCount / consts.TOTAL_FRAMES;

	const instructionText = (() => {
		switch (phase) {
			case 'loading':    return strings.loadingInstruction;
			case 'phase1':     return strings.phase1Instruction;
			case 'phase2':     return strings.phase2Instruction;
			case 'phase3':     return strings.phase3Instruction;
			case 'submitting': return strings.submittingInstruction;
			case 'success':    return strings.successSubtitle;
			case 'error':      return errorMessage ?? strings.defaultError;
		}
	})();

	const hintText = (() => {
		if (!isCapturingPhase(phase)) return null;
		if (faceStatus === 'none')     return strings.noFaceHint;
		if (faceStatus === 'detected') return strings.wrongPoseHint;
		return strings.frameCounter(totalFrameCount, consts.TOTAL_FRAMES);
	})();

	return (
		<div className="flex h-full flex-col gap-4 p-6">
			{/* Header */}
			<div className="flex shrink-0 items-center gap-3">
				<button
					onClick={() => navigate(-1)}
					className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
				>
					<FaArrowLeft />
				</button>
				<h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
					<MdFaceUnlock className="text-blue-600" />
					{strings.pageTitle}
				</h1>
			</div>

			{/* Camera feed */}
			<div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black shadow-xl">
				{/*
				 * The video is never conditionally unmounted — removing it detaches the MediaStream.
				 * display:none is used for the loading phase so the video is still active.
				 */}
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className={`h-full w-full object-cover ${phase === 'loading' ? 'invisible' : ''}`}
					style={{ transform: 'scaleX(-1)' }}
				/>

				<RegistrationOverlay phase={phase} faceStatus={faceStatus} progress={progress} />
				<canvas ref={canvasRef} className="hidden" />

				{/* Loading overlay */}
				{phase === 'loading' && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950">
						<div className="flex gap-1.5">
							<span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
							<span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
							<span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
						</div>
						<p className="text-sm font-medium text-gray-400">{strings.loadingInstruction}</p>
					</div>
				)}

				{/* Success overlay */}
				{phase === 'success' && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="flex flex-col items-center gap-3">
							<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/90 text-white shadow-lg backdrop-blur-sm">
								<FaCheck className="text-2xl" />
							</div>
							<p className="rounded-full bg-black/50 px-4 py-1.5 text-sm font-semibold text-green-300 backdrop-blur-sm">
								{strings.successTitle}
							</p>
						</div>
					</div>
				)}

				{/* Live status badge */}
				{isCapturingPhase(phase) && (
					<div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
						<span
							className={`h-2 w-2 rounded-full ${
								faceStatus === 'capturing' ? 'animate-pulse bg-blue-400' :
								faceStatus === 'detected'  ? 'bg-yellow-400' :
								'bg-gray-500'
							}`}
						/>
						<span className="text-xs font-medium text-white">
							{faceStatus === 'capturing' ? 'Capturing…' : faceStatus === 'detected' ? 'Adjust position' : 'No face'}
						</span>
					</div>
				)}
			</div>

			{/* Instructions + phase dots */}
			<div className="flex shrink-0 flex-col items-center gap-3 pb-2">
				<PhaseDots phase={phase} />

				<div className="text-center">
					<p className={`text-base font-medium ${
						phase === 'success' ? 'text-green-700' :
						phase === 'error'   ? 'text-red-600'   :
						'text-gray-700'
					}`}>
						{instructionText}
					</p>
					{hintText && (
						<p className={`mt-1 text-sm ${
							faceStatus === 'none'     ? 'text-amber-500' :
							faceStatus === 'detected' ? 'text-gray-400'  :
							'text-blue-500'
						}`}>
							{hintText}
						</p>
					)}
					{phase === 'submitting' && (
						<div className="mt-2 flex items-center justify-center gap-1.5">
							<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
							<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
							<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
						</div>
					)}
				</div>

				{phase === 'success' && (
					<Button variant="primary" size="md" onClick={() => navigate(-1)}>
						<FaCheck />
						{strings.doneButton}
					</Button>
				)}
				{phase === 'error' && (
					<Button variant="secondary" size="md" onClick={handleRetry}>
						<FaRedo />
						{strings.retryButton}
					</Button>
				)}
			</div>
		</div>
	);
};

export default React.memo(FaceRegistrationPage);
