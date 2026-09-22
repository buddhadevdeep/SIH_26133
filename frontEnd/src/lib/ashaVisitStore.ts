import { AshaVisit, VisitStatus } from '@/types/asha';
import { INITIAL_ASHA_VISITS } from '@/mock/mockData';
import { Vitals } from '@/types/clinical';
import { ashaApi } from '@/api/ashaApi';

const STORAGE_KEY = 'sanjeevani_asha_visits';
const EVENT_KEY = 'sanjeevani_visits_updated';

// Helper to calculate target date string YYYY-MM-DD from a start date and number of days
export function calculateTargetDate(startDate: string, days: number): string {
  try {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + days);
      return fallback.toISOString().split('T')[0];
    }
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + days);
    return fallback.toISOString().split('T')[0];
  }
}

// Get all visits from localStorage or fallback to initial mock data
export function getStoredAshaVisits(): AshaVisit[] {
  if (typeof window === 'undefined') {
    return INITIAL_ASHA_VISITS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASHA_VISITS));
      return INITIAL_ASHA_VISITS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASHA_VISITS));
    return INITIAL_ASHA_VISITS;
  } catch (err) {
    console.error('Failed to read asha visits from localStorage', err);
    return INITIAL_ASHA_VISITS;
  }
}

// Save or update an existing visit
export function saveStoredAshaVisit(visit: AshaVisit): AshaVisit[] {
  const current = getStoredAshaVisits();
  const index = current.findIndex((v) => v.id === visit.id);
  let updated: AshaVisit[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...visit };
    ashaApi.updateVisit(visit).catch((e) => console.warn('Asha visit backend update failed:', e));
  } else {
    updated = [visit, ...current];
    ashaApi.scheduleVisit(visit).catch((e) => console.warn('Asha visit backend create failed:', e));
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: updated }));
  }

  return updated;
}

// Doctor prescribes a new ASHA home visit
export interface PrescribeAshaVisitParams {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  village?: string;
  address?: string;
  prescribedDays: number; // e.g. 2, 3, 7 days
  doctorName: string;
  doctorSpecialty?: string;
  doctorFacility?: string;
  doctorInstructions: string;
  prescribedChecks: string[]; // e.g. ['Blood Pressure', 'Blood Sugar']
  priority?: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'HIGH';
  purpose?: string;
}

export function createDoctorPrescribedVisit(params: PrescribeAshaVisitParams): AshaVisit {
  const today = '2026-03-11'; // Consistent demo date
  const visitDueDate = calculateTargetDate(today, params.prescribedDays);

  const newVisit: AshaVisit = {
    id: `vis_doc_${Date.now()}`,
    patientId: params.patientId,
    patientName: params.patientName,
    patientPhone: params.patientPhone || '9876543210',
    village: params.village || 'Pethapur Ward 1',
    address: params.address || 'Near Community Hall',
    visitDate: visitDueDate,
    timeSlot: '10:00 AM - 11:00 AM',
    visitType: 'ROUTINE_CHECKUP',
    purpose: params.purpose || `Doctor Prescribed: ${params.prescribedChecks.join(', ')} Checkup`,
    notes: params.doctorInstructions,
    status: 'SCHEDULED',
    isCompleted: false,
    requiresReferral: params.priority === 'HIGH' || params.priority === 'URGENT',
    prescribedByDoctorName: params.doctorName,
    prescribedByDoctorSpecialty: params.doctorSpecialty || 'General Medicine',
    prescribedByDoctorFacility: params.doctorFacility || 'Civil Hospital Gandhinagar',
    prescriptionDate: today,
    prescribedDays: params.prescribedDays,
    doctorInstructions: params.doctorInstructions,
    prescribedChecks: params.prescribedChecks,
    priority: params.priority || 'PRIORITY',
  };

  saveStoredAshaVisit(newVisit);
  return newVisit;
}

// Complete a visit
export function completeAshaVisit(
  visitId: string,
  options?: {
    notes?: string;
    actionTaken?: string;
    vitalsRecorded?: Vitals;
    requiresReferral?: boolean;
    referralReason?: string;
  }
): AshaVisit[] {
  const current = getStoredAshaVisits();
  const updated = current.map((v) => {
    if (v.id === visitId) {
      return {
        ...v,
        isCompleted: true,
        status: 'COMPLETED' as VisitStatus,
        completedAt: new Date().toISOString(),
        notes: options?.notes !== undefined ? options.notes : v.notes,
        actionTaken: options?.actionTaken || v.actionTaken || 'Checkup completed, vitals recorded',
        vitalsRecorded: options?.vitalsRecorded || v.vitalsRecorded,
        requiresReferral: options?.requiresReferral !== undefined ? options.requiresReferral : v.requiresReferral,
        referralReason: options?.referralReason !== undefined ? options.referralReason : v.referralReason,
      };
    }
    return v;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: updated }));
  }

  return updated;
}

// React hook / listener for updates
export function subscribeToAshaVisits(callback: (visits: AshaVisit[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const custom = event as CustomEvent<AshaVisit[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getStoredAshaVisits());
    }
  };

  window.addEventListener(EVENT_KEY, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(EVENT_KEY, handler);
    window.removeEventListener('storage', handler);
  };
}
