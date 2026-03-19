import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';
import { MdErrorOutline, MdArrowBack } from 'react-icons/md';
import * as utils from './utils';
import * as strings from './strings';
import * as consts from './consts';

const AuthCallbackPage: React.FC = () => {
	const navigate = useNavigate();
	const setAuth = useAuthStore(state => state.setAuth);
	const updateToken = useAuthStore(state => state.updateToken);
	const [error, setError] = useState<string | null>(null);

	const handleAuth = useCallback(async () => {
		const { accessToken, refreshToken } = utils.getAuthTokensFromUrl();

		if (!accessToken || !refreshToken) {
			setError(strings.authFailed);
			return;
		}

		updateToken(accessToken);

		try {
			const user = await utils.fetchUserProfile(accessToken);
			setAuth(user, accessToken, refreshToken);
			navigate(consts.dashboardRoute, { replace: true });
		} catch (err) {
			setError(strings.profileLoadFailed);
		}
	}, [navigate, setAuth, updateToken]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void handleAuth();
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [handleAuth]);

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-100">
				<div className="ui-card flex w-full max-w-sm flex-col items-center p-8 text-center">
					<MdErrorOutline className="text-4xl text-red-600" />
					<p className="mb-4 mt-2 text-center text-red-600">{error}</p>
					<a href={consts.loginRoute} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
						<MdArrowBack /> {strings.backToLogin}
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-100">
			<div className="text-center">
				<div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
				<p className="text-sm text-gray-600">{strings.signingIn}</p>
			</div>
		</div>
	);
};

export default React.memo(AuthCallbackPage);
