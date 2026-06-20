import { useNavigate } from 'react-router-dom';
import { FiShield, FiCamera } from 'react-icons/fi';
import { MdWavingHand, MdFaceUnlock } from 'react-icons/md';
import { useAuthStore } from 'store/authStore';
import { Button } from '@/components/ui';

export default function LandingPage() {
	const navigate = useNavigate();
	const user = useAuthStore(state => state.user);
	const firstName = user?.firstName ?? 'there';
	const hasFace = !!user?.faceIdentity;

	return (
		<div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
				<MdWavingHand className="text-4xl" />
			</div>

			<h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
				Hey {firstName}, you&apos;re all set!
			</h1>
			<p className="mt-2 max-w-sm text-sm text-gray-500">
				Welcome to EmergenSee. In an emergency, find the nearest shelter near you, or stand in front of a camera to scan your face and confirm you&apos;re safe.
			</p>

			{!hasFace && (
				<div className="mt-6 w-full max-w-xs rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
					<div className="flex items-start gap-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
							<MdFaceUnlock className="text-xl" />
						</div>
						<div>
							<p className="text-sm font-semibold text-amber-800">Register your face</p>
							<p className="mt-0.5 text-xs text-amber-600">
								Without face registration, cameras won&apos;t be able to automatically confirm you&apos;re safe during an emergency.
							</p>
						</div>
					</div>
					<button
						onClick={() => navigate('/register-face')}
						className="mt-3 w-full rounded-xl bg-amber-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 active:scale-95"
					>
						Register now
					</button>
				</div>
			)}

			<div className="mt-6 flex w-full max-w-xs flex-col gap-3">
				<Button
					variant="primary"
					size="lg"
					className="w-full rounded-xl"
					onClick={() => navigate('/shelters')}
				>
					<FiShield className="text-lg" />
					Find nearest shelter
				</Button>
				<Button
					variant="secondary"
					size="md"
					className="w-full rounded-xl"
					onClick={() => navigate('/camera')}
				>
					<FiCamera className="text-base" />
					Scan my face
				</Button>
			</div>
		</div>
	);
}
