import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
		handleAuth();
	}, [handleAuth]);

	const errorContainerClasses = useMemo(() => consts.mainContainerClass, []);
	const errorCardClasses = useMemo(() => consts.errorCardClass, []);
	const errorTextClasses = useMemo(() => consts.errorTextClass, []);
	const backToLoginClasses = useMemo(() => consts.backLinkClass, []);
	const loadingContainerClasses = useMemo(() => consts.mainContainerClass, []);
	const loadingWrapperClasses = useMemo(() => consts.loadingWrapperClass, []);
	const loadingSpinnerClasses = useMemo(() => consts.loadingSpinnerClass, []);
	const loadingTextClasses = useMemo(() => consts.loadingTextClass, []);
	const errorIconClasses = useMemo(() => consts.errorIconClass, []);

	if (error) {
		return (
			<div className={errorContainerClasses}>
				<div className={errorCardClasses}>
					<MdErrorOutline className={errorIconClasses} />
					<p className={errorTextClasses}>{error}</p>
					<a href={consts.loginRoute} className={backToLoginClasses}>
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
