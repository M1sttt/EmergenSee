import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';
import { MdErrorOutline, MdArrowBack } from 'react-icons/md';
import { fetchUserProfile, getAuthTokensFromUrl } from './utils';
import { strings } from './strings';
import { ROUTES, CLASSES } from './consts';

const AuthCallbackPage: React.FC = () => {
	const navigate = useNavigate();
	const setAuth = useAuthStore(state => state.setAuth);
	const updateToken = useAuthStore(state => state.updateToken);
	const [error, setError] = useState<string | null>(null);

	const handleAuth = useCallback(async () => {
		const { accessToken, refreshToken } = getAuthTokensFromUrl();

		if (!accessToken || !refreshToken) {
			setError(strings.authFailed);
			return;
		}

		updateToken(accessToken);

		try {
			const user = await fetchUserProfile(accessToken);
			setAuth(user, accessToken, refreshToken);
			navigate(ROUTES.DASHBOARD, { replace: true });
		} catch (err) {
			setError(strings.profileLoadFailed);
		}
	}, [navigate, setAuth, updateToken]);

	useEffect(() => {
		handleAuth();
	}, [handleAuth]);

	const errorContainerClasses = useMemo(() => CLASSES.MAIN_CONTAINER, []);
	const errorCardClasses = useMemo(() => CLASSES.ERROR_CARD, []);
	const errorTextClasses = useMemo(() => CLASSES.ERROR_TEXT, []);
	const backToLoginClasses = useMemo(() => CLASSES.BACK_LINK, []);
	const loadingContainerClasses = useMemo(() => CLASSES.MAIN_CONTAINER, []);
	const loadingWrapperClasses = useMemo(() => CLASSES.LOADING_WRAPPER, []);
	const loadingSpinnerClasses = useMemo(() => CLASSES.LOADING_SPINNER, []);
	const loadingTextClasses = useMemo(() => CLASSES.LOADING_TEXT, []);
	const errorIconClasses = useMemo(() => CLASSES.ERROR_ICON, []);

	if (error) {
		return (
			<div className={errorContainerClasses}>
				<div className={errorCardClasses}>
					<MdErrorOutline className={errorIconClasses} />
					<p className={errorTextClasses}>{error}</p>
					<a href={ROUTES.LOGIN} className={backToLoginClasses}>
						<MdArrowBack /> {strings.backToLogin}
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className={loadingContainerClasses}>
			<div className={loadingWrapperClasses}>
				<div className={loadingSpinnerClasses} />
				<p className={loadingTextClasses}>{strings.signingIn}</p>
			</div>
		</div>
	);
};

export default React.memo(AuthCallbackPage);
