import { useNavigate } from 'react-router-dom';
import { FiShield, FiCamera } from 'react-icons/fi';
import { MdWavingHand } from 'react-icons/md';
import { useAuthStore } from 'store/authStore';
import { Button } from '@/components/ui';

export default function LandingPage() {
	const navigate = useNavigate();
	const user = useAuthStore(state => state.user);
	const firstName = user?.firstName ?? 'there';

	return (
		<div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
				<MdWavingHand className="text-4xl" />
			</div>

			<h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
				Hey {firstName}, you're all set!
			</h1>
			<p className="mt-2 max-w-sm text-sm text-gray-500">
				Welcome to EmergenSee. In an emergency, find the nearest shelter near you, or stand in front of a camera to scan your face and confirm you're safe.
			</p>

			<div className="mt-8 flex w-full max-w-xs flex-col gap-3">
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
