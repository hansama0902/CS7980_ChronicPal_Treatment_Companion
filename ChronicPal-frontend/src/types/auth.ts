export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
