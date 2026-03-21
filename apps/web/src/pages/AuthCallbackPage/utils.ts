import { api } from 'services/api';
import { User } from '@emergensee/shared';
import * as consts from './consts';

export const fetchUserProfile = async (accessToken: string): Promise<User> => {
	const res = await api.get<User>(consts.meOauthApiEndpoint, {
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
		accessToken: params.get(consts.accessTokenParam),
		refreshToken: params.get(consts.refreshTokenParam),
	};
};
