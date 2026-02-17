// Auth contracts — login, profile, mobile authentication

import type { Role } from './enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface TherapistProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  clinicId: string;
}

export interface MobileLoginRequest {
  accessCode: string;  // 6-digit PIN
}

export interface MobileLoginResponse {
  accessToken: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
