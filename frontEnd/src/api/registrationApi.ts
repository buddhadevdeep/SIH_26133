import { apiRequest } from './client';
import { RegisteredPatient, Appointment, Token } from '@/types/queue';

export const registrationApi = {
  searchPatients: (query?: string) =>
    apiRequest<RegisteredPatient[]>('/clerk/patients', 'GET', { search: query || '' }),

  getPatientById: (id: string) =>
    apiRequest<RegisteredPatient>(`/clerk/patients/${id}`, 'GET'),

  checkDuplicate: (data: { phone?: string; abhaId?: string; name?: string }) =>
    apiRequest<RegisteredPatient | null>('/clerk/patients/check-duplicate', 'POST', data),

  registerPatient: (data: Partial<RegisteredPatient>) =>
    apiRequest<RegisteredPatient>('/clerk/patients/register', 'POST', data),

  getAppointments: (filters?: { patientId?: string; status?: string; date?: string; facilityId?: string; search?: string }) =>
    apiRequest<Appointment[]>('/appointments', 'GET', filters),

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

  updateAppointment: (appointmentId: string, data: Partial<Appointment>) =>
    apiRequest<Appointment>(`/appointments/${appointmentId}`, 'PATCH', data),

  checkInAppointment: (appointmentId: string, data?: { roomNumber?: string; doctorId?: string; doctorName?: string }) =>
    apiRequest<{ appointment: Appointment; token: Token }>(`/appointments/${appointmentId}/check-in`, 'POST', data),

  bookAppointment: (data: Partial<Appointment>) =>
    apiRequest<Appointment>('/appointments', 'POST', data),
};
