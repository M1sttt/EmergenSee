import { api } from 'services/api';
import { User } from '@emergensee/shared';
import { PARAMS, API_ENDPOINTS } from './consts';

export const fetchUserProfile = async (accessToken: string): Promise<User> => {
	const res = await api.get<User>(API_ENDPOINTS.MEOAUTH, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	return res.data;
};

export const getAuthTokensFromUrl = (): {
	accessToken: string | null;
	refreshToken: string | null;
} => {
	const params = new URLSearchParams(window.location.search);
	return {
		accessToken: params.get(PARAMS.ACCESS_TOKEN),
		refreshToken: params.get(PARAMS.REFRESH_TOKEN),
	};
};
