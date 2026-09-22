export type ReferralStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'SENT'
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'CLARIFICATION_RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'APPOINTMENT_PENDING'
  | 'APPOINTMENT_CONFIRMED'
  | 'CHECKED_IN'
  | 'PATIENT_ARRIVED'
  | 'IN_CONSULTATION'
  | 'CONSULTED'
  | 'OUTCOME_RECORDED'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REROUTED';

export type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface ReferralEvent {
  id: string;
  status: ReferralStatus;
  timestamp: string;
  actorName: string;
  actorRole: string;
  facilityName: string;
  notes?: string;
}

export interface ClarificationRequest {
  requestedBy: string;
  role: string;
  facilityName: string;
  requestedAt: string;
  message: string;
}

export interface ClarificationResponse {
  respondedBy: string;
  role: string;
  respondedAt: string;
  message: string;
}

export interface Referral {
  id: string;
  referralCode: string; // e.g. "REF-2026-0891"
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  abhaId?: string;

  // Origin
  fromFacilityId: string;
  fromFacilityName: string;
  fromDoctorId: string;
  fromDoctorName: string;

  // Destination
  toFacilityId: string;
  toFacilityName: string;
  toSpecialty: string;
  toDoctorId?: string;
  toDoctorName?: string;

  // Clinical Context
  reasonForReferral: string;
  clinicalSummary: string;
  priority: ReferralPriority;
  requiredEquipment?: string[];
  requiredIcu?: boolean;

  // Status & SLA
  status: ReferralStatus;
  slaDeadline: string; // ISO date-time
  slaBreached: boolean;

  // Operational coordination & appointments
  appointmentId?: string;
  appointmentSlot?: string;
  tokenId?: string;
  tokenNumber?: string;

  // Clarification exchange
  clarificationRequest?: ClarificationRequest;
  clarificationResponse?: ClarificationResponse;

  // Rejection & diversion
  rejectionReason?: string;
  reroutedFromFacilityName?: string;

  // Consultation completion & closed loop
  clinicalOutcomeNotes?: string;
  consultedDoctorName?: string;
  consultedAt?: string;

  // Timeline events
  events: ReferralEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReferralRequest {
  patientId: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
  abhaId?: string;

  fromFacilityId?: string;
  fromFacilityName?: string;
  fromDoctorId?: string;
  fromDoctorName?: string;

  toFacilityId: string;
  toFacilityName?: string;
  toSpecialty: string;
  reasonForReferral: string;
  clinicalSummary: string;
  priority: ReferralPriority;
  requiredEquipment?: string[];
  requiredIcu?: boolean;
}
