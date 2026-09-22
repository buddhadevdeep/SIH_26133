import { Vitals } from './clinical';

export type FrontlineRoleMode = 'ALL' | 'ASHA' | 'ANM' | 'CHO';

export interface AshaPatient {
  id: string;
  ashaId: string;
  ashaName: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  village: string;
  wardNumber?: string;
  address: string;
  householdId?: string;
  householdHeadName?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  abhaId?: string;
  bloodGroup?: string;
  isHighRisk: boolean;
  highRiskReasons?: string[];
  registeredOffline?: boolean;
  syncStatus?: 'SYNCED' | 'LOCAL_PENDING';
  lastVisitDate?: string;
  nextFollowUpDate?: string;
  latestVitals?: Vitals;
  category?: 'MATERNAL' | 'INFANT' | 'NCD_HYPERTENSION' | 'NCD_DIABETES' | 'ELDERLY' | 'GENERAL';
  gestationalWeek?: number;
  immunizationStage?: string;
  createdAt: string;
}

export type ScreeningCategory = 'MATERNAL' | 'CHILD' | 'NCD' | 'GENERAL';

export interface ScreeningAnswer {
  questionId: string;
  questionText: string;
  answer: boolean | string | number;
  flagRaised?: boolean;
}

export interface ScreeningSession {
  id: string;
  patientId: string;
  patientName: string;
  category: ScreeningCategory;
  conductedBy: string;
  conductedAt: string;
  answers: ScreeningAnswer[];
  riskFlags: string[];
  riskScore: 'LOW' | 'MODERATE' | 'HIGH';
  recommendedNextAction: string;
  clinicianVerificationRequired: true;
  synced: boolean;
}

export type VisitType =
  | 'ANC'
  | 'PNC'
  | 'CHILD_IMMUNIZATION'
  | 'NCD_MONITORING'
  | 'ROUTINE_CHECKUP'
  | 'POST_DISCHARGE';

export type VisitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';

export interface AshaVisit {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  village?: string;
  address?: string;
  visitDate: string;
  timeSlot?: string;
  visitType?: VisitType;
  purpose: string;
  notes: string;
  vitalsRecorded?: Vitals;
  screeningConducted?: boolean;
  requiresReferral?: boolean;
  referralReason?: string;
  actionTaken?: string;
  status?: VisitStatus;
  isCompleted: boolean;
  completedAt?: string;
  nextScheduledDate?: string;
  // Doctor Prescription Metadata
  prescribedByDoctorName?: string;
  prescribedByDoctorSpecialty?: string;
  prescribedByDoctorFacility?: string;
  prescriptionDate?: string;
  prescribedDays?: number; // Days interval after which ASHA must visit
  doctorInstructions?: string; // Exact clinical advice from doctor
  prescribedChecks?: string[]; // Specific tests e.g. ['Blood Pressure', 'Blood Sugar', 'Wound Check']
  priority?: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'HIGH';
}

export interface FollowUpTask {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  village: string;
  category: 'ANC' | 'IMMUNIZATION' | 'NCD' | 'POST_DISCHARGE' | 'TB_FOLLOWUP';
  title: string;
  description: string;
  dueDate: string;
  urgency: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
  isCompleted: boolean;
  completedAt?: string;
  actionRequired: string;
}

export interface FrontlineReferral {
  id: string;
  referralNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Other';
  patientPhone: string;
  village: string;
  targetFacilityId: string;
  targetFacilityName: string;
  targetFacilityType: 'SUBCENTRE' | 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL';
  department: string;
  reason: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  ambulanceRequested: boolean;
  ambulanceStatus?: 'NOT_REQUIRED' | 'DISPATCHED' | 'ON_SCENE' | 'COMPLETED';
  status: 'INITIATED' | 'IN_TRANSIT' | 'ACCEPTED_AT_PHC' | 'CONSULTED' | 'COUNTER_REFERRED';
  doctorFeedback?: string;
  createdAt: string;
}

export interface OfflineSyncItem {
  id: string;
  entityType: 'PATIENT_REGISTRATION' | 'VITALS' | 'SCREENING' | 'VISIT_NOTE' | 'FOLLOWUP_TASK' | 'REFERRAL';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  errorDetails?: string;
}
