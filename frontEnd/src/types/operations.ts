export type FacilityOperationalStatus =
  | 'OPEN'
  | 'LIMITED_SERVICES'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'CLOSED'
  | 'EMERGENCY_ONLY';

export type ServiceOperationalStatus = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';

export interface OperationalService {
  id: string;
  name: string;
  code: string;
  category: 'CLINICAL_OPD' | 'EMERGENCY_ICU' | 'DIAGNOSTICS' | 'PHARMACY' | 'SUPPORT_SERVICES';
  status: ServiceOperationalStatus;
  operatingHours: string;
  currentWaitMinutes: number;
  activeStaffCount: number;
  statusReason?: string;
  notes?: string;
  lastUpdated: string;
}

export type IssueSeverity = 'CRITICAL' | 'ATTENTION' | 'INFORMATIONAL';
export type IssueCategory = 'QUEUE' | 'REFERRAL' | 'RESOURCE' | 'STAFF' | 'SERVICE' | 'DIAGNOSTIC';

export interface OperationalIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface StaffDutyItem {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'GENERAL';
  status: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY' | 'ON_CALL';
  contactPhone: string;
  assignedLocation: string;
}

export interface OperationalAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'URGENT';
  createdAt: string;
  author: string;
  active: boolean;
}

export interface FacilityOperationsSummary {
  facilityId: string;
  facilityName: string;
  operationalStatus: FacilityOperationalStatus;
  statusReason?: string;
  lastStatusUpdate: string;
  updatedBy: string;
  totalActiveIssues: number;
  criticalIssuesCount: number;
  services: OperationalService[];
  announcements: OperationalAnnouncement[];
  telemetry: {
    totalWaitingQueue: number;
    avgQueueWaitMinutes: number;
    bedsOccupied: number;
    bedsTotal: number;
    bedsAvailable: number;
    icuAvailable: number;
    ambulancesReady: number;
    ambulancesTotal: number;
    pendingIncomingReferrals: number;
    staffOnDutyCount: number;
    pendingStaffLeavesCount?: number;
  };
}

export interface StaffLeaveOperationalImpact {
  leaveId?: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  facilityId: string;
  facilityName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalDoctorsInDepartment: number;
  availableDoctorsDuringPeriod: number;
  coverageStatus: 'ADEQUATE' | 'LIMITED' | 'CRITICAL_GAP';
  alternateDoctors: {
    id: string;
    name: string;
    specialty: string;
    status: string;
    facilityName: string;
    opdSchedule?: string;
  }[];
  affectedAppointments: import('./queue').Appointment[];
  affectedQueuesCount: number;
  recommendedAction: string;
}