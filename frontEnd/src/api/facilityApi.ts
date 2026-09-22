import { apiRequest } from './client';
import { Facility, FacilityFilterParams, FacilityMatchRequest, FacilityMatchResult } from '@/types/facility';

export const facilityApi = {
  getAll: (params?: FacilityFilterParams) =>
    apiRequest<Facility[]>('/facilities', 'GET', params),

  getById: (id: string) =>
    apiRequest<Facility>(`/facilities/${id}`, 'GET'),

  getNearby: (lat: number, lng: number, radiusKm: number = 25) =>
    apiRequest<Facility[]>('/facilities/nearby', 'GET', { lat, lng, radiusKm }),

  search: (query: string) =>
    apiRequest<Facility[]>('/facilities/search', 'GET', { query }),

  matchFacilities: (criteria: FacilityMatchRequest) =>
    apiRequest<FacilityMatchResult[]>('/facilities/match', 'POST', criteria),

  create: (data: Partial<Facility>) =>
    apiRequest<Facility>('/facilities', 'POST', data),

  update: (id: string, data: Partial<Facility>) =>
    apiRequest<Facility>(`/facilities/${id}`, 'PUT', data),

  delete: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/facilities/${id}`, 'DELETE'),
};

