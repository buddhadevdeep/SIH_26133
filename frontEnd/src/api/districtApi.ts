import { apiRequest } from './client';
import { District } from '@/types/district';
import { Facility } from '@/types/facility';

export const districtApi = {
  getAll: (params?: { state?: string; status?: string }) =>
    apiRequest<District[]>('/districts', 'GET', params),

  getById: (id: string) =>
    apiRequest<District>(`/districts/${id}`, 'GET'),

  create: (data: Partial<District>) =>
    apiRequest<District>('/districts', 'POST', data),

  update: (id: string, data: Partial<District>) =>
    apiRequest<District>(`/districts/${id}`, 'PUT', data),

  getMyDistrict: () =>
    apiRequest<District>('/district/me', 'GET'),

  getMyFacilities: () =>
    apiRequest<Facility[]>('/district/me/facilities', 'GET'),

  getMyDoctors: () =>
    apiRequest<any[]>('/district/me/doctors', 'GET'),

  getMyStatistics: () =>
    apiRequest<{
      district: District;
      facilitiesCount: number;
      doctorsCount: number;
      patientsCount: number;
      appointmentsToday: number;
      activeTokensToday: number;
      encountersCount: number;
    }>('/district/me/statistics', 'GET'),
};
