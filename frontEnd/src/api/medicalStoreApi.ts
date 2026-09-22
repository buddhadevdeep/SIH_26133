import { apiRequest } from './client';
import { MedicalStore } from '@/types/medicalStore';
import { ApiResponse } from '@/types';

export interface GetMedicalStoresParams {
  district?: string;
  type?: string;
  isJanAushadhi?: boolean;
  openNow?: boolean;
  search?: string;  
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export const medicalStoreApi = {
  getAll: (params?: GetMedicalStoresParams): Promise<ApiResponse<MedicalStore[]>> =>
    apiRequest<MedicalStore[]>('/medical-stores', 'GET', params),

  getById: (id: string): Promise<ApiResponse<MedicalStore>> =>
    apiRequest<MedicalStore>(`/medical-stores/${id}`, 'GET'),

  create: (data: Partial<MedicalStore>): Promise<ApiResponse<MedicalStore>> =>
    apiRequest<MedicalStore>('/medical-stores', 'POST', data),

  update: (id: string, data: Partial<MedicalStore>): Promise<ApiResponse<MedicalStore>> =>
    apiRequest<MedicalStore>(`/medical-stores/${id}`, 'PUT', data),

  delete: (id: string): Promise<ApiResponse<{ id: string }>> =>
    apiRequest<{ id: string }>(`/medical-stores/${id}`, 'DELETE'),
};
