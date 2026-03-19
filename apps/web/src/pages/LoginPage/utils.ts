import { CONSTS } from './consts';

export const getSavedCredentials = () => {
	const savedCredsStr = localStorage.getItem(CONSTS.credStorageKey);
	return savedCredsStr ? JSON.parse(savedCredsStr) : { email: '', password: '' };
};

export const saveCredentials = (email?: string, password?: string) => {
	if (email && password) {
		localStorage.setItem(CONSTS.credStorageKey, JSON.stringify({ email, password }));
	}
};

export const extractErrorMessage = (err: unknown, fallback: string): string => {
	if (err && typeof err === 'object' && 'response' in err) {
		const errorObj = err as { response?: { data?: { message?: string } } };
		if (errorObj?.response?.data?.message) {
			return errorObj.response.data.message;
		}
	}
	return fallback;
};
