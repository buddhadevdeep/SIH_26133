export type TokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'HOLD'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type PriorityLevel = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface Token {
  id: string;
  tokenNumber: string; // e.g. "A-042"
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'Other';
  patientPhone: string;
  facilityId: string;
  facilityName: string;
  departmentId: string;
  departmentName: string;
  doctorId?: string;
  doctorName?: string;
  roomNumber?: string;
  counter?: string;
  status: TokenStatus;
  priority: PriorityLevel;
  positionInQueue: number;
  estimatedWaitMinutes: number;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  referralId?: string;
  referralCode?: string;
}

export interface LiveQueueState {
  facilityId: string;
  departmentId: string;
  departmentName: string;
  currentTokenNumber: string; // e.g. "A-035"
  callingRoom: string;
  totalWaiting: number;
  averageConsultTimeMinutes: number;
  tokens: Token[];
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: 'M' | 'F' | 'Other';
  facilityId: string;
  facilityName: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  roomNumber?: string;
  departmentId?: string;
  departmentName?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  type: 'IN_PERSON' | 'TELECONSULT';
  reasonForVisit: string;
  createdAt: string;
  tokenNumber?: string;
  checkedInAt?: string;
  referralId?: string;
  referralCode?: string;
  createToken?: boolean;
}

export interface RegisteredPatient {
  id: string;
  name: string;
  phone: string;
  gender: 'M' | 'F' | 'Other';
  age: number;
  dob?: string;
  abhaId?: string;
  abhaVerified?: boolean;
  address?: string;
  district?: string;
  pincode?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  registeredAt: string;
  lastVisitAt?: string;
}

