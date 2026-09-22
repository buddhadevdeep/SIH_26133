import { apiRequest } from './client';
import { LiveQueueState, Token, Appointment } from '@/types/queue';

export const queueApi = {
  getLiveQueue: (facilityId: string, departmentId?: string) =>
    apiRequest<LiveQueueState>(`/queues/${facilityId}/live`, 'GET', { departmentId }),

  callNext: (facilityId: string, departmentId: string) =>
    apiRequest<{ calledToken: Token | null; queue: LiveQueueState }>(`/queues/${facilityId}/next`, 'POST', { departmentId }),

  skip: (queueId: string, tokenId: string) =>
    apiRequest<Token>(`/queues/${queueId}/skip`, 'POST', { tokenId }),

  noShow: (queueId: string, tokenId: string) =>
    apiRequest<Token>(`/queues/${queueId}/no-show`, 'POST', { tokenId }),
};

export const tokenApi = {
  generateToken: (data: {
    patientName: string;
    patientPhone: string;
    facilityId: string;
    departmentId: string;
    priority?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    doctorId?: string;
    doctorName?: string;
    roomNumber?: string;
  }) => apiRequest<Token>('/tokens', 'POST', data),

  getById: (tokenId: string) =>
    apiRequest<Token>(`/tokens/${tokenId}`, 'GET'),

  cancelToken: (tokenId: string) =>
    apiRequest<Token>(`/tokens/${tokenId}/cancel`, 'PATCH'),
};

export const appointmentApi = {
  getAll: (patientId?: string, facilityId?: string) =>
    apiRequest<Appointment[]>('/appointments', 'GET', { patientId, facilityId }),

  getById: (appointmentId: string) =>
    apiRequest<Appointment>(`/appointments/${appointmentId}`, 'GET'),

  book: (data: Partial<Appointment>) =>
    apiRequest<Appointment>('/appointments', 'POST', data),

  assignDoctor: (
    appointmentId: string,
    data: {
      doctorId: string;
      doctorName: string;
      specialty?: string;
      roomNumber?: string;
      departmentId?: string;
      departmentName?: string;
    }
  ) => apiRequest<Appointment>(`/appointments/${appointmentId}/assign-doctor`, 'PATCH', data),

  checkIn: (appointmentId: string, data?: { roomNumber?: string; doctorId?: string; doctorName?: string }) =>
    apiRequest<{ appointment: Appointment; token: Token }>(`/appointments/${appointmentId}/check-in`, 'POST', data),

  cancel: (appointmentId: string) =>
    apiRequest<Appointment>(`/appointments/${appointmentId}/cancel`, 'PATCH'),
};
