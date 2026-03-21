import { useCallback, useEffect, useRef } from 'react';

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: {
						client_id: string;
						callback: (response: { credential: string }) => void;
						auto_select?: boolean;
						cancel_on_tap_outside?: boolean;
					}) => void;
					renderButton: (
						parent: HTMLElement,
						options: {
							theme?: 'outline' | 'filled_blue' | 'filled_black';
							size?: 'large' | 'medium' | 'small';
							width?: number;
							text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
							shape?: 'rectangular' | 'pill' | 'circle' | 'square';
							logo_alignment?: 'left' | 'center';
						},
					) => void;
					prompt: () => void;
					cancel: () => void;
				};
			};
		};
	}
}

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GSI_SCRIPT_ID = 'google-gsi-client';

export function useGoogleGSI(
	containerRef: React.RefObject<HTMLDivElement | null>,
	onCredential: (credential: string) => void,
) {
	const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

	const onCredentialRef = useRef(onCredential);
	useEffect(() => {
		onCredentialRef.current = onCredential;
	});

	const initAndRender = useCallback(() => {
		if (!window.google || !containerRef.current) return;

		window.google.accounts.id.initialize({
			client_id: clientId ?? '',
			callback: response => onCredentialRef.current(response.credential),
			cancel_on_tap_outside: false,
		});

		containerRef.current.innerHTML = '';

		const width = Math.min(containerRef.current.offsetWidth || 400, 400);

		window.google.accounts.id.renderButton(containerRef.current, {
			theme: 'outline',
			size: 'large',
			width,
			text: 'continue_with',
			shape: 'rectangular',
			logo_alignment: 'center',
		});
	}, [clientId, containerRef]);

	useEffect(() => {
		if (!clientId) {
			console.warn(
				'[GSI] VITE_GOOGLE_CLIENT_ID is not set. ' + 'Add it to apps/web/.env to enable Google Sign-In.',
			);
			return;
		}

		if (window.google) {
			initAndRender();
			return;
		}

		let script = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
		if (!script) {
			script = document.createElement('script');
			script.id = GSI_SCRIPT_ID;
			script.src = GSI_SCRIPT_URL;
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		}

		const onLoad = () => initAndRender();
		script.addEventListener('load', onLoad);
		return () => script?.removeEventListener('load', onLoad);
	}, [clientId, initAndRender]);
}
