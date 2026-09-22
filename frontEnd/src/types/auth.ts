export type UserRole =
  | 'PATIENT'
  | 'ASHA'
  | 'DOCTOR'
  | 'FACILITY_STAFF'
  | 'HOSPITAL_ADMIN'
  | 'DISTRICT_ADMIN'
  | 'SUPER_ADMIN';

export type StaffSubType =
  | 'REGISTRATION_CLERK'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'FACILITY_OPERATIONS'
  | 'NURSE';

export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  phone: string;
  role: UserRole;
  staffSubType?: StaffSubType;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  facilityId?: string;
  facilityName?: string;
  districtId?: string;
  district?: string;
  avatar?: string;
  abhaId?: string;
  gender?: 'M' | 'F' | 'Other';
  age?: number;
  permissions?: string[];
  designation?: string;
  qualification?: string;
  specialty?: string;
  licenseNumber?: string;
  employeeId?: string;
  bio?: string;
  address?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  identifier: string; // phone or email/username
  password?: string;
  role?: UserRole;
  staffSubType?: StaffSubType;
}

export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}
