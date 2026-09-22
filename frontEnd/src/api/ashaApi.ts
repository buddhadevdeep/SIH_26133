import { apiRequest } from './client';
import { AshaPatient, AshaVisit, ScreeningSession, FollowUpTask, FrontlineReferral } from '@/types/asha';
import { Vitals } from '@/types/clinical';

export const ashaApi = {
  getPatients: () =>
    apiRequest<AshaPatient[]>('/asha/patients', 'GET'),

  getCitizens: () =>
    apiRequest<AshaPatient[]>('/asha/patients', 'GET'),

  registerPatient: (data: Partial<AshaPatient>) =>
    apiRequest<AshaPatient>('/asha/patients', 'POST', data),

  getVisits: () =>
    apiRequest<AshaVisit[]>('/asha/visits', 'GET'),

  scheduleVisit: (data: Partial<AshaVisit>) =>
    apiRequest<AshaVisit>('/asha/visits', 'POST', data),

  createVisit: (data: Partial<AshaVisit>) =>
    apiRequest<AshaVisit>('/asha/visits', 'POST', data),

  updateVisit: (data: Partial<AshaVisit> & { id: string }) =>
    apiRequest<AshaVisit>('/asha/visits', 'PATCH', data),

  getTasks: () =>
    apiRequest<FollowUpTask[]>('/asha/tasks', 'GET'),

  updateTask: (id: string, isCompleted: boolean) =>
    apiRequest<FollowUpTask>('/asha/tasks', 'PATCH', { id, isCompleted }),

  getReferrals: () =>
    apiRequest<FrontlineReferral[]>('/asha/referrals', 'GET'),

  createReferral: (data: Partial<FrontlineReferral>) =>
    apiRequest<FrontlineReferral>('/asha/referrals', 'POST', data),

  recordVitals: (patientId: string, vitals: Partial<Vitals>) =>
    apiRequest<Vitals>(`/asha/patients/${patientId}/vitals`, 'POST', vitals),

  saveScreening: (session: Partial<ScreeningSession>) =>
    apiRequest<ScreeningSession>('/asha/screenings', 'POST', session),

  pushSyncQueue: (items: unknown[]) =>
    apiRequest<{ syncedCount: number; serverTimestamp: string }>('/sync/push', 'POST', { items }),
};
