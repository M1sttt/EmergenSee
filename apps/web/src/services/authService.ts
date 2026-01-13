import { api } from './api';
import { LoginDto, AuthResponse } from '@emergensee/shared';

export const authService = {
  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: () => {
    // Clear local storage and redirect
    localStorage.clear();
    window.location.href = '/login';
  },
};
