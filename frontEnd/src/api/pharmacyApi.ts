import { apiRequest } from './client';
import { Prescription } from '@/types/clinical';
import { MedicineInventoryItem, DispensingRecord } from '@/types/resources';

export const pharmacyApi = {
  /**
   * Fetch all prescriptions
   */
  getPrescriptions: (patientId?: string) =>
    apiRequest<Prescription[]>('/prescriptions', 'GET', { patientId }),

  /**
   * Fetch a single prescription by ID
   */
  getPrescriptionById: (prescriptionId: string) =>
    apiRequest<Prescription>(`/prescriptions/${prescriptionId}`, 'GET'),

  /**
   * Dispense a prescription with pharmacist attribution, clinical notes, and stock deduction
   */
  dispensePrescription: (
    prescriptionId: string,
    payload?: { pharmacistName?: string; notes?: string }
  ) =>
    apiRequest<Prescription>(`/prescriptions/${prescriptionId}/dispense`, 'PATCH', payload),

  /**
   * Fetch current facility medicine inventory
   */
  getMedicines: (facilityId?: string) =>
    apiRequest<MedicineInventoryItem[]>('/medicines', 'GET', { facilityId }),

  getInventory: (facilityId?: string) =>
    apiRequest<MedicineInventoryItem[]>('/medicines', 'GET', { facilityId }),

  /**
   * Fetch a single medicine details
   */
  getMedicineById: (medicineId: string) =>
    apiRequest<MedicineInventoryItem>(`/medicines/${medicineId}`, 'GET'),

  /**
   * Quarantine a specific medicine batch (stops dispensing)
   */
  quarantineBatch: (medicineId: string, reason: string) =>
    apiRequest<MedicineInventoryItem>(`/medicines/${medicineId}/quarantine`, 'PATCH', { reason }),

  /**
   * Adjust medicine stock level (damage, disposal, restock, reconciliation)
   */
  adjustStock: (medicineId: string, delta: number, reason: string) =>
    apiRequest<MedicineInventoryItem>(`/medicines/${medicineId}/stock`, 'PATCH', { delta, reason }),

  /**
   * Fetch chronological dispensing history records
   */
  getDispensingHistory: () =>
    apiRequest<DispensingRecord[]>('/pharmacy/history', 'GET'),

  /**
   * Add a new medicine to hospital formulary inventory
   */
  addMedicine: (payload: Partial<MedicineInventoryItem>) =>
    apiRequest<MedicineInventoryItem>('/medicines', 'POST', payload),

  /**
   * Update an existing medicine formulation details
   */
  updateMedicine: (medicineId: string, payload: Partial<MedicineInventoryItem>) =>
    apiRequest<MedicineInventoryItem>(`/medicines/${medicineId}`, 'PUT', payload),

  /**
   * Delete a medicine from hospital inventory
   */
  deleteMedicine: (medicineId: string) =>
    apiRequest<{ id: string }>(`/medicines/${medicineId}`, 'DELETE'),
};
