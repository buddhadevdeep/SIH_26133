import { apiRequest } from './client';
import { DistrictDoctor } from '@/types/admin';

export interface BloodCenterItem {
  id: string;
  name: string;
  type: 'GOVERNMENT' | 'RED_CROSS' | 'CHARITABLE' | 'PRIVATE';
  facilityId?: string;
  facilityName?: string;
  district: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  isOpen24x7: boolean;
  componentsAvailable: string[];
  currentStockUnits: {
    'A+': number;
    'A-': number;
    'B+': number;
    'B-': number;
    'AB+': number;
    'AB-': number;
    'O+': number;
    'O-': number;
  };
  rareGroupAvailable: boolean;
  lastInspectionDate: string;
  licenseNumber: string;
  lat?: number;
  lng?: number;
}

export interface DistrictAdminItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  designation: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED';
  assignedDate: string;
  accessScope: string[];
}

export const directoryApi = {
  // Doctors
  getDoctors: (params?: { facilityId?: string; specialty?: string; search?: string }) =>
    apiRequest<DistrictDoctor[]>('/doctors', 'GET', params),

  createDoctor: (data: Partial<DistrictDoctor>) =>
    apiRequest<DistrictDoctor>('/doctors', 'POST', data),

  updateDoctor: (id: string, data: Partial<DistrictDoctor>) =>
    apiRequest<DistrictDoctor>(`/doctors/${id}`, 'PUT', data),

  deleteDoctor: (id: string) =>
    apiRequest<{ id: string; deleted: boolean }>(`/doctors/${id}`, 'DELETE'),

  updateDoctorStatus: (id: string, status: string) =>
    apiRequest<DistrictDoctor>(`/doctors/${id}/status`, 'PATCH', { status }),

  // Blood Centres
  getBloodCentres: (params?: { district?: string; search?: string }) =>
    apiRequest<BloodCenterItem[]>('/blood-centres', 'GET', params),

  createBloodCentre: (data: Partial<BloodCenterItem>) =>
    apiRequest<BloodCenterItem>('/blood-centres', 'POST', data),

  // District Admins
  getDistrictAdmins: () =>
    apiRequest<DistrictAdminItem[]>('/district-admins', 'GET'),

  createDistrictAdmin: (data: Partial<DistrictAdminItem>) =>
    apiRequest<DistrictAdminItem>('/district-admins', 'POST', data),

  updateDistrictAdminStatus: (id: string, status: string) =>
    apiRequest<DistrictAdminItem>(`/district-admins/${id}/status`, 'PATCH', { status }),
};
