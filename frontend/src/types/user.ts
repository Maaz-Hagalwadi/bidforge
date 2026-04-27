import type { Role } from './auth';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  profileImageUrl?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  profileImageUrl?: string;
}
