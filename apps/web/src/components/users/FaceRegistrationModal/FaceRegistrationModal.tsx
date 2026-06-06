import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FiCamera, FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';
import { User } from '@emergensee/shared';
import { Button } from '@/components/ui';
import { useFaceRegistrationMutation } from 'hooks/data/useUsersPageData';
import * as strings from 'pages/UsersPage/strings';

interface FaceRegistrationModalProps {
	user: User;
	onClose: () => void;
}

type Step = 'camera' | 'preview' | 'success';

export const FaceRegistrationModal = ({ user, onClose }: FaceRegistrationModalProps) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const [step, setStep] = useState<Step>('camera');
	const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);

	const mutation = useFaceRegistrationMutation(() => {
		toast.success(strings.faceRegistered);
		setStep('success');
	});

	// Start camera on mount
	useEffect(() => {
		let cancelled = false;
		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
			.then(stream => {
				if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
				streamRef.current = stream;
				if (videoRef.current) videoRef.current.srcObject = stream;
			})
			.catch(() => {
				if (!cancelled) setCameraError('Camera access denied. Please allow camera permissions and try again.');
			});

		return () => {
			cancelled = true;
			streamRef.current?.getTracks().forEach(t => t.stop());
		};
	}, []);

	// Clean up preview URL when component unmounts
	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const handleCapture = useCallback(() => {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas) return;

		canvas.width = video.videoWidth || 640;
		canvas.height = video.videoHeight || 480;
		canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);

		canvas.toBlob(blob => {
			if (!blob) return;
			setCapturedBlob(blob);
			const url = URL.createObjectURL(blob);
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			setPreviewUrl(url);
			// Stop camera stream to save resources during preview
			streamRef.current?.getTracks().forEach(t => t.stop());
			setStep('preview');
		}, 'image/jpeg', 0.92);
	}, [previewUrl]);

	const handleRetake = useCallback(() => {
		setCapturedBlob(null);
		if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
		setStep('camera');
		// Restart camera
		navigator.mediaDevices
			.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
			.then(stream => {
				streamRef.current = stream;
				if (videoRef.current) videoRef.current.srcObject = stream;
				setCameraError(null);
			})
			.catch(() => setCameraError('Camera access denied.'));
	}, [previewUrl]);

	const handleRegister = useCallback(() => {
		if (!capturedBlob) return;
		mutation.mutate({ user, blob: capturedBlob });
	}, [capturedBlob, mutation, user]);

	const userName = `${user.firstName} ${user.lastName}`;

	return (
		<div className="ui-modal-root" role="dialog" aria-modal="true">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" aria-hidden="true" onClick={step !== 'success' ? onClose : undefined} />
				<span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

				<div className="ui-modal-panel ui-modal-panel-md inline-block align-bottom sm:align-middle">
					{/* Header */}
					<div className="ui-modal-header flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">{strings.actionRegisterFace}</h2>
							<p className="mt-0.5 text-sm text-gray-500">{userName}</p>
						</div>
						<button
							onClick={onClose}
							className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						>
							<FiX size={20} />
						</button>
					</div>

					{/* Body */}
					<div className="px-6 py-4">
						{step === 'success' ? (
							<div className="flex flex-col items-center gap-4 py-6 text-center">
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
									<FiCheck className="text-3xl text-green-600" />
								</div>
								<div>
									<p className="text-base font-semibold text-gray-900">Face registered!</p>
									<p className="mt-1 text-sm text-gray-500">
										{userName} can now be recognized by the camera system.
									</p>
								</div>
								<Button variant="primary" size="md" onClick={onClose}>
									Done
								</Button>
							</div>
						) : (
							<>
								{/* Camera / Preview area */}
								<div className="relative overflow-hidden rounded-xl bg-gray-900" style={{ aspectRatio: '4/3' }}>
									{/* Live video — always in DOM so stream can be re-attached */}
									<video
										ref={videoRef}
										autoPlay
										playsInline
										muted
										className={`h-full w-full object-cover ${step === 'preview' ? 'hidden' : ''}`}
									/>

									{/* Captured preview */}
									{step === 'preview' && previewUrl && (
										<img
											src={previewUrl}
											alt="Captured face"
											className="h-full w-full object-cover"
										/>
									)}

									{/* Camera error overlay */}
									{cameraError && step === 'camera' && (
										<div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 p-4 text-center text-sm text-white">
											{cameraError}
										</div>
									)}

									{/* Face guide overlay (camera step only) */}
									{step === 'camera' && !cameraError && (
										<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
											<div className="h-48 w-36 rounded-full border-2 border-dashed border-white/50" />
										</div>
									)}
								</div>

								{/* Hidden canvas for capture */}
								<canvas ref={canvasRef} className="hidden" />

								{/* Instruction */}
								<p className="mt-3 text-center text-sm text-gray-500">
									{step === 'camera'
										? 'Position face within the guide, then click Capture.'
										: 'Looks good? Click Register — or Retake to try again.'}
								</p>
							</>
						)}
					</div>

					{/* Footer buttons */}
					{step !== 'success' && (
						<div className="ui-modal-footer">
							{step === 'camera' ? (
								<>
									<Button
										variant="primary"
										size="md"
										onClick={handleCapture}
										disabled={!!cameraError}
										className="flex items-center gap-2"
									>
										<FiCamera size={16} />
										Capture
									</Button>
									<Button variant="secondary" size="md" onClick={onClose} className="sm:mr-auto">
										Cancel
									</Button>
								</>
							) : (
								<>
									<Button
										variant="primary"
										size="md"
										onClick={handleRegister}
										disabled={mutation.isPending}
										className="flex items-center gap-2"
									>
										{mutation.isPending ? (
											<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
										) : (
											<FiCheck size={16} />
										)}
										{mutation.isPending ? 'Registering…' : 'Register'}
									</Button>
									<Button
										variant="secondary"
										size="md"
										onClick={handleRetake}
										disabled={mutation.isPending}
										className="flex items-center gap-2"
									>
										<FiRefreshCw size={14} />
										Retake
									</Button>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
