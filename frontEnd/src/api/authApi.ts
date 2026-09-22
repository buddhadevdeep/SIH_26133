import { apiRequest } from './client';
import { AuthResponse, LoginCredentials, SendOtpRequest, VerifyOtpRequest, User } from '@/types/auth';

export const authApi = {
  sendPatientOtp: (data: SendOtpRequest) =>
    apiRequest<{ phone: string }>('/auth/patient/send-otp', 'POST', data),

  verifyPatientOtp: (data: VerifyOtpRequest) =>
    apiRequest<AuthResponse>('/auth/patient/verify-otp', 'POST', data),

  login: (credentials: LoginCredentials) =>
    apiRequest<AuthResponse>('/auth/login', 'POST', credentials),

  getCurrentUser: () =>
    apiRequest<User>('/auth/me', 'GET'),

  updateProfile: (data: Partial<User>) =>
    apiRequest<User>('/auth/profile', 'PUT', data),

  updatePatient: (id: string, data: Partial<User>) =>
    apiRequest<User>(`/auth/patients/${id}`, 'PUT', data),

  logout: () =>
    apiRequest<{ message: string }>('/auth/logout', 'POST'),
};
