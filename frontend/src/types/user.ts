import type { Role } from './auth';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  rating?: number;
  profileImageUrl?: string;
  title?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  skills?: string;
  createdAt?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  profileImageUrl?: string;
  title?: string;
  bio?: string;
  location?: string;
  hourlyRate?: number;
  skills?: string;
}
