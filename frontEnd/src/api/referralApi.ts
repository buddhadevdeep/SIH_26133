import { apiRequest } from './client';
import { Referral, CreateReferralRequest } from '@/types/referral';

export const referralApi = {
  getAll: (params?: {
    facilityId?: string;
    toFacilityId?: string;
    fromFacilityId?: string;
    fromDoctorId?: string;
    patientId?: string;
    status?: string;
    priority?: string;
  }) => apiRequest<Referral[]>('/referrals', 'GET', params),

  getById: (id: string) =>
    apiRequest<Referral>(`/referrals/${id}`, 'GET'),

  create: (data: CreateReferralRequest) =>
    apiRequest<Referral>('/referrals', 'POST', data),

  markUnderReview: (id: string) =>
    apiRequest<Referral>(`/referrals/${id}/review`, 'POST'),

  accept: (id: string, appointmentSlot?: string, appointmentId?: string) =>
    apiRequest<Referral>(`/referrals/${id}/accept`, 'POST', { appointmentSlot, appointmentId }),

  reject: (id: string, reason: string) =>
    apiRequest<Referral>(`/referrals/${id}/reject`, 'POST', { reason }),

  requestClarification: (id: string, message: string) =>
    apiRequest<Referral>(`/referrals/${id}/clarification-request`, 'POST', { message }),

  respondClarification: (id: string, message: string) =>
    apiRequest<Referral>(`/referrals/${id}/clarification-response`, 'POST', { message }),

  confirmArrival: (id: string) =>
    apiRequest<Referral>(`/referrals/${id}/confirm-arrival`, 'POST'),

  recordOutcome: (id: string, outcomeNotes: string, consultedDoctorName?: string, consultedDoctorSpecialty?: string) =>
    apiRequest<Referral>(`/referrals/${id}/outcome`, 'POST', { outcomeNotes, consultedDoctorName, consultedDoctorSpecialty }),

  close: (id: string) =>
    apiRequest<Referral>(`/referrals/${id}/close`, 'POST'),
};
