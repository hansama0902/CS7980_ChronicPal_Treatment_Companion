import axios from 'axios';
import type { AuthCredentials, AuthResponse } from '../types/auth';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  withCredentials: true,
});

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

instance.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

export const authApi = {
  register: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const { data } = await instance.post<{ success: boolean; data: AuthResponse }>(
      '/api/auth/register',
      credentials,
    );
    return data.data;
  },

  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const { data } = await instance.post<{ success: boolean; data: AuthResponse }>(
      '/api/auth/login',
      credentials,
    );
    return data.data;
  },
};

export default instance;
