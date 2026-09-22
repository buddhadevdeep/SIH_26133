export interface SystemHealthService {
  name: string; // "Express API", "MongoDB Primary", "ML Inference API", "Socket.IO Realtime", "Object Storage"
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
  details?: string;
}

export interface SystemHealthOverview {
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  services: SystemHealthService[];
  activeUsersCount: number;
  openSocketConnections: number;
  totalErrorsLast24h: number;
  queuedBackgroundJobs: number;
}

export interface PermissionMatrixItem {
  module: 'PATIENTS' | 'APPOINTMENTS' | 'QUEUE' | 'EHR' | 'REFERRALS' | 'RESOURCES' | 'AI_INSIGHTS' | 'SYSTEM_CONFIG';
  patient: { read: boolean; write: boolean; create: boolean; delete: boolean };
  asha: { read: boolean; write: boolean; create: boolean; delete: boolean };
  doctor: { read: boolean; write: boolean; create: boolean; delete: boolean };
  staff: { read: boolean; write: boolean; create: boolean; delete: boolean };
  districtAdmin: { read: boolean; write: boolean; create: boolean; delete: boolean };
  superAdmin: { read: boolean; write: boolean; create: boolean; delete: boolean };
}

export interface AiModelRegistryItem {
  id: string;
  modelName: string; // e.g. "DiseaseSurge-LSTM-v2.1", "SpecialistDemand-RF-v1.4", "BedOccupancy-Prophet-v3.0"
  targetMetric: string;
  algorithm: string;
  version: string;
  accuracyPercent?: number;
  mae?: number;
  rmse?: number;
  status: 'ACTIVE' | 'STAGING' | 'ARCHIVED' | 'TRAINING';
  deployedAt?: string;
  trainedOnRecords: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string; // e.g. "ACCESS_EHR_RECORD", "DISPENSE_NARCOTIC_DRUG", "UPDATE_BED_QUOTA", "DEPLOY_ML_MODEL"
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  details?: string;
}

export interface DistrictAdminProfile {
  id: string;
  name: string;
  designation: string; // e.g. "Chief District Health Officer (CDHO)" | "District Medical Officer (DMO)"
  district: string;
  state: string;
  email: string;
  phone: string;
  appointedAt: string;
  appointedBy: string; // "State Health Authority (Super Admin)"
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  jurisdictionFacilitiesCount: number;
  jurisdictionPopulation: number;
  privileges: string[];
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  doctorName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string; // e.g. "Attending National Cardiology Summit"
  category: 'CASUAL' | 'SICK' | 'CONFERENCE' | 'DUTY_OFF' | 'EMERGENCY' | 'EARNED';
  status: 'APPROVED' | 'PENDING' | 'CHANGES_REQUIRED' | 'REJECTED' | 'CANCELLED';
  handoverDoctorName?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  // Facility Operations scoping & workflow fields
  facilityId?: string;
  facilityName?: string;
  department?: string;
  rejectionReason?: string;
  changesRequestedNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  affectedAppointmentsCount?: number;
  serviceCoverageImpact?: 'ADEQUATE' | 'LIMITED' | 'CRITICAL_GAP';
}

export interface DistrictDoctor {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  facilityId: string;
  facilityName: string;
  status: 'ON_DUTY' | 'IN_OPD' | 'IN_SURGERY' | 'OFF_DUTY' | 'ON_LEAVE';
  phone: string;
  email: string;
  opdSchedule: string;
  patientsToday: number;
  teleconsultEnabled: boolean;
  avatar?: string;
  district: string;
  joinedDate?: string;
  registrationNumber?: string;
  opdRoom?: string;
  currentLeave?: DoctorLeave;
  upcomingLeaves?: DoctorLeave[];
}

export interface BloodCenter {
  id: string;
  name: string;
  licenseNo: string;
  type: 'BLOOD_BANK' | 'STORAGE_UNIT';
  totalCapacity: number;
  currentStock: number;
  phone: string;
  location: string;
  district: string;
  facilityId?: string;
  facilityName?: string;
  componentSeparation: boolean;
  emergencyHotline?: string;
  lastInspectionDate?: string;
}

