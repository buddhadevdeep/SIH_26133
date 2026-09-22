import { apiRequest } from './client';
import { PatientHealthRecord, Prescription, DiagnosticOrder, Vitals, Encounter } from '@/types/clinical';

export const clinicalApi = {
  getPatientHealthRecord: (patientId: string) =>
    apiRequest<PatientHealthRecord>(`/patients/${patientId}/health-record`, 'GET'),

  getTimeline: (patientId: string) =>
    apiRequest<PatientHealthRecord['timeline']>(`/patients/${patientId}/timeline`, 'GET'),

  getPrescriptions: (patientId?: string) =>
    apiRequest<Prescription[]>('/prescriptions', 'GET', { patientId }),

  dispensePrescription: (prescriptionId: string) =>
    apiRequest<Prescription>(`/prescriptions/${prescriptionId}/dispense`, 'PATCH'),

  getDiagnosticOrders: (patientId?: string) =>
    apiRequest<DiagnosticOrder[]>('/diagnostics/orders', 'GET', { patientId }),

  collectSample: (orderId: string) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/collect`, 'PATCH'),

  processSample: (orderId: string, resultSummary?: string) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/process`, 'PATCH', { resultSummary }),

  saveVitals: (encounterId: string, vitals: Partial<Vitals>) =>
    apiRequest<Vitals>(`/encounters/${encounterId}/vitals`, 'POST', vitals),

  getEncounters: (params?: { patientId?: string; doctorId?: string; type?: string; status?: string }) =>
    apiRequest<Encounter[]>('/encounters', 'GET', params),

  getEncounterById: (encounterId: string) =>
    apiRequest<Encounter>(`/encounters/${encounterId}`, 'GET'),

  createEncounter: (data: Partial<Encounter>) =>
    apiRequest<Encounter>('/encounters', 'POST', data),

  createPrescription: (data: Partial<Prescription>) =>
    apiRequest<Prescription>('/prescriptions', 'POST', data),
};
