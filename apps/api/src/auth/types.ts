export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface TherapistInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clinicId: string;
}

export interface ValidatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest {
  user: ValidatedUser;
}
