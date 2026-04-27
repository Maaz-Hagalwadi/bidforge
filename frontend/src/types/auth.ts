export type Role = 'CLIENT' | 'FREELANCER';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errors?: string[];
}
