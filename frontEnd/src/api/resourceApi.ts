import { apiRequest } from './client';
import { BedSummary, BloodInventory, Ambulance, MedicineInventoryItem, EquipmentItem } from '@/types/resources';

export const resourceApi = {
  getBedSummary: (facilityId: string) =>
    apiRequest<BedSummary>(`/facilities/${facilityId}/bed-summary`, 'GET'),

  updateBedStatus: (facilityId: string, category: string, available: number) =>
    apiRequest<BedSummary>(`/facilities/${facilityId}/bed-summary`, 'PATCH', { category, available }),

  getBloodInventory: (facilityId?: string) =>
    apiRequest<BloodInventory>('/blood/inventory', 'GET', { facilityId }),

  getAmbulances: (facilityId?: string) =>
    apiRequest<Ambulance[]>('/ambulances', 'GET', { facilityId }),

  getMedicines: (facilityId?: string) =>
    apiRequest<MedicineInventoryItem[]>('/medicines', 'GET', { facilityId }),

  getEquipment: (facilityId?: string) =>
    apiRequest<EquipmentItem[]>('/equipment', 'GET', { facilityId }),
};
