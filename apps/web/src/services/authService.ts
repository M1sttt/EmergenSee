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

  /**
   * Sends the id_token issued by the GSI button to the backend.
   * The server verifies it with google-auth-library and returns JWTs.
   */
  loginWithGoogleToken: async (credential: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google/token', { credential });
    return response.data;
  },

  logout: () => {
    localStorage.clear();
    window.location.href = '/login';
  },
};
