import { api } from './api';
import { LoginDto, AuthResponse, RegisterDto } from '@emergensee/shared';

export const authService = {
	login: async (data: LoginDto): Promise<AuthResponse> => {
		const response = await api.post<AuthResponse>('/auth/login', data);
		return response.data;
	},

	register: async (data: RegisterDto): Promise<AuthResponse> => {
		const response = await api.post<AuthResponse>('/auth/register', data);
		return response.data;
	},

	loginWithGoogleToken: async (credential: string): Promise<AuthResponse> => {
		const response = await api.post<AuthResponse>('/auth/google/token', { credential });
		return response.data;
	},

	logout: () => {
		localStorage.removeItem('auth-storage');
		window.location.href = '/login';
	},
};
