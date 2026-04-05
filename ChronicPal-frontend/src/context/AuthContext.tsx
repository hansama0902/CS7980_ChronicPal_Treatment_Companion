import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, AuthCredentials } from '../types/auth';
import { authApi, setAccessToken } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; user: AuthUser; accessToken: string }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return { user: action.user, accessToken: action.accessToken, isLoading: false };
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false };
    case 'LOGOUT':
      return { user: null, accessToken: null, isLoading: false };
  }
}

interface AuthContextValue extends AuthState {
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
  });

  const login = async (credentials: AuthCredentials): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    const { user, accessToken } = await authApi.login(credentials);
    setAccessToken(accessToken);
    dispatch({ type: 'AUTH_SUCCESS', user, accessToken });
  };

  const register = async (credentials: AuthCredentials): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    const { user, accessToken } = await authApi.register(credentials);
    setAccessToken(accessToken);
    dispatch({ type: 'AUTH_SUCCESS', user, accessToken });
  };

  const logout = (): void => {
    setAccessToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
